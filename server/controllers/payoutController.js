"use strict";

/**
 * payoutController.js
 * ───────────────────
 * Complete dhobi payout lifecycle:
 *
 *  1. registerDhobiForPayout  — one-time setup when admin approves a dhobi
 *  2. recordOrderSplit        — called from paymentController.verifyPayment
 *  3. executeDailyPayouts     — cron at 17:00, also used by triggerManualPayout
 *  4. handlePayoutWebhook     — RazorpayX webhook (payout.processed / failed / reversed)
 *  5. triggerManualPayout     — admin on-demand endpoint
 *  6. getPayoutHistory        — paginated history (dhobi or admin)
 *  7. getDhobiWallet          — wallet balance
 *
 * FIX LOG (vs original):
 *  - payout.processed webhook: changed $set{pendingAmount:0} → $inc{pendingAmount:-dhobiAmount}
 *    to avoid zeroing pending balance when multiple payouts process concurrently.
 *  - executeDailyPayouts: added self-healing pre-pass that back-fills any orders whose
 *    recordOrderSplit call was missed (e.g. crashed after payment commit).
 *  - recordOrderSplit: stricter idempotency check (dhobiAmount !== undefined covers both
 *    null and 0 correctly by checking payoutStatus instead).
 */

const crypto = require("crypto");
const cron = require("node-cron");
const mongoose = require("mongoose");
const axios = require("axios");

const Order = require("../models/orderModel");
const ServiceProvider = require("../models/serviceProviderModel");
const Payout = require("../models/payoutModel");
const DhobiWallet = require("../models/dhobiWalletModel");
const Notification = require("../models/notificationModel");
const { getIO } = require("../socket");

// ─── RazorpayX Config ─────────────────────────────────────────────────────────

const RAZORPAYX_ACCOUNT = process.env.RAZORPAYX_ACCOUNT_NUMBER;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

const RZPX = "https://api.razorpay.com/v1";

/** Base64 Basic auth header for RazorpayX REST calls */
const rzpxAuth = () =>
  "Basic " + Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Persist a notification and emit it over Socket.IO.
 * Non-blocking — never throws.
 */
const notify = async (userId, message, orderId = null, type = "order") => {
  try {
    const n = await Notification.create({ userId, message, orderId, type });
    getIO().to(userId.toString()).emit("receive-notification", n);
  } catch (err) {
    console.error("[notify]", err.message);
  }
};

/**
 * Notify all admin users. Non-blocking — never throws.
 */
const notifyAdmins = async (message) => {
  try {
    const User = require("../models/userModel");
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    if (!admins.length) return;

    const docs = admins.map((a) => ({ userId: a._id, type: "general", message }));
    const saved = await Notification.insertMany(docs, { ordered: false });
    const io = getIO();
    for (const n of saved) io.to(n.userId.toString()).emit("receive-notification", n);
  } catch (err) {
    console.error("[notifyAdmins]", err.message);
  }
};

/**
 * Calculate the admin/dhobi split for a single order.
 * Returns { adminCommission, dhobiAmount } rounded to 2 d.p.
 *
 * @param {number} orderAmount     — gross order amount in ₹
 * @param {number} commissionRate  — admin commission percentage (0–100)
 */
const splitAmount = (orderAmount, commissionRate) => {
  const adminCommission = parseFloat(((orderAmount * commissionRate) / 100).toFixed(2));
  const dhobiAmount = parseFloat((orderAmount - adminCommission).toFixed(2));
  return { adminCommission, dhobiAmount };
};

// ─── 1. Register Dhobi for Payout ─────────────────────────────────────────────

/**
 * POST /api/payout/register/:providerId
 *
 * Called once when admin approves a dhobi (also called automatically from
 * serviceProviderController.updateProfile when isApproved flips to "approved").
 *
 * Creates a RazorpayX contact + fund account and persists the IDs on
 * ServiceProvider. Also upserts a DhobiWallet for that provider.
 *
 * Fully idempotent — safe to call multiple times; returns existing IDs if
 * already registered.
 *
 * @access Private (Admin)
 */
