// const express = require('express');
// const router = express.Router();
// const { initiatePayment, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');
// const authMiddleware = require('../middlewares/authMiddleware'); 

// router.post('/initiate', authMiddleware, initiatePayment);
// router.post('/verify', authMiddleware, verifyPayment);
// router.get('/history', authMiddleware, getPaymentHistory);

// module.exports = router;


"use strict";

const express = require("express");
const router  = express.Router();

const {
  initiatePayment,
  verifyPayment,
  getPaymentHistory,
} = require("../controllers/paymentController");

const authMiddleware  = require("../middlewares/authMiddleware");
const authorizeRoles  = require("../middlewares/authorizeRoles");

/**
 * @route   POST /api/payment/initiate
 * @desc    Create a Razorpay order for an existing platform order.
 *          Amount is always sourced from the DB — never from the client.
 * @body    { orderId }
 * @access  Private (User)
 */
router.post(
  "/initiate",
  authMiddleware,
  authorizeRoles("user"),
  initiatePayment
);

/**
 * @route   POST /api/payment/verify
 * @desc    Verify Razorpay signature and mark order as paid (timing-safe)
 * @body    { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * @access  Private (User)
 */
router.post(
  "/verify",
  authMiddleware,
  authorizeRoles("user"),
  verifyPayment
);

/**
 * @route   GET /api/payment/history
 * @desc    Payment history — scoped by role:
 *          user  → their own paid orders
 *          dhobi → orders on their provider profile
 *          admin → all orders (no filter)
 * @query   page, limit, paymentStatus
 * @access  Private
 */
router.get(
  "/history",
  authMiddleware,
  getPaymentHistory
);

module.exports = router;