"use strict";

const User = require("../models/userModel");
const Order = require("../models/orderModel");
const Notification = require("../models/notificationModel");
const ServiceProvider = require("../models/serviceProviderModel");
const bcrypt = require("bcryptjs");

// ─── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fields that must never be patchable by the user themselves */
const IMMUTABLE_FIELDS = new Set([
  "role",
  "password",
  "isVerified",
  "otp",
  "otpExpiry",
  "loginAttempts",
  "lockUntil",
  "_id",
]);

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * GET /api/user/profile
 * Returns the authenticated user's profile (no sensitive fields).
 * @access Private
 */
exports.getProfile = async (req, res) => {
  try {
    // Schema has `select: false` on sensitive fields; no need for .select("-password")
    const user = await User.findById(req.user.id).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (err) {
    console.error("[getProfile]", err);
    return res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

/**
 * GET /api/user/all
 * Returns all users. Admin-only.
 * Supports pagination via ?page=1&limit=20
 * @access Private (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Optional search by name or email
    const search = req.query.search?.trim();
    const filter = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
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
    console.error("[getAllUsers]", err);
    return res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
};

/**
 * PATCH /api/user/profile
 * Updates mutable profile fields for the authenticated user.
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, mobile, serviceAreas, profilePicture, location } = req.body;

    // Build update object — only include fields actually provided
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must be at least 2 characters",
        });
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid email address",
        });
      }

      const existing = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: req.user.id },
      }).lean();

      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Email is already in use by another account",
        });
      }

      updates.email = normalizedEmail;
    }

    if (mobile !== undefined) {
      if (!/^\+?[1-9]\d{9,14}$/.test(mobile?.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid mobile number",
        });
      }
      // Check if mobile is already taken by another user
      const existing = await User.findOne({ mobile: mobile.trim(), _id: { $ne: req.user.id } }).lean();
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Mobile number is already in use by another account",
        });
      }
      updates.mobile = mobile.trim();
    }

    if (serviceAreas !== undefined) {
      updates.serviceAreas = typeof serviceAreas === "string" ? serviceAreas.trim() : undefined;
    }

    if (profilePicture !== undefined) {
      if (typeof profilePicture !== "string" || !profilePicture.startsWith("http")) {
        return res.status(400).json({
          success: false,
          message: "profilePicture must be a valid URL",
        });
      }
      updates.profilePicture = profilePicture.trim();
    }

    if (location !== undefined) {
      if (
        !location.coordinates ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2
      ) {
        return res.status(400).json({
          success: false,
          message: "location.coordinates must be [longitude, latitude]",
        });
      }

      const [lng, lat] = location.coordinates;
      if (
        typeof lng !== "number" ||
        typeof lat !== "number" ||
        lng < -180 || lng > 180 ||
        lat < -90 || lat > 90
      ) {
        return res.status(400).json({
          success: false,
          message: "Coordinates out of range. Longitude: -180–180, Latitude: -90–90",
        });
      }

      updates.location = { type: "Point", coordinates: [lng, lat] };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("[updateProfile]", err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `This ${field} is already in use`,
      });
    }

    return res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

/**
 * GET /api/user/orders
 * Returns paginated orders for the authenticated user, newest first.
 * Supports ?page=1&limit=10&status=pending
 * @access Private
 */
exports.getUserOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const VALID_STATUSES = ["pending", "accepted", "in_progress", "ready", "delivered", "cancelled"];
    const statusFilter = req.query.status && VALID_STATUSES.includes(req.query.status)
      ? { status: req.query.status }
      : {};

    const filter = { userId: req.user.id, ...statusFilter };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("providerId", "name email mobile address rating") // only safe fields
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
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
    console.error("[getUserOrders]", err);
    return res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

/**
 * DELETE /api/user/account
 * Permanently deletes the user account and all associated data.
 * Requires current password confirmation in request body.
 * @access Private
 */
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Please provide your current password to confirm account deletion",
      });
    }

    // Explicitly select password (it has select: false)
    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // ── Cascade delete associated data ────────────────────────────────────────
    await Promise.allSettled([
      Order.updateMany(
        { userId: user._id },
        { $set: { status: "cancelled" } }        // soft-cancel in-flight orders
      ),
      Notification.deleteMany({ userId: user._id }),
      // If user is a dhobi, soft-deactivate their service provider profile
      user.role === "dhobi"
        ? ServiceProvider.findOneAndUpdate(
          { userId: user._id },
          { $set: { isActive: false, isApproved: "rejected" } }
        )
        : Promise.resolve(),
    ]);

    await User.deleteOne({ _id: user._id });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully. We're sorry to see you go.",
    });
  } catch (err) {
    console.error("[deleteAccount]", err);
    return res.status(500).json({ success: false, message: "Failed to delete account" });
  }
};

/**
 * PATCH /api/user/change-password
 * Lets an authenticated user change their own password.
 * Body: { currentPassword, newPassword }
 * @access Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both currentPassword and newPassword are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters",
      });
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    // Reset lock state on password change
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("[changePassword]", err);
    return res.status(500).json({ success: false, message: "Failed to change password" });
  }
};
