"use strict";

const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getAllProviders,
  getProviderById,
  approveProvider,
  rejectProvider,
  banProvider,
  unbanProvider,
  getAllUsers,
  banUser,
  unbanUser,
  getAllOrders,
  getAllTransactions,
  generateReports,
} = require("../controllers/adminController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// All admin routes require authentication + admin role
router.use(authMiddleware, adminMiddleware);

// ── Dashboard ──────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/dashboard
 * @desc    Platform-wide stats: user counts, earnings, order breakdown
 * @access  Private (Admin)
 */
router.get("/dashboard", getDashboardStats);

// ── Providers ──────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/providers
 * @desc    All service providers with pagination (?page, ?limit, ?status, ?search)
 * @access  Private (Admin)
 */
router.get("/providers", getAllProviders);

/**
 * @route   GET /api/admin/provider/:id
 * @desc    Single provider with stats
 * @access  Private (Admin)
 */
router.get("/provider/:id", getProviderById);

/**
 * @route   PATCH /api/admin/provider/:id/approve
 * @desc    Approve a pending provider application
 * @access  Private (Admin)
 */
router.patch("/provider/:id/approve", approveProvider);

/**
 * @route   PATCH /api/admin/provider/:id/reject
 * @desc    Reject a pending provider application
 * @body    { reason? }
 * @access  Private (Admin)
 */
router.patch("/provider/:id/reject", rejectProvider);

/**
 * @route   PATCH /api/admin/provider/:id/ban
 * @desc    Suspend an approved provider
 * @body    { reason? }
 * @access  Private (Admin)
 */
router.patch("/provider/:id/ban", banProvider);

/**
 * @route   PATCH /api/admin/provider/:id/unban
 * @desc    Reactivate a suspended provider
 * @access  Private (Admin)
 */
router.patch("/provider/:id/unban", unbanProvider);

// ── Users ──────────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/users
 * @desc    All regular users with pagination (?page, ?limit, ?search)
 * @access  Private (Admin)
 */
router.get("/users", getAllUsers);

/**
 * @route   PATCH /api/admin/user/:id/ban
 * @desc    Suspend a user account
 * @body    { reason? }
 * @access  Private (Admin)
 */
router.patch("/user/:id/ban", banUser);

/**
 * @route   PATCH /api/admin/user/:id/unban
 * @desc    Reinstate a suspended user account
 * @access  Private (Admin)
 */
router.patch("/user/:id/unban", unbanUser);

// ── Orders ─────────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/orders
 * @desc    All orders with pagination (?page, ?limit, ?status, ?paymentStatus)
 * @access  Private (Admin)
 */
router.get("/orders", getAllOrders);

// ── Transactions ───────────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/transactions
 * @desc    Payment transactions (?page, ?limit, ?paymentStatus)
 * @access  Private (Admin)
 */
router.get("/transactions", getAllTransactions);

// ── Reports ────────────────────────────────────────────────────────────────────
/**
 * @route   GET /api/admin/reports
 * @desc    Monthly revenue report (?year)
 * @access  Private (Admin)
 */
router.get("/reports", generateReports);

module.exports = router;
