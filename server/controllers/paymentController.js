"use strict";

/**
 * paymentController.js
 * ────────────────────
 * Handles the Razorpay payment lifecycle for platform orders.
 *
 * Architecture:
 *   Order model   → operational state  (current paymentStatus, paidAt, refundId…)
 *   Payment model → financial ledger   (one immutable record per transaction attempt)
 *
 * Both are written inside a Mongoose session so they stay consistent.
 * If MongoDB is standalone (no replica set), sessions are unavailable —
 * the code gracefully falls back to non-transactional writes.
 *
 * CHANGE vs original:
 *   verifyPayment now calls payoutController.recordOrderSplit(order._id)
 *   after the DB transaction commits. The call is non-blocking (fire-and-forget
 *   with .catch) so a split failure never affects the payment response or rolls
 *   back the transaction. The payout cron's self-healing pre-pass will recover
 *   any missed splits on its next run.
 */

const crypto = require("crypto");
const Razorpay = require("razorpay");
const mongoose = require("mongoose");

const Order = require("../models/orderModel");
const Payment = require("../models/paymentModel");
const ServiceProvider = require("../models/serviceProviderModel");

// ─── Razorpay Instance ────────────────────────────────────────────────────────

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error(
    "[paymentController] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment"
  );
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Timing-safe string comparison — prevents signature timing attacks */
const safeEqual = (a, b) => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false; // buffers differ in length — not equal
  }
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/payment/initiate
 *
 * Creates a Razorpay order for an existing platform Order.
 * Amount is ALWAYS read from the database — never trusted from the client.
 *
 * Body: { orderId }  ← platform orderId string (e.g. "ORD-ABC-123")
 * @access Private (User)
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId?.trim()) {
      return res.status(400).json({ success: false, message: "orderId is required" });
    }

    const order = await Order.findOne({ orderId: orderId.trim() })
      .populate("userId", "name email mobile")
      .lean();

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ── Authorization ────────────────────────────────────────────────────────
    if (order.userId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (order.paymentStatus === "completed") {
      return res.status(409).json({
        success: false,
        message: "Payment already completed for this order",
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot initiate payment for a cancelled order",
      });
    }

    // ── Amount from DB — no client value trusted ──────────────────────────────
    const amountPaise = Math.round(order.amount * 100);
    if (amountPaise <= 0) {
      return res.status(400).json({ success: false, message: "Order has an invalid amount" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `rcpt_${orderId}_${Date.now()}`.slice(0, 40), // Razorpay max 40 chars
      notes: {
        orderId: order.orderId,
        userId: order.userId._id.toString(),
        providerId: order.providerId.toString(),
      },
    });

    // Persist Razorpay order ID for later signature verification
    await Order.findByIdAndUpdate(order._id, { razorpayOrderId: razorpayOrder.id });

    return res.status(201).json({
      success: true,
      data: {
        razorpayOrderId: razorpayOrder.id,
        key: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order: {
          _id: order._id,
          orderId: order.orderId,
          customerName: order.userId.name,
          customerEmail: order.userId.email,
          customerContact: order.userId.mobile,
        },
      },
    });
  } catch (err) {
    console.error("[initiatePayment]", err);
    const msg = err?.error?.description ?? err?.description ?? err?.message;
    return res.status(err?.statusCode ?? 500).json({
      success: false,
      message: msg ?? "Failed to initiate payment",
    });
  }
};

/**
 * POST /api/payment/verify
 *
 * Verifies Razorpay signature, marks Order as paid, and writes an immutable
 * Payment ledger record — both inside a DB transaction for consistency.
 *
 * After the transaction commits, fires payoutController.recordOrderSplit
 * non-blocking so the dhobi's wallet is updated without risking the payment response.
 *
 * Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
 * @access Private (User)
 */
