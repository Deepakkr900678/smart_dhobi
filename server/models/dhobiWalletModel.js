"use strict";

const mongoose = require("mongoose");

/**
 * DhobiWallet
 * ───────────
 * Running financial ledger for each dhobi.
 * One document per ServiceProvider — updated atomically on every
 * payment capture and every successful payout.
 *
 * Fields:
 *  pendingAmount   → earned but not yet paid out (resets to 0 after each payout)
 *  totalEarned     → lifetime gross earnings (never decreases)
 *  totalPaid       → lifetime successful payouts (never decreases)
 *  lastPayoutAt    → timestamp of most recent processed payout
 */
const DhobiWalletSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceProvider",
      required: [true, "Provider reference is required"],
      unique: true,
      index: true,
    },

    pendingAmount: {
      type: Number,
      default: 0,
      min: [0, "Pending amount cannot be negative"],
    },

    totalEarned: {
      type: Number,
      default: 0,
      min: [0, "Total earned cannot be negative"],
    },

    totalPaid: {
      type: Number,
      default: 0,
      min: [0, "Total paid cannot be negative"],
    },

    lastPayoutAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DhobiWallet", DhobiWalletSchema);