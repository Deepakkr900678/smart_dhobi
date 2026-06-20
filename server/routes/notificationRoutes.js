"use strict";

const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  sendNotification,
} = require("../controllers/notificationController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// All notification routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTANT — route ordering:
// Static paths (/unread-count, /read-all, /clear-all, /send) MUST be declared
// before param-based paths (/:id, /:id/read) to prevent Express from treating
// "unread-count" or "read-all" as an :id value.
// ─────────────────────────────────────────────────────────────────────────────

// ── Static routes first ────────────────────────────────────────────────────────

/**
 * @route   GET /api/notification/unread-count
 * @desc    Get count of unread notifications (lightweight — for bell badge)
 * @access  Private
 */
router.get("/unread-count", getUnreadCount);

/**
 * @route   PATCH /api/notification/read-all
 * @desc    Mark all of the authenticated user's notifications as read
 * @access  Private
 */
router.patch("/read-all", markAllAsRead);

/**
 * @route   DELETE /api/notification/clear-all
 * @desc    Delete all notifications for the authenticated user
 * @access  Private
 */
router.delete("/clear-all", clearAllNotifications);

/**
 * @route   POST /api/notification/send
 * @desc    Admin sends a notification to one user or broadcasts to all
 * @body    { userId? (omit for broadcast), message, type }
 * @access  Private (Admin)
 */
router.post("/send", adminMiddleware, sendNotification);

// ── Param-based routes last ────────────────────────────────────────────────────

/**
 * @route   GET /api/notification
 * @desc    Get paginated notifications for the authenticated user
 * @query   page, limit, isRead (true | false | omit for all)
 * @access  Private
 */
router.get("/", getNotifications);

/**
 * @route   PATCH /api/notification/:id/read
 * @desc    Mark a single notification as read (ownership enforced)
 * @access  Private
 */
router.patch("/:id/read", markAsRead);

/**
 * @route   DELETE /api/notification/:id
 * @desc    Delete a single notification (ownership enforced)
 * @access  Private
 */
router.delete("/:id", deleteNotification);

module.exports = router;