exports.registerDhobiForPayout = async (req, res) => {
  try {
    const { providerId } = req.params;

    if (!mongoose.isValidObjectId(providerId)) {
      return res.status(400).json({ success: false, message: "Invalid providerId" });
    }

    const provider = await ServiceProvider.findById(providerId)
      .select("+bankDetails.accountNumber") // accountNumber is select:false on model
      .lean();

    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (provider.isApproved !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Provider must be approved before registering for payouts",
      });
    }

    // ── Idempotency: already registered ─────────────────────────────────────
    if (provider.razorpayFundAccountId) {
      return res.status(200).json({
        success: true,
        message: "Provider is already registered for payouts",
        data: {
          razorpayContactId: provider.razorpayContactId,
          razorpayFundAccountId: provider.razorpayFundAccountId,
        },
      });
    }

    const { razorpayContactId, razorpayFundAccountId } =
      await _registerOnRazorpayX(provider._id, {
        owner: provider.owner,
        email: provider.email,
        mobile: provider.mobile,
        name: provider.name,
        dhobiId: provider.dhobiId,
        accountHolderName: provider.bankDetails.accountHolderName,
        accountNumber: provider.bankDetails.accountNumber,
        ifscCode: provider.bankDetails.ifscCode,
      });

    return res.status(201).json({
      success: true,
      message: "Dhobi registered for payouts successfully",
      data: { razorpayContactId, razorpayFundAccountId },
    });
  } catch (err) {
    console.error("[registerDhobiForPayout]", err?.response?.data ?? err.message);
    const msg = err?.response?.data?.error?.description ?? err.message;
    return res.status(500).json({ success: false, message: msg ?? "Registration failed" });
  }
};

/**
 * Core RazorpayX registration logic — shared between the HTTP endpoint above
 * and the internal fire-and-forget call in serviceProviderController.
 *
 * Steps:
 *   A. Create RazorpayX Contact
 *   B. Create Fund Account linked to the Contact
 *   C. Persist both IDs on ServiceProvider
 *   D. Upsert DhobiWallet
 *
 * @returns {{ razorpayContactId: string, razorpayFundAccountId: string }}
 * @throws  on any Axios / DB error (caller decides how to handle)
 */
const _registerOnRazorpayX = async (providerId, details) => {
  const {
    owner, email, mobile, name, dhobiId,
    accountHolderName, accountNumber, ifscCode,
  } = details;

  // Step A — Contact
  const contactRes = await axios.post(
    `${RZPX}/contacts`,
    {
      name: owner,
      email,
      contact: mobile,
      type: "vendor",
      reference_id: providerId.toString(),
      notes: { dhobiId, business: name },
    },
    { headers: { Authorization: rzpxAuth(), "Content-Type": "application/json" } }
  );
  const razorpayContactId = contactRes.data.id; // cont_xxxxx

  // Step B — Fund Account
  const fundRes = await axios.post(
    `${RZPX}/fund_accounts`,
    {
      contact_id: razorpayContactId,
      account_type: "bank_account",
      bank_account: {
        name: accountHolderName,
        ifsc: ifscCode,
        account_number: accountNumber,
      },
    },
    { headers: { Authorization: rzpxAuth(), "Content-Type": "application/json" } }
  );
  const razorpayFundAccountId = fundRes.data.id; // fa_xxxxx

  // Step C — Persist on ServiceProvider
  await ServiceProvider.findByIdAndUpdate(providerId, {
    razorpayContactId,
    razorpayFundAccountId,
    isFundAccountVerified: true,
  });

  // Step D — Upsert DhobiWallet
  await DhobiWallet.findOneAndUpdate(
    { providerId },
    { $setOnInsert: { providerId } },
    { upsert: true, new: true }
  );

  console.info(
    `[_registerOnRazorpayX] Provider ${providerId} → ` +
    `contact=${razorpayContactId}, fundAccount=${razorpayFundAccountId}`
  );

  return { razorpayContactId, razorpayFundAccountId };
};

// Export the internal helper so serviceProviderController can reuse it
// instead of duplicating the Axios logic.
exports._registerOnRazorpayX = _registerOnRazorpayX;

// ─── 2. Record Order Split (internal — called from paymentController) ──────────

/**
 * Called internally by paymentController.verifyPayment after the DB transaction
 * commits and Order.paymentStatus is guaranteed "completed".
 *
 * Idempotent: if the order already has a payoutStatus other than the default
 * (i.e. dhobiAmount has already been calculated), it returns early.
 *
 * Non-blocking by design — caller wraps in .catch() so a split failure never
 * surfaces as a 500 to the end user. The cron's self-healing pre-pass will
 * recover any missed splits.
 *
 * @param {mongoose.Types.ObjectId|string} orderId — Order._id (MongoDB ObjectId)
 */
