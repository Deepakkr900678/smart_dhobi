// const express = require('express');
// const router = express.Router();
// const {
//   getProfile,
//   getProviders,
//   updateProfile,
//   toggleActive,
//   getOrders,
//   updateOrderStatus,
//   getAnalytics,
//   createProvider,
//   addService,
//   updateService,
//   deleteService,
// } = require('../controllers/providerController');
// const authMiddleware = require('../middlewares/authMiddleware');
// const adminMiddleware = require('../middlewares/adminMiddleware');

// router.post('/create', createProvider);
// router.get('/', getProviders);
// router.get('/orders', authMiddleware, getOrders);
// router.get('/analytics', authMiddleware, getAnalytics);
// router.patch('/order/:id/status', updateOrderStatus);

// // Specific service sub-routes BEFORE the generic /profile/:id patch
// router.post('/profile/:id/services', authMiddleware, addService);
// router.patch('/profile/:id/services/:serviceId', authMiddleware, updateService);
// router.delete('/profile/:id/services/:serviceId', authMiddleware, deleteService);

// // Generic profile routes AFTER
// router.get('/profile/:id', authMiddleware, getProfile);
// router.patch('/profile/:id', authMiddleware, updateProfile);
// router.patch('/toggle-active/:id', authMiddleware, adminMiddleware, toggleActive);

// module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();

const {
  createProvider,
  getProviders,
  getProfile,
  updateProfile,
  toggleActive,
  getOrders,
  updateOrderStatus,
  getAnalytics,
  addService,
  updateService,
  deleteService,
} = require("../controllers/providerController");

const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

// ── Public Routes ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/provider
 * @desc    List approved, active providers (?page, ?limit, ?search, ?lat, ?lng, ?radius)
 * @access  Public
 */
router.get("/", getProviders);

// ── Admin-only Routes ──────────────────────────────────────────────────────────

/**
 * @route   POST /api/provider/create
 * @desc    Admin creates a new dhobi (User + ServiceProvider records)
 * @access  Private (Admin)
 */
router.post("/create", createProvider);

// ── Provider-authenticated Routes ──────────────────────────────────────────────

/**
 * @route   GET /api/provider/orders
 * @desc    Provider's own orders (?page, ?limit, ?status)
 * @access  Private (Provider)
 */
router.get("/orders", authMiddleware, getOrders);

/**
 * @route   GET /api/provider/analytics
 * @desc    Provider's performance analytics (orders, earnings, monthly revenue)
 * @access  Private (Provider)
 */
router.get("/analytics", authMiddleware, getAnalytics);

/**
 * @route   PATCH /api/provider/order/:id/status
 * @desc    Update an order's status (ownership enforced in controller)
 * @access  Private (Provider)
 */
router.patch("/order/:id/status", authMiddleware, updateOrderStatus);

// ── Service Sub-resource Routes ────────────────────────────────────────────────
// Must be declared BEFORE /profile/:id to avoid Express matching :id = "orders"

/**
 * @route   POST /api/provider/profile/:id/services
 * @desc    Add a new service to provider's offerings
 * @access  Private (own Provider or Admin)
 */
router.post("/profile/:id/services", authMiddleware, addService);

/**
 * @route   PATCH /api/provider/profile/:id/services/:serviceId
 * @desc    Update an existing service
 * @access  Private (own Provider or Admin)
 */
router.patch("/profile/:id/services/:serviceId", authMiddleware, updateService);

/**
 * @route   DELETE /api/provider/profile/:id/services/:serviceId
 * @desc    Remove a service
 * @access  Private (own Provider or Admin)
 */
router.delete("/profile/:id/services/:serviceId", authMiddleware, deleteService);

// ── Profile Routes ─────────────────────────────────────────────────────────────

/**
 * @route   GET /api/provider/profile/:id
 * @desc    Get a provider's full profile
 * @access  Private
 */
router.get("/profile/:id", authMiddleware, getProfile);

/**
 * @route   PATCH /api/provider/profile/:id
 * @desc    Update provider profile (ownership enforced in controller)
 * @access  Private (own Provider or Admin)
 */
router.patch("/profile/:id", authMiddleware, updateProfile);

/**
 * @route   PATCH /api/provider/toggle-active/:id
 * @desc    Toggle provider's isActive status
 * @access  Private (own Provider or Admin)
 */
router.patch("/toggle-active/:id", authMiddleware, toggleActive);

module.exports = router;