"use strict";

const Review = require("../models/reviewModel");
const Order = require("../models/orderModel");
const ServiceProvider = require("../models/serviceProviderModel");
const { isValidObjectId } = require("mongoose");

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
 * POST /api/review/submit
 * Submit a review for a completed, delivered order.
 *
 * Rules enforced:
 *  - Order must exist and belong to the requesting user
 *  - Order must be in "delivered" status (can't review unfinished orders)
 *  - providerId in body must match the order's actual provider (prevents spoofing)
 *  - One review per order per user (unique index on model backs this up)
 *  - Rating must be an integer 1–5
 *
 * @access Private (User)
 */
exports.submitReview = async (req, res) => {
    try {
        const { orderId, providerId, rating, comment } = req.body;
        const userId = req.user.id; // fixed: was req.user.userId — JWT payload uses "id"

        // ── Field presence ───────────────────────────────────────────────────────
        const missing = [];
        if (!orderId) missing.push("orderId");
        if (!providerId) missing.push("providerId");
        if (rating === undefined || rating === null) missing.push("rating");

        if (missing.length) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missing.join(", ")}`,
            });
        }

        // ── ObjectId validation ──────────────────────────────────────────────────
        if (!isValidObjectId(orderId)) {
            return res.status(400).json({ success: false, message: "Invalid orderId" });
        }
        if (!isValidObjectId(providerId)) {
            return res.status(400).json({ success: false, message: "Invalid providerId" });
        }

        // ── Rating validation ────────────────────────────────────────────────────
        const parsedRating = Number(rating);
        if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a whole number between 1 and 5",
            });
        }

        // ── Comment validation (optional but bounded) ────────────────────────────
        if (comment !== undefined) {
            if (typeof comment !== "string" || comment.trim().length === 0) {
                return res.status(400).json({ success: false, message: "Comment cannot be empty if provided" });
            }
            if (comment.trim().length > 1000) {
                return res.status(400).json({ success: false, message: "Comment cannot exceed 1000 characters" });
            }
        }

        // ── Order existence + ownership check ────────────────────────────────────
        const order = await Order.findById(orderId).lean();
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.userId.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can only review your own orders",
            });
        }

        // ── Order must be delivered before it can be reviewed ────────────────────
        if (order.status !== "delivered") {
            return res.status(400).json({
                success: false,
                message: `Order must be delivered before it can be reviewed (current status: "${order.status}")`,
            });
        }

        // ── Prevent providerId spoofing — use the order's actual provider ────────
        if (order.providerId.toString() !== providerId) {
            return res.status(400).json({
                success: false,
                message: "providerId does not match the order's provider",
            });
        }

        // ── Duplicate review check (DB unique index is the final guard) ──────────
        const existingReview = await Review.findOne({ orderId, userId }).lean();
        if (existingReview) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted a review for this order",
            });
        }

        // ── Create review (post-save hook on model updates provider rating) ───────
        const review = await Review.create({
            orderId,
            userId,
            providerId,
            rating: parsedRating,
            comment: comment?.trim(),
        });

        return res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            data: {
                _id: review._id,
                orderId: review.orderId,
                providerId: review.providerId,
                rating: review.rating,
                comment: review.comment,
                createdAt: review.createdAt,
            },
        });
    } catch (err) {
        console.error("[submitReview]", err);

        // Unique index violation (race condition — user submitted twice simultaneously)
        if (err.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already submitted a review for this order",
            });
        }

        if (err.name === "ValidationError") {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(". ") });
        }

        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * GET /api/review/provider/:id
 * Get all visible reviews for a provider with pagination and average rating.
 * @query page, limit
 * @access Public
 */
exports.getProviderReviews = async (req, res) => {
    if (!validateId(req.params.id, res, "Provider")) return;

    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        // Only show visible reviews (isVisible: true — admins can hide abusive ones)
        const filter = { providerId: req.params.id, isVisible: true };

        const [reviews, total, ratingAgg] = await Promise.all([
            Review.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("userId", "name profilePicture") // show reviewer name + avatar
                .lean(),
            Review.countDocuments(filter),
            // Compute live average rating for this page's context
            Review.aggregate([
                { $match: { providerId: require("mongoose").Types.ObjectId.createFromHexString(req.params.id), isVisible: true } },
                { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
            ]),
        ]);

        const averageRating = ratingAgg[0]
            ? Math.round(ratingAgg[0].avg * 10) / 10
            : null;

        return res.status(200).json({
            success: true,
            data: {
                averageRating,
                totalReviews: total,
                reviews,
            },
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
        console.error("[getProviderReviews]", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * DELETE /api/review/:id
 * Admin soft-deletes (hides) a review without removing it from the DB.
 * This preserves data integrity for the provider's rating history.
 * @access Private (Admin)
 */
exports.hideReview = async (req, res) => {
    if (!validateId(req.params.id, res, "Review")) return;

    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        if (!review.isVisible) {
            return res.status(409).json({ success: false, message: "Review is already hidden" });
        }

        review.isVisible = false;
        await review.save(); // triggers post-save hook to recalculate provider rating

        return res.status(200).json({
            success: true,
            message: "Review hidden successfully",
        });
    } catch (err) {
        console.error("[hideReview]", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * GET /api/review/my
 * Returns all reviews written by the authenticated user.
 * @query page, limit
 * @access Private (User)
 */
exports.getMyReviews = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const filter = { userId: req.user.id };

        const [reviews, total] = await Promise.all([
            Review.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("providerId", "name address rating")
                .lean(),
            Review.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: reviews,
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
        console.error("[getMyReviews]", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};