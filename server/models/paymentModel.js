"use strict";

const mongoose = require("mongoose");

/**
 * Payment
 * ───────
 * Acts as an immutable financial ledger — one document per payment attempt.
 * This is separate from the operational payment fields on Order
 * (razorpayOrderId, paymentStatus, paidAt, etc.) which track the ORDER's
 * current state. The Payment collection is the audit trail.
 *
 * Design rules:
 *  - Never update a Payment document after creation (treat as append-only)
 *  - One Payment per successful transaction (transactionId is unique)
 *  - Failed attempts are recorded too, for fraud analysis
 */
const PaymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order reference is required"],
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: [true, "Provider reference is required"],
      index: true,
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
      maxlength: [3, "Currency code must be 3 characters"],
    },

    method: {
      type: String,
      enum: {
        values: ["razorpay", "cash"],
        message: "Method must be one of: razorpay, cash",
      },
      required: [true, "Payment method is required"],
    },

    /**
     * razorpayOrderId: the Razorpay order.id created at initiation.
     * Required for razorpay payments; omitted for cash.
     */
    razorpayOrderId: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },

    /**
     * transactionId: Razorpay payment_id (e.g. "pay_ABC123") for online,
     * or a manual reference for cash. Unique per successful transaction.
     */
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      trim: true,
      unique: true,
    },

    status: {
      type: String,
      enum: {
        values: ["pending", "success", "failed", "refunded"],
        message: "Status must be one of: pending, success, failed, refunded",
      },
      default: "pending",
      index: true,
    },

    /**
     * Signature stored for audit; never returned in API responses.
     * razorpaySignature is marked select:false so it never leaks.
     */
    razorpaySignature: {
      type: String,
      trim: true,
      select: false,
    },

    failureReason: {
      type: String,
      trim: true,
      maxlength: [500, "Failure reason cannot exceed 500 characters"],
    },

    // Refund fields — populated when a refund is processed
    refundId: {
      type: String,
      trim: true,
      sparse: true,
    },
    refundAmount: {
      type: Number,
      min: [0, "Refund amount cannot be negative"],
    },
    refundedAt: {
      type: Date,
    },

    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        // Never expose signature in any JSON response
        delete ret.razorpaySignature;
        return ret;
      },
    },
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

// Unique constraint on transactionId prevents double-recording a payment
PaymentSchema.index({ transactionId: 1 }, { unique: true });

// Admin/provider reporting queries
PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ providerId: 1, status: 1, createdAt: -1 });
PaymentSchema.index({ orderId: 1, status: 1 });
PaymentSchema.index({ razorpayOrderId: 1 }, { sparse: true });

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Razorpay payments must have a razorpayOrderId.
 * Cash payments must not have one (keeps data clean).
 */
PaymentSchema.pre("validate", function () {
  if (this.method === "razorpay" && !this.razorpayOrderId) {
    this.invalidate(
      "razorpayOrderId",
      "razorpayOrderId is required for razorpay payments"
    );
  }
  if (this.method === "cash" && this.razorpayOrderId) {
    this.invalidate(
      "razorpayOrderId",
      "razorpayOrderId must not be set for cash payments"
    );
  }
});

/**
 * Refund fields must be set together.
 */
PaymentSchema.pre("validate", function () {
  const hasRefundId     = Boolean(this.refundId);
  const hasRefundAmount = this.refundAmount !== undefined && this.refundAmount !== null;
  if (hasRefundId !== hasRefundAmount) {
    this.invalidate("refundId", "refundId and refundAmount must both be set for a refund");
  }
});

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;