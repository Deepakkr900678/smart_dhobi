"use strict";

const mongoose = require("mongoose");

/**
 * Payout
 * ──────
 * One document per daily payout batch sent to a dhobi via RazorpayX.
 * Immutable after status reaches "processed" or "reversed".
 *
 * Lifecycle:
 *   pending → processing → processed   (happy path)
 *   pending → processing → failed      (RazorpayX rejection)
 *   processed → reversed               (bank-initiated reversal)
 */
const PayoutSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: [true, "Provider reference is required"],
      index: true,
    },

    // User account of the dhobi (needed for notifications)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    // All Order._id values rolled up in this payout batch
    orderIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    // ── Financials ─────────────────────────────────────────────────────────────
    totalOrderAmount: {
      type: Number,
      required: [true, "Total order amount is required"],
      min: [0.01, "Total order amount must be positive"],
    },
    adminCommission: {
      type: Number,
      required: [true, "Admin commission is required"],
      min: [0, "Commission cannot be negative"],
    },
    dhobiAmount: {
      type: Number,
      required: [true, "Dhobi payout amount is required"],
      min: [0.01, "Dhobi amount must be positive"],
    },

    // ── RazorpayX ─────────────────────────────────────────────────────────────
    razorpayPayoutId: {
      type: String,
      trim: true,
      sparse: true,  // Null until RazorpayX responds
      index: true,
    },
    razorpayFundAccountId: {
      type: String,
      trim: true,    // fa_xxxxx — copied from ServiceProvider at payout time
    },
    razorpayContactId: {
      type: String,
      trim: true,    // cont_xxxxx
    },

    payoutMode: {
      type: String,
      enum: {
        values: ["IMPS", "NEFT", "RTGS", "UPI"],
        message: "payoutMode must be one of: IMPS, NEFT, RTGS, UPI",
      },
      default: "IMPS",
    },

    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ["pending", "processing", "processed", "failed", "reversed"],
        message: "Invalid payout status",
      },
      default: "pending",
      index: true,
    },

    failureReason: {
      type: String,
      trim: true,
      maxlength: [500, "Failure reason cannot exceed 500 characters"],
    },

    // ── Timing ─────────────────────────────────────────────────────────────────
    scheduledAt: {
      type: Date,  // Timestamp when the cron job queued this payout
    },
    processedAt: {
      type: Date,  // Timestamp from RazorpayX webhook (payout.processed)
    },

    // ── Retry tracking ─────────────────────────────────────────────────────────
    retryCount: {
      type: Number,
      default: 0,
      max: [3, "Maximum 3 retries allowed"],
    },
    isRetry: {
      type: Boolean,
      default: false,
    },
    originalPayoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payout",
      sparse: true, // Only set when isRetry = true
    },
  },
  { timestamps: true }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

PayoutSchema.index({ providerId: 1, status: 1, createdAt: -1 });
PayoutSchema.index({ razorpayPayoutId: 1 }, { sparse: true });
PayoutSchema.index({ scheduledAt: 1, status: 1 }); // cron deduplication
PayoutSchema.index({ status: 1, createdAt: -1 });  // admin dashboard

module.exports = mongoose.model("Payout", PayoutSchema);