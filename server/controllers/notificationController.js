"use strict";

const Notification = require("../models/notificationModel");
const { isValidObjectId } = require("mongoose");
const { getIO } = require("../socket");

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateId = (id, res, label = "Resource") => {
    if (!isValidObjectId(id)) {
        res.status(400).json({ success: false, message: `Invalid ${label} ID` });
        return false;
    }
    return true;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/notification
 * Returns paginated notifications for the authenticated user.
 * Supports filtering by read/unread state.
 *
 * @query page, limit, isRead (true|false|all — default: all)
 * @access Private
 */
exports.getNotifications = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const filter = { userId: req.user.id };

        // ?isRead=true  → only read
        // ?isRead=false → only unread
        // ?isRead=all or omitted → both
        if (req.query.isRead === "true") filter.isRead = true;
        if (req.query.isRead === "false") filter.isRead = false;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("orderId", "orderId status amount")
                .lean(),
            Notification.countDocuments(filter),
            // Always return unread count so client can badge the bell icon
            Notification.countDocuments({ userId: req.user.id, isRead: false }),
        ]);

        return res.status(200).json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
        });
    } catch (err) {
        console.error("[getNotifications]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
};

/**
 * GET /api/notification/unread-count
 * Returns only the count of unread notifications for the bell badge.
 * Lightweight alternative to fetching the full list.
 *
 * @access Private
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            userId: req.user.id,
            isRead: false,
        });

        return res.status(200).json({ success: true, data: { unreadCount: count } });
    } catch (err) {
        console.error("[getUnreadCount]", err);
        return res.status(500).json({ success: false, message: "Failed to fetch unread count" });
    }
};

/**
 * PATCH /api/notification/:id/read
 * Marks a single notification as read.
 * Only the notification's owner can mark it.
 *
 * @access Private
 */
exports.markAsRead = async (req, res) => {
    if (!validateId(req.params.id, res, "Notification")) return;

    try {
        const notification = await Notification.findById(req.params.id);
        const currentUserId = req.user.id.toString();

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        // Ownership check — users can only mark their own notifications
        if (notification.userId.toString() !== currentUserId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        if (notification.isRead) {
            return res.status(200).json({
                success: true,
                message: "Notification already marked as read",
                data: notification,
            });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            data: notification,
        });
    } catch (err) {
        console.error("[markAsRead]", err);
        return res.status(500).json({ success: false, message: "Failed to mark notification as read" });
    }
};

/**
 * PATCH /api/notification/read-all
 * Marks ALL unread notifications for the authenticated user as read.
 * Uses updateMany for a single DB round-trip.
 *
 * @access Private
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { userId: req.user.id, isRead: false },
            { $set: { isRead: true } }
        );

        return res.status(200).json({
            success: true,
            message: `${result.modifiedCount} notification(s) marked as read`,
            data: { modifiedCount: result.modifiedCount },
        });
    } catch (err) {
        console.error("[markAllAsRead]", err);
        return res.status(500).json({ success: false, message: "Failed to mark notifications as read" });
    }
};

/**
 * DELETE /api/notification/:id
 * Deletes a single notification.
 * Only the owner can delete their own notification.
 *
 * @access Private
 */
exports.deleteNotification = async (req, res) => {
    if (!validateId(req.params.id, res, "Notification")) return;

    try {
        const notification = await Notification.findById(req.params.id);
        const currentUserId = req.user.id.toString();

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        if (notification.userId.toString() !== currentUserId) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        await notification.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (err) {
        console.error("[deleteNotification]", err);
        return res.status(500).json({ success: false, message: "Failed to delete notification" });
    }
};

/**
 * DELETE /api/notification/clear-all
 * Deletes ALL notifications for the authenticated user.
 * Uses deleteMany for a single DB round-trip.
 *
 * @access Private
 */
exports.clearAllNotifications = async (req, res) => {
    try {
        const result = await Notification.deleteMany({ userId: req.user.id });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} notification(s) cleared`,
            data: { deletedCount: result.deletedCount },
        });
    } catch (err) {
        console.error("[clearAllNotifications]", err);
        return res.status(500).json({ success: false, message: "Failed to clear notifications" });
    }
};

/**
 * POST /api/notification/send
 * Admin manually sends a notification to a specific user or all users.
 * Also emits a real-time socket event.
 *
 * Body: { userId? (omit for broadcast), message, type }
 * @access Private (Admin)
 */
exports.sendNotification = async (req, res) => {
    try {
        const { userId, message, type } = req.body;

        if (!message?.trim()) {
            return res.status(400).json({ success: false, message: "Message is required" });
        }

        const VALID_TYPES = ["order", "service", "general"];
        if (!type || !VALID_TYPES.includes(type)) {
            return res.status(400).json({
                success: false,
                message: `Type must be one of: ${VALID_TYPES.join(", ")}`,
            });
        }

        const io = getIO();

        // ── Broadcast to all users ─────────────────────────────────────────────
        if (!userId) {
            const User = require("../models/userModel");
            const users = await User.find({ role: { $ne: "admin" } }).select("_id").lean();

            if (!users.length) {
                return res.status(200).json({
                    success: true,
                    message: "No users to notify",
                    data: { notified: 0 },
                });
            }

            const docs = users.map((u) => ({
                userId: u._id,
                message: message.trim(),
                type,
            }));

            const saved = await Notification.insertMany(docs, { ordered: false });

            for (const n of saved) {
                io.to(n.userId.toString()).emit("receive-notification", n);
            }

            return res.status(201).json({
                success: true,
                message: `Broadcast sent to ${saved.length} user(s)`,
                data: { notified: saved.length },
            });
        }

        // ── Single user notification ───────────────────────────────────────────
        if (!isValidObjectId(userId)) {
            return res.status(400).json({ success: false, message: "Invalid userId" });
        }

        const User = require("../models/userModel");
        const target = await User.findById(userId).select("_id role").lean();
        if (!target) {
            return res.status(404).json({ success: false, message: "Target user not found" });
        }

        const notification = await Notification.create({
            userId,
            message: message.trim(),
            type,
        });

        io.to(userId.toString()).emit("receive-notification", notification);

        return res.status(201).json({
            success: true,
            message: "Notification sent successfully",
            data: notification,
        });
    } catch (err) {
        console.error("[sendNotification]", err);
        return res.status(500).json({ success: false, message: "Failed to send notification" });
    }
};
