"use strict";

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRoles");

const {
    registerDhobiForPayout,
    handlePayoutWebhook,
    triggerManualPayout,
    getPayoutHistory,
    getDhobiWallet,
} = require("../controllers/payoutController");

// ─── Webhook ──────────────────────────────────────────────────────────────────
// Public — no auth. Signature-verified inside the controller.
// express.raw() is applied in server.js BEFORE express.json(), so by the time
// this handler runs, req.body is still the raw Buffer Razorpay signed.
router.post("/webhook", handlePayoutWebhook);

// ─── Admin only ───────────────────────────────────────────────────────────────
router.post(
    "/register/:providerId",
    authMiddleware,
    authorizeRoles("admin"),
    registerDhobiForPayout
);

router.post(
    "/trigger",
    authMiddleware,
    authorizeRoles("admin"),
    triggerManualPayout
);

// ─── Dhobi + Admin ────────────────────────────────────────────────────────────
router.get(
    "/history",
    authMiddleware,
    authorizeRoles("dhobi", "admin"),
    getPayoutHistory
);

router.get(
    "/wallet",
    authMiddleware,
    authorizeRoles("dhobi", "admin"),
    getDhobiWallet
);

module.exports = router;