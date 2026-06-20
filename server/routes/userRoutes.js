// const express = require('express');
// const router = express.Router();
// const { getProfile, updateProfile, getUserOrders, deleteAccount, getAllUsers } = require('../controllers/userController');
// const authMiddleware = require('../middlewares/authMiddleware');

// router.get('/profile', authMiddleware, getProfile);
// router.get('/all', getAllUsers);
// router.patch('/profile', authMiddleware, updateProfile);
// router.get('/orders', authMiddleware, getUserOrders);
// router.delete('/account', authMiddleware, deleteAccount);

// module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();

const {
    getProfile,
    updateProfile,
    getUserOrders,
    deleteAccount,
    getAllUsers,
    changePassword,
} = require("../controllers/userController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

/**
 * @route   GET /api/user/profile
 * @desc    Get authenticated user's profile
 * @access  Private
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * @route   GET /api/user/all
 * @desc    Get all users with pagination and optional search
 * @query   page, limit, search
 * @access  Private (Admin only)
 */
router.get("/all", authMiddleware, adminMiddleware, getAllUsers);

/**
 * @route   PATCH /api/user/profile
 * @desc    Update authenticated user's profile
 * @access  Private
 */
router.patch("/profile", authMiddleware, updateProfile);

/**
 * @route   PATCH /api/user/change-password
 * @desc    Change authenticated user's password
 * @access  Private
 */
router.patch("/change-password", authMiddleware, changePassword);

/**
 * @route   GET /api/user/orders
 * @desc    Get authenticated user's orders with pagination
 * @query   page, limit, status
 * @access  Private
 */
router.get("/orders", authMiddleware, getUserOrders);

/**
 * @route   DELETE /api/user/account
 * @desc    Permanently delete authenticated user's account (requires password)
 * @access  Private
 */
router.delete("/account", authMiddleware, deleteAccount);

module.exports = router;
