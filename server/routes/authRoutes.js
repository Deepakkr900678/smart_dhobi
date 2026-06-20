"use strict";

const express = require("express");
const {
    register,
    verifyOtp,
    login,
    logout,
    forgotPassword,
    resetPassword,
    resendOtp,
} = require("../controllers/authController");

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user or dhobi
 * @access  Public
 */
router.post("/register", register);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify account with OTP sent to email
 * @access  Public
 */
router.post("/verify-otp", verifyOtp);

/**
 * @route   POST /api/auth/resend-otp
 * @desc    Resend OTP to email (if expired or lost)
 * @access  Public
 */
router.post("/resend-otp", resendOtp);

/**
 * @route   POST /api/auth/login
 * @desc    Login and receive JWT
 * @access  Public
 */
router.post("/login", login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout (client must discard token)
 * @access  Public
 */
router.post("/logout", logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send OTP to email for password reset
 * @access  Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using OTP
 * @access  Public
 */
router.post("/reset-password", resetPassword);

module.exports = router;