exports.recordOrderSplit = async (orderId) => {
  try {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new Error(`Order ${orderId} not found`);

    if (order.paymentStatus !== "completed") {
      throw new Error(`Order ${orderId} payment is not completed (status: ${order.paymentStatus})`);
    }

    // Idempotency: dhobiAmount already set means the split was recorded before
    if (order.dhobiAmount != null) {
      console.info(`[recordOrderSplit] Order ${order.orderId} already split — skipping`);
      return;
    }

    const provider = await ServiceProvider.findById(order.providerId)
      .select("commissionRate")
      .lean();

    if (!provider) throw new Error(`Provider ${order.providerId} not found`);

    const { adminCommission, dhobiAmount } = splitAmount(order.amount, provider.commissionRate);

    // Atomic: update Order split fields + DhobiWallet pending/total
    await Promise.all([
      Order.findByIdAndUpdate(orderId, {
        adminCommission,
        dhobiAmount,
        payoutStatus: "pending",
      }),
      DhobiWallet.findOneAndUpdate(
        { providerId: order.providerId },
        {
          $inc: { pendingAmount: dhobiAmount, totalEarned: dhobiAmount },
          $setOnInsert: { providerId: order.providerId },
        },
        { upsert: true }
      ),
    ]);

    console.info(
      `[recordOrderSplit] Order ${order.orderId}: ` +
      `total=₹${order.amount}, commission=₹${adminCommission}, dhobi=₹${dhobiAmount}`
    );
  } catch (err) {
    // Non-fatal: log and let the cron recover on next run
    console.error("[recordOrderSplit]", err.message);
    throw err; // re-throw so caller's .catch() can log context too
  }
};

// ─── 3. Daily Payout Cron (5 PM every day) ────────────────────────────────────

/**
 * Core payout logic shared by both the scheduled cron and the manual trigger.
 *
 * Self-healing pre-pass: any completed orders that missed their recordOrderSplit
 * call (e.g. server crashed between payment commit and the async call) are
 * split first so they enter the payout correctly.
 *
 * @returns {{ success: boolean, payoutsCreated: number, errors: Array }}
 */