exports.verifyPayment = async (req, res) => {
  // Attempt session; falls back gracefully on standalone MongoDB
  const session = await mongoose.startSession().catch(() => null);

  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    // ── Required fields ──────────────────────────────────────────────────────
    const missing = [];
    if (!orderId) missing.push("orderId");
    if (!razorpayOrderId) missing.push("razorpayOrderId");
    if (!razorpayPaymentId) missing.push("razorpayPaymentId");
    if (!razorpaySignature) missing.push("razorpaySignature");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const order = await Order.findOne({ orderId: orderId.trim() });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // ── Authorization ────────────────────────────────────────────────────────
    if (order.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // ── Idempotency ──────────────────────────────────────────────────────────
    if (order.paymentStatus === "completed") {
      return res.status(409).json({ success: false, message: "Payment already verified" });
    }

    // ── razorpayOrderId consistency check ────────────────────────────────────
    if (order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: "razorpayOrderId does not match the stored order",
      });
    }

    // ── Signature verification (timing-safe) ─────────────────────────────────
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!safeEqual(expectedSig, razorpaySignature)) {
      // Record failed attempt on Order + Payment ledger (best-effort, non-transactional)
      await Promise.allSettled([
        Order.findByIdAndUpdate(order._id, {
          paymentStatus: "failed",
          failureReason: "Invalid payment signature",
        }),
        Payment.create({
          orderId: order._id,
          userId: order.userId,
          providerId: order.providerId,
          amount: order.amount,
          currency: "INR",
          method: "razorpay",
          razorpayOrderId,
          transactionId: razorpayPaymentId,
          status: "failed",
          failureReason: "Invalid payment signature",
        }),
      ]);

      return res.status(400).json({
        success: false,
        message: "Payment verification failed: invalid signature",
      });
    }

    // ── Atomic update: Order + Payment ledger ─────────────────────────────────
    const paidAt = new Date();
    const sessionOpts = session ? { session } : {};

    if (session) session.startTransaction();

    try {
      await Order.findByIdAndUpdate(
        order._id,
        {
          paymentStatus: "completed",
          razorpayPaymentId,
          razorpaySignature, // select:false on model — never returned in responses
          paidAt,
        },
        sessionOpts
      );

      await Payment.create(
        [
          {
            orderId: order._id,
            userId: order.userId,
            providerId: order.providerId,
            amount: order.amount,
            currency: "INR",
            method: "razorpay",
            razorpayOrderId,
            transactionId: razorpayPaymentId,
            razorpaySignature,
            status: "success",
            paidAt,
          },
        ],
        sessionOpts
      );

      if (session) await session.commitTransaction();
    } catch (innerErr) {
      if (session) await session.abortTransaction();
      throw innerErr;
    }

    // ── Trigger payout split (non-blocking fire-and-forget) ───────────────────
    //
    // Runs AFTER the transaction commits so Order.paymentStatus is guaranteed
    // "completed" when recordOrderSplit reads the order.
    //
    // A failure here is safe: the payout cron's self-healing pre-pass will
    // back-fill any unsplit orders before the next payout run.
    const { recordOrderSplit } = require("./payoutController");
    recordOrderSplit(order._id).catch((err) =>
      console.error(
        `[verifyPayment] recordOrderSplit failed for order ${order.orderId} — ` +
        `will recover on next payout cron run. Error: ${err.message}`
      )
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        orderId: order.orderId,
        paymentStatus: "completed",
        amount: order.amount,
        paidAt,
      },
    });
  } catch (err) {
    console.error("[verifyPayment]", err);

    // Unique index on transactionId — concurrent request already recorded this payment
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Payment already recorded" });
    }

    return res.status(500).json({ success: false, message: "Payment verification failed" });
  } finally {
    if (session) session.endSession();
  }
};

/**
 * GET /api/payment/history
 *
 * Paginated Payment ledger records scoped by role:
 *   user  → their own payments
 *   dhobi → payments for their provider profile
 *   admin → all payments (optionally filtered by ?status=)
 *
 * @query page, limit, status
 * @access Private
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const VALID_STATUSES = ["pending", "success", "failed", "refunded"];
    const filter = {};

    // ── Role-based scoping ───────────────────────────────────────────────────
    if (req.user.role === "dhobi") {
      const provider = await ServiceProvider.findOne({ userId: req.user.id })
        .select("_id")
        .lean();

      if (!provider) {
        return res.status(404).json({ success: false, message: "Provider profile not found" });
      }
      filter.providerId = provider._id;
    } else if (req.user.role === "user") {
      filter.userId = req.user.id;
    }
    // admin: no scoping — sees all records

    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("orderId", "orderId status amount")
        .populate("userId", "name email")
        .populate("providerId", "name email")
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: payments,
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
    console.error("[getPaymentHistory]", err.message);
    return res.status(500).json({ success: false, message: "Failed to get payment history" });
  }
};