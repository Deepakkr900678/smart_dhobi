"use strict";

const UserModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ServiceProvider = require("../models/serviceProviderModel");
const Notification = require("../models/notificationModel");
const { getIO } = require("../socket");
const { sendOtpEmail } = require("../utils/emailService");

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const BCRYPT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Cryptographically random 6-digit OTP */
const generateOTP = () => {
  const min = 100_000;
  const range = 900_000;
  // Use crypto.randomInt for uniform distribution (no modulo bias)
  const { randomInt } = require("crypto");
  return randomInt(min, min + range).toString();
};

/**
 * Constant-time OTP comparison to prevent timing attacks.
 * Both strings are padded to the same length before comparison.
 */
const safeCompareOtp = (a, b) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const { timingSafeEqual } = require("crypto");
  const bufA = Buffer.from(a.padEnd(10));
  const bufB = Buffer.from(b.padEnd(10));
  return timingSafeEqual(bufA, bufB);
};

/** Strip sensitive fields before sending user data to client */
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  return obj;
};

/** Emit a notification to all admins via Socket.IO */
const notifyAdmins = async (message, type = "general") => {
  try {
    const admins = await UserModel.find({ role: "admin" }).select("_id").lean();
    if (!admins.length) return;

    const io = getIO();
    const notifications = admins.map((admin) => ({
      userId: admin._id,
      type,
      message,
    }));

    const saved = await Notification.insertMany(notifications, { ordered: false });

    for (const notification of saved) {
      io.to(notification.userId.toString()).emit("receive-notification", notification);
    }
  } catch (err) {
    // Non-critical: log but don't bubble up
    console.error("[notifyAdmins] Failed to send admin notifications:", err.message);
  }
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /auth/register
 * Body: { name, email, password, mobile, location, role?, serviceAreas? }
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile, serviceAreas, location, role } = req.body;

    // ── Validate required fields ──────────────────────────────────────────────
    const missing = [];
    if (!name?.trim()) missing.push("name");
    if (!email?.trim()) missing.push("email");
    if (!password) missing.push("password");
    if (!mobile?.trim()) missing.push("mobile");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // ── Validate location ─────────────────────────────────────────────────────
    if (
      !location ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Location must include coordinates as [longitude, latitude]",
      });
    }

    const [lng, lat] = location.coordinates;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
      return res.status(400).json({
        success: false,
        message: "Coordinates out of range. Longitude: -180–180, Latitude: -90–90",
      });
    }

    // ── Validate role ─────────────────────────────────────────────────────────
    const allowedRoles = ["user", "dhobi"];
    const userRole = role && allowedRoles.includes(role) ? role : "user";
    // Prevent clients from self-assigning admin role
    if (role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot register with admin role",
      });
    }

    // ── Check for duplicates ──────────────────────────────────────────────────
    const existingEmail = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).lean();
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const existingMobile = await UserModel.findOne({ mobile: mobile.trim() }).lean();
    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: "An account with this mobile number already exists",
      });
    }

    // ── Create user ───────────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_TTL_MS);

    const user = await UserModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      mobile: mobile.trim(),
      serviceAreas: serviceAreas?.trim(),
      location: {
        type: "Point",
        coordinates: [lng, lat],
      },
      role: userRole,
      otp,
      otpExpiry,
      // Users always need OTP verification; dhobis need admin approval too
      isVerified: false,
    });

    // ── Send OTP ──────────────────────────────────────────────────────────────
    await sendOtpEmail(email.trim().toLowerCase(), otp);

    // ── Notify admins (non-blocking) ──────────────────────────────────────────
    notifyAdmins(`New ${userRole} registered: ${name.trim()} (${email.trim().toLowerCase()})`);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email with the OTP sent.",
      userId: user._id,
    });
  } catch (err) {
    console.error("[register]", err);

    // Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }

    // Duplicate key (race condition)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }

    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /auth/verify-otp
 * Body: { email, otp }
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email?.trim() || !otp?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // Explicitly select OTP fields (they have `select: false` in schema)
    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).select("+otp +otpExpiry");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account is already verified" });
    }

    if (!user.otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (!safeCompareOtp(user.otp, otp.trim())) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account verified successfully. You can now log in.",
    });
  } catch (err) {
    console.error("[verifyOtp]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Explicitly select password and lock fields
    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password +loginAttempts +lockUntil");

    if (!user) {
      // Generic message to prevent email enumeration
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ── Account lock check ────────────────────────────────────────────────────
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const retryAfterMs = user.lockUntil - Date.now();
      const retryAfterMin = Math.ceil(retryAfterMs / 60_000);
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to too many failed attempts. Try again in ${retryAfterMin} minute(s).`,
      });
    }

    // ── Password check ────────────────────────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        await user.save();
        return res.status(423).json({
          success: false,
          message: `Too many failed attempts. Account locked for ${LOCK_DURATION_MS / 60_000} minutes.`,
        });
      }

      await user.save();
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // ── Verification check ────────────────────────────────────────────────────
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending approval. We're reviewing your details and will notify you within 24 hours. Check your email for updates!",
      });
    }

    // ── Reset failed attempts on successful login ──────────────────────────
    if (user.loginAttempts > 0 || user.lockUntil) {
      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // ── Resolve mainUserId for dhobi role ─────────────────────────────────────
    let mainUserId = user._id;
    if (user.role === "dhobi") {
      const provider = await ServiceProvider.findOne({ userId: user._id })
        .select("_id")
        .lean();
      if (provider) {
        mainUserId = provider._id;
      }
    }

    // ── Issue JWT ─────────────────────────────────────────────────────────────
    const tokenExpiry = process.env.JWT_EXPIRES_IN || "7d";
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      expiresIn: tokenExpiry,
      user: sanitizeUser(user),
      mainUserId,
    });
  } catch (err) {
    console.error("[login]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /auth/logout
 * Stateless JWT: instruct client to discard token.
 * If you need server-side invalidation, implement a token denylist (Redis).
 */
exports.logout = (_req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Please discard your token on the client.",
  });
};

/**
 * POST /auth/forgot-password
 * Body: { email }
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });

    // Always return 200 to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account with that email exists, an OTP has been sent.",
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendOtpEmail(email.trim().toLowerCase(), otp);

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, an OTP has been sent.",
    });
  } catch (err) {
    console.error("[forgotPassword]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /auth/reset-password
 * Body: { email, otp, newPassword }
 */
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email?.trim() || !otp?.trim() || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).select("+otp +otpExpiry +password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.otp || !user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: "OTP has expired. Please request a new one." });
    }

    if (!safeCompareOtp(user.otp, otp.trim())) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Prevent reuse of old password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.otp = undefined;
    user.otpExpiry = undefined;
    // Reset lock state on successful password reset
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successful. You can now log in with your new password.",
    });
  } catch (err) {
    console.error("[resetPassword]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /auth/resend-otp
 * Body: { email }
 * Allows users to request a fresh OTP if the previous one expired.
 */
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await UserModel.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "Account is already verified" });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
    await user.save();

    await sendOtpEmail(email.trim().toLowerCase(), otp);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email",
    });
  } catch (err) {
    console.error("[resendOtp]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};