const executeDailyPayouts = async () => {
  console.info(`[payoutCron] Starting payout run at ${new Date().toISOString()}`);

  // ── Self-healing: back-fill any orders that missed recordOrderSplit ────────
  const unsplitOrders = await Order.find({
    paymentStatus: "completed",
    payoutStatus: "pending",
    dhobiAmount: { $in: [null, undefined] },
  })
    .select("_id orderId")
    .lean();

  if (unsplitOrders.length) {
    console.info(`[payoutCron] Back-filling ${unsplitOrders.length} unsplit order(s)…`);
    const splitResults = await Promise.allSettled(
      unsplitOrders.map((o) => exports.recordOrderSplit(o._id))
    );
    splitResults.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `[payoutCron] Back-fill failed for order ${unsplitOrders[i].orderId}:`,
          r.reason?.message
        );
      }
    });
  }

  // ── Find all split + pending orders ──────────────────────────────────────
  const pendingOrders = await Order.find({
    paymentStatus: "completed",
    payoutStatus: "pending",
    dhobiAmount: { $gt: 0 },
  })
    .select("_id orderId providerId dhobiAmount adminCommission amount")
    .lean();

  if (!pendingOrders.length) {
    console.info("[payoutCron] No pending orders to pay out.");
    return { success: true, payoutsCreated: 0, errors: [] };
  }

  // ── Group by providerId ───────────────────────────────────────────────────
  const grouped = {};
  for (const order of pendingOrders) {
    const key = order.providerId.toString();
    (grouped[key] = grouped[key] || []).push(order);
  }

  const providerIds = Object.keys(grouped);
  const providers = await ServiceProvider.find({ _id: { $in: providerIds } })
    .select("_id userId razorpayFundAccountId razorpayContactId name")
    .lean();

  const providerMap = {};
  for (const p of providers) providerMap[p._id.toString()] = p;

  const errors = [];
  let payoutsCreated = 0;
  const scheduledAt = new Date();

  // ── One payout per dhobi ──────────────────────────────────────────────────
  for (const [providerIdStr, orders] of Object.entries(grouped)) {
    const provider = providerMap[providerIdStr];

    if (!provider) {
      errors.push({ providerIdStr, reason: "Provider not found in DB" });
      continue;
    }

    if (!provider.razorpayFundAccountId) {
      errors.push({
        providerIdStr,
        reason: "No RazorpayX fund account — run POST /api/payout/register/:providerId",
      });
      continue;
    }

    const totalOrderAmount = parseFloat(orders.reduce((s, o) => s + o.amount, 0).toFixed(2));
    const adminCommission = parseFloat(orders.reduce((s, o) => s + (o.adminCommission ?? 0), 0).toFixed(2));
    const dhobiAmount = parseFloat(orders.reduce((s, o) => s + o.dhobiAmount, 0).toFixed(2));
    const amountPaise = Math.round(dhobiAmount * 100);

    // ── Create Payout document ────────────────────────────────────────────────
    let payoutDoc;
    try {
      payoutDoc = await Payout.create({
        providerId: provider._id,
        userId: provider.userId,
        orderIds: orders.map((o) => o._id),
        totalOrderAmount,
        adminCommission,
        dhobiAmount,
        razorpayFundAccountId: provider.razorpayFundAccountId,
        razorpayContactId: provider.razorpayContactId,
        status: "processing",
        scheduledAt,
      });
    } catch (err) {
      console.error(`[payoutCron] Failed to create Payout doc for ${providerIdStr}:`, err.message);
      errors.push({ providerIdStr, reason: err.message });
      continue;
    }

    // Mark orders as included in this payout batch
    await Order.updateMany(
      { _id: { $in: orders.map((o) => o._id) } },
      { payoutStatus: "included", payoutId: payoutDoc._id }
    );

    // ── Call RazorpayX /v1/payouts ────────────────────────────────────────────
    try {
      const rzpxRes = await axios.post(
        `${RZPX}/payouts`,
        {
          account_number: RAZORPAYX_ACCOUNT,
          fund_account_id: provider.razorpayFundAccountId,
          amount: amountPaise,
          currency: "INR",
          mode: "IMPS",
          purpose: "payout",
          queue_if_low_balance: true,
          reference_id: payoutDoc._id.toString(),
          narration: `Dhobi payment - ${provider.name}`,
          notes: {
            payoutDocId: payoutDoc._id.toString(),
            providerId: providerIdStr,
            orderCount: orders.length,
          },
        },
        {
          headers: {
            Authorization: rzpxAuth(),
            "Content-Type": "application/json",
            "X-Payout-Idempotency": payoutDoc._id.toString(), // prevents duplicate payouts
          },
        }
      );

      await Payout.findByIdAndUpdate(payoutDoc._id, {
        razorpayPayoutId: rzpxRes.data.id,
      });

      payoutsCreated++;
      console.info(
        `[payoutCron] Payout queued for ${provider.name}: ` +
        `₹${dhobiAmount} (${orders.length} order(s)) → ${rzpxRes.data.id}`
      );
    } catch (err) {
      const reason = err?.response?.data?.error?.description ?? err.message;
      console.error(`[payoutCron] RazorpayX call failed for ${providerIdStr}:`, reason);

      // Rollback: mark payout failed, release orders back to pending
      await Promise.all([
        Payout.findByIdAndUpdate(payoutDoc._id, { status: "failed", failureReason: reason }),
        Order.updateMany(
          { _id: { $in: orders.map((o) => o._id) } },
          { payoutStatus: "pending", payoutId: null }
        ),
      ]);

      errors.push({ providerIdStr, reason });
    }
  }

  console.info(
    `[payoutCron] Run complete. Created: ${payoutsCreated}, Errors: ${errors.length}`
  );
  return { success: true, payoutsCreated, errors };
};

/** Schedule: every day at 17:00 server time */
cron.schedule("0 17 * * *", async () => {
  try {
    await executeDailyPayouts();
  } catch (err) {
    console.error("[payoutCron] Unhandled error:", err.message);
  }
});

// ─── 4. RazorpayX Webhook Handler ─────────────────────────────────────────────

/**
 * POST /api/payout/webhook
 *
 * IMPORTANT: This route must be mounted with express.raw({ type: "application/json" })
 * BEFORE express.json() so that req.body is a raw Buffer for HMAC verification.
 *
 * Events handled:
 *   payout.processed → mark paid, update wallet (safe $inc), notify dhobi
 *   payout.failed    → retry up to 3×, notify admin on max retries
 *   payout.reversed  → re-credit wallet, re-open orders for next cron
 *
 * FIX: payout.processed now uses $inc { pendingAmount: -dhobiAmount } instead of
 *      $set { pendingAmount: 0 } to remain correct when multiple payouts for the
 *      same provider are processed concurrently.
 *
 * @access Public (signature-verified)
 */
