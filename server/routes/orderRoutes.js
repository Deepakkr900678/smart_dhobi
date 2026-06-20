// const express = require("express");
// const router = express.Router();

// const {
//     createOrder,
//     getUserOrders,
//     getProviderOrders,
//     updateOrderStatus,
//     orderManagement,
//     getOrderDetails,
//     getAllOrders,
//     createRazorpayOrder,
//     verifyPayment,
//     getPaymentStatus,
//     handleWebhook,
//     refundPayment,
// } = require("../controllers/orderController");

// const authMiddleware = require("../middlewares/authMiddleware");
// const authorizeRoles = require("../middlewares/authorizeRoles");


// // =======================
// // 👤 USER ROUTES
// // =======================

// // Create order
// router.post(
//     "/create",
//     authMiddleware,
//     authorizeRoles("user"),
//     createOrder
// );

// // Get logged-in user's orders
// router.get(
//     "/userOrders",
//     authMiddleware,
//     authorizeRoles("user"),
//     getUserOrders
// );


// // =======================
// // 🧺 PROVIDER (DHOBI)
// // =======================

// // Get provider orders
// router.get(
//     "/dhobiOrders",
//     authMiddleware,
//     authorizeRoles("dhobi"),
//     getProviderOrders
// );

// // Update order status (accepted, completed, etc.)
// router.patch(
//     "/:id/status",
//     authMiddleware,
//     authorizeRoles("dhobi", "admin"),
//     updateOrderStatus
// );


// // =======================
// // 🛠 ADMIN ROUTES
// // =======================

// // Get all orders
// router.get(
//     "/getAllOrders",
//     authMiddleware,
//     authorizeRoles("admin"),
//     getAllOrders
// );

// // Order dashboard / management
// router.get(
//     "/orderManagement",
//     authMiddleware,
//     authorizeRoles("admin"),
//     orderManagement
// );


// // =======================
// // 📦 COMMON (Authenticated)
// // =======================

// // Get order details (user/provider/admin)
// router.get(
//     "/:id",
//     authMiddleware,
//     getOrderDetails
// );


// // =======================
// // 💳 PAYMENT ROUTES
// // =======================

// // Create Razorpay order
// router.post(
//     "/create-razorpay-order",
//     authMiddleware,
//     createRazorpayOrder
// );

// // Verify payment
// router.post(
//     "/verify-payment",
//     authMiddleware,
//     verifyPayment
// );

// // Payment status
// router.get(
//     "/payment-status/:orderId",
//     authMiddleware,
//     getPaymentStatus
// );

// // Razorpay webhook (NO auth)
// router.post(
//     "/webhook",
//     express.raw({ type: "application/json" }),
//     handleWebhook
// );

// // Refund (admin only)
// router.post(
//     "/refund",
//     authMiddleware,
//     authorizeRoles("admin"),
//     refundPayment
// );

// module.exports = router;

"use strict";

const express = require("express");
const router = express.Router();

const {
  createOrder,
  getUserOrders,
  getProviderOrders,
  updateOrderStatus,
  orderManagement,
  getOrderDetails,
  getAllOrders,
  createRazorpayOrder,
  verifyPayment,
  getPaymentStatus,
  handleWebhook,
  refundPayment,
} = require("../controllers/orderController");

const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

// ─────────────────────────────────────────────────────────────────────────────
// CRITICAL: The Razorpay webhook route MUST be declared before any
// express.json() body-parser is applied to this router, and it uses
// express.raw() to receive the raw buffer needed for signature verification.
// It is declared first so Express cannot accidentally JSON-parse it.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/order/webhook
 * @desc    Razorpay webhook — verifies signature, updates payment status
 * @access  Public (signature-verified by Razorpay)
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

// ── All routes below require JSON body parsing (applied by app.js globally) ──

// ── User Routes ───────────────────────────────────────────────────────────────

/**
 * @route   POST /api/order/create
 * @desc    User places a new laundry order
 * @access  Private (User)
 */
router.post(
  "/create",
  authMiddleware,
  authorizeRoles("user"),
  createOrder
);

/**
 * @route   GET /api/order/userOrders
 * @desc    Get authenticated user's own orders (?page, ?limit, ?status)
 * @access  Private (User)
 */
router.get(
  "/userOrders",
  authMiddleware,
  authorizeRoles("user"),
  getUserOrders
);
router.get(
    "/userOrders/:userId",
    authMiddleware,
    authorizeRoles("user"),
    getUserOrders
);

// ── Provider Routes ────────────────────────────────────────────────────────────

/**
 * @route   GET /api/order/dhobiOrders
 * @desc    Get the authenticated provider's orders (?page, ?limit, ?status)
 * @access  Private (Dhobi)
 */
router.get(
  "/dhobiOrders",
  authMiddleware,
  authorizeRoles("dhobi"),
  getProviderOrders
);
router.get(
    "/dhobiOrders/:userId",
    authMiddleware,
    authorizeRoles("dhobi"),
    getProviderOrders
);

// ── Admin Routes ───────────────────────────────────────────────────────────────

/**
 * @route   GET /api/order/getAllOrders
 * @desc    Admin: all orders with pagination (?page, ?limit, ?status, ?paymentStatus)
 * @access  Private (Admin)
 *
 * NOTE: Must be declared BEFORE /:id to prevent Express matching
 * "getAllOrders" as an :id parameter.
 */
router.get(
  "/getAllOrders",
  authMiddleware,
  authorizeRoles("admin"),
  getAllOrders
);

/**
 * @route   GET /api/order/orderManagement
 * @desc    Admin dashboard: status summary + paginated order list
 * @access  Private (Admin)
 *
 * NOTE: Must be declared BEFORE /:id for the same reason.
 */
router.get(
  "/orderManagement",
  authMiddleware,
  authorizeRoles("admin"),
  orderManagement
);

// ── Payment Routes ─────────────────────────────────────────────────────────────
// All declared BEFORE /:id to avoid Express treating path segments as :id

/**
 * @route   POST /api/order/create-razorpay-order
 * @desc    Initiate a Razorpay payment for an existing order
 * @access  Private (User)
 */
router.post(
  "/create-razorpay-order",
  authMiddleware,
  authorizeRoles("user"),
  createRazorpayOrder
);

/**
 * @route   POST /api/order/verify-payment
 * @desc    Verify Razorpay payment signature and mark order as paid
 * @access  Private (User)
 */
router.post(
  "/verify-payment",
  authMiddleware,
  authorizeRoles("user"),
  verifyPayment
);

/**
 * @route   GET /api/order/payment-status/:orderId
 * @desc    Get payment status of an order by orderId string
 * @access  Private
 */
router.get(
  "/payment-status/:orderId",
  authMiddleware,
  getPaymentStatus
);

/**
 * @route   POST /api/order/refund
 * @desc    Admin initiates a full or partial Razorpay refund
 * @body    { orderId, amount? (partial), reason? }
 * @access  Private (Admin)
 */
router.post(
  "/refund",
  authMiddleware,
  authorizeRoles("admin"),
  refundPayment
);

// ── Shared Routes ──────────────────────────────────────────────────────────────

/**
 * @route   PATCH /api/order/:id/status
 * @desc    Update an order's status (FSM-enforced transitions)
 * @access  Private (Dhobi, Admin)
 */
router.patch(
  "/:id/status",
  authMiddleware,
  authorizeRoles("dhobi", "admin"),
  updateOrderStatus
);

/**
 * @route   GET /api/order/:id
 * @desc    Get a single order's details (ownership-checked in controller)
 * @access  Private
 *
 * IMPORTANT: This wildcard route is declared LAST so all static paths
 * (/getAllOrders, /userOrders, /create-razorpay-order, etc.) are matched first.
 */
router.get(
  "/:id",
  authMiddleware,
  getOrderDetails
);

module.exports = router;