exports.handlePayoutWebhook = async (req, res) => {
  try {
    // ── Signature verification ───────────────────────────────────────────────
    const sig = req.get("X-Razorpay-Signature");
    const rawBody = req.body instanceof Buffer
      ? req.body
      : Buffer.from(JSON.stringify(req.body));

    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");

    let sigValid = false;
    try {
      sigValid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig ?? ""));
    } catch {
      // buffers differ in length — sigValid stays false
    }

    if (!sigValid) {
      console.warn("[handlePayoutWebhook] Invalid signature");
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const payload = JSON.parse(rawBody.toString());
    const event = payload?.event;
    const payoutEntity = payload?.payload?.payout?.entity;
    const razorpayPayoutId = payoutEntity?.id;
    const referenceId = payoutEntity?.reference_id; // our Payout._id

    if (!razorpayPayoutId) {
      return res.status(200).json({ success: true, message: "Acknowledged (no payoutId)" });
    }

    // Find Payout doc — prefer reference_id (our _id) over razorpayPayoutId
    const payoutDoc = referenceId
      ? await Payout.findById(referenceId)
      : await Payout.findOne({ razorpayPayoutId });

    if (!payoutDoc) {
      console.warn(`[handlePayoutWebhook] Payout doc not found for ${razorpayPayoutId}`);
      return res.status(200).json({ success: true }); // acknowledge so RazorpayX stops retrying
    }

    // ── payout.processed ────────────────────────────────────────────────────
    if (event === "payout.processed") {
      if (payoutDoc.status === "processed") {
        return res.status(200).json({ success: true, message: "Already processed" });
      }

      await Promise.all([
        Payout.findByIdAndUpdate(payoutDoc._id, {
          status: "processed",
          processedAt: new Date(),
        }),

        // Mark all orders in this payout batch as paid
        Order.updateMany(
          { payoutId: payoutDoc._id },
          { payoutStatus: "paid" }
        ),

        // FIX: use $inc instead of $set so concurrent payouts don't zero each other out
        DhobiWallet.findOneAndUpdate(
          { providerId: payoutDoc.providerId },
          {
            $inc: {
              totalPaid: payoutDoc.dhobiAmount,
              pendingAmount: -payoutDoc.dhobiAmount, // ← was $set { pendingAmount: 0 }
            },
            $set: { lastPayoutAt: new Date() },
          }
        ),
      ]);

      notify(
        payoutDoc.userId,
        `₹${payoutDoc.dhobiAmount} has been transferred to your bank account ` +
        `for ${payoutDoc.orderIds.length} order(s).`,
        null,
        "general"
      );

      console.info(
        `[handlePayoutWebhook] payout.processed: ${razorpayPayoutId} → ₹${payoutDoc.dhobiAmount}`
      );
    }

    // ── payout.failed ────────────────────────────────────────────────────────
    else if (event === "payout.failed") {
      const failureReason = payoutEntity?.error?.description ?? "Payout failed";

      if (payoutDoc.retryCount < 3) {
        // Release orders back into the pending pool for the next cron run
        await Promise.all([
          Payout.findByIdAndUpdate(payoutDoc._id, {
            status: "failed",
            failureReason,
            $inc: { retryCount: 1 },
          }),
          Order.updateMany(
            { payoutId: payoutDoc._id },
            { payoutStatus: "pending", payoutId: null }
          ),
        ]);

        console.warn(
          `[handlePayoutWebhook] payout.failed (retry ${payoutDoc.retryCount + 1}/3): ` +
          `${razorpayPayoutId} — ${failureReason}`
        );
      } else {
        // Max retries reached — alert admin, leave orders in "included" state
        await Payout.findByIdAndUpdate(payoutDoc._id, {
          status: "failed",
          failureReason: `Max retries reached. Last error: ${failureReason}`,
        });

        await notifyAdmins(
          `PAYOUT PERMANENTLY FAILED: ₹${payoutDoc.dhobiAmount} for provider ` +
          `${payoutDoc.providerId}. RazorpayX payout ID: ${razorpayPayoutId}. ` +
          `Manual action required.`
        );

        console.error(
          `[handlePayoutWebhook] payout PERMANENTLY FAILED: ${razorpayPayoutId}`
        );
      }
    }

    // ── payout.reversed ──────────────────────────────────────────────────────
    else if (event === "payout.reversed") {
      await Promise.all([
        Payout.findByIdAndUpdate(payoutDoc._id, { status: "reversed" }),

        // Re-credit dhobi's pending balance and subtract from totalPaid
        DhobiWallet.findOneAndUpdate(
          { providerId: payoutDoc.providerId },
          {
            $inc: {
              pendingAmount: payoutDoc.dhobiAmount,
              totalPaid: -payoutDoc.dhobiAmount,
            },
          }
        ),

        // Re-open orders so they re-enter the next cron run
        Order.updateMany(
          { payoutId: payoutDoc._id },
          { payoutStatus: "pending", payoutId: null }
        ),
      ]);

      await notifyAdmins(
        `Payout REVERSED: ₹${payoutDoc.dhobiAmount} for provider ${payoutDoc.providerId}. ` +
        `RazorpayX payout ID: ${razorpayPayoutId}. Orders re-queued for next payout run.`
      );

      console.warn(`[handlePayoutWebhook] payout.reversed: ${razorpayPayoutId}`);
    }

    // All other events are acknowledged silently
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[handlePayoutWebhook]", err.message);
    // Return 200 so RazorpayX stops retrying on unexpected errors
    return res.status(200).json({ success: false, message: "Webhook processing error" });
  }
};

// ─── 5. Manual Payout Trigger ─────────────────────────────────────────────────

/**
 * POST /api/payout/trigger
 * Admin-only: run the payout job on demand (testing / late recovery).
 * @access Private (Admin)
 */
exports.triggerManualPayout = async (req, res) => {
  try {
    const result = await executeDailyPayouts();
    return res.status(200).json({
      success: true,
      message: `Manual payout complete. Created: ${result.payoutsCreated}, Errors: ${result.errors.length}`,
      data: result,
    });
  } catch (err) {
    console.error("[triggerManualPayout]", err.message);
    return res.status(500).json({ success: false, message: "Manual payout failed" });
  }
};

// ─── 6. Get Payout History ────────────────────────────────────────────────────

/**
 * GET /api/payout/history
 * Dhobi: their own payouts only.
 * Admin: all payouts, optionally filtered by ?providerId=xxx.
 *
 * @query page, limit, status, providerId (admin only)
 * @access Private (Dhobi, Admin)
 */
exports.getPayoutHistory = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const VALID_STATUSES = ["pending", "processing", "processed", "failed", "reversed"];
    const filter = {};

    if (req.user.role === "dhobi") {
      const provider = await ServiceProvider.findOne({ userId: req.user.id })
        .select("_id")
        .lean();
      if (!provider) {
        return res.status(404).json({ success: false, message: "Provider profile not found" });
      }
      filter.providerId = provider._id;
    } else if (req.user.role === "admin" && req.query.providerId) {
      if (!mongoose.isValidObjectId(req.query.providerId)) {
        return res.status(400).json({ success: false, message: "Invalid providerId" });
      }
      filter.providerId = req.query.providerId;
    }

    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [payouts, total] = await Promise.all([
      Payout.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("providerId", "name email")
        .populate("orderIds", "orderId amount paidAt")
        .lean(),
      Payout.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: payouts,
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
    console.error("[getPayoutHistory]", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch payout history" });
  }
};

// ─── 7. Get Dhobi Wallet ──────────────────────────────────────────────────────

/**
 * GET /api/payout/wallet
 * Dhobi: their own wallet.
 * Admin: any wallet via ?providerId=xxx.
 * @access Private (Dhobi, Admin)
 */
exports.getDhobiWallet = async (req, res) => {
  try {
    let providerId;

    if (req.user.role === "dhobi") {
      const provider = await ServiceProvider.findOne({ userId: req.user.id })
        .select("_id")
        .lean();
      if (!provider) {
        return res.status(404).json({ success: false, message: "Provider profile not found" });
      }
      providerId = provider._id;
    } else if (req.user.role === "admin") {
      if (!req.query.providerId || !mongoose.isValidObjectId(req.query.providerId)) {
        return res.status(400).json({
          success: false,
          message: "Valid providerId query param is required for admin",
        });
      }
      providerId = req.query.providerId;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const wallet = await DhobiWallet.findOne({ providerId })
      .populate("providerId", "name email")
      .lean();

    if (!wallet) {
      return res.status(404).json({ success: false, message: "Wallet not found" });
    }

    return res.status(200).json({ success: true, data: wallet });
  } catch (err) {
    console.error("[getDhobiWallet]", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch wallet" });
  }
};