"use strict";

const User = require("../models/userModel");
const ServiceProvider = require("../models/serviceProviderModel");
const Order = require("../models/orderModel");
const Notification = require("../models/notificationModel");
const { getIO } = require("../socket");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validate a MongoDB ObjectId string to avoid CastError on bad :id params */
const { isValidObjectId } = require("mongoose");

const validateId = (id, res, label = "Resource") => {
  if (!isValidObjectId(id)) {
    res.status(400).json({ success: false, message: `Invalid ${label} ID` });
    return false;
  }
  return true;
};

/** Emit a socket notification to a specific user and persist it */
const notifyUser = async (userId, message, type = "general") => {
  try {
    const notification = await Notification.create({ userId, message, type });
    getIO().to(userId.toString()).emit("receive-notification", notification);
  } catch (err) {
    console.error("[notifyUser] Failed:", err.message);
  }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/dashboard
 * Aggregated platform stats. Runs all queries in parallel for performance.
 * @access Private (Admin)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      usersCount,
      providersCount,
      ordersCount,
      pendingProvidersCount,
      activeProvidersCount,
      earningsResult,
      ordersByStatus,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "dhobi" }),
      Order.countDocuments(),
      ServiceProvider.countDocuments({ isApproved: "pending" }),
      ServiceProvider.countDocuments({ isApproved: "approved", isActive: true }),
      Order.aggregate([
        { $match: { paymentStatus: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    // Shape order-by-status into a plain object: { pending: 12, delivered: 40, ... }
    const orderStatusBreakdown = ordersByStatus.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: {
        usersCount,
        providersCount,
        pendingProvidersCount,
        activeProvidersCount,
        ordersCount,
        totalEarnings: earningsResult[0]?.total ?? 0,
        orderStatusBreakdown,
      },
    });
  } catch (err) {
    console.error("[getDashboardStats]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Providers ────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/providers
 * All service providers with pagination, search, and status filter.
 * @query page, limit, search, status (pending|approved|rejected)
 * @access Private (Admin)
 */
exports.getAllProviders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const VALID_STATUSES = ["pending", "approved", "rejected"];
    const filter = {};

    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
      filter.isApproved = req.query.status;
    }

    if (req.query.search?.trim()) {
      const rx = { $regex: req.query.search.trim(), $options: "i" };
      filter.$or = [{ name: rx }, { email: rx }, { serviceAreas: rx }];
    }

    const [providers, total] = await Promise.all([
      ServiceProvider.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // Populate only safe user fields — schema select:false guards the rest
        .populate("userId", "name email mobile role isVerified createdAt")
        .lean(),
      ServiceProvider.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: providers,
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
    console.error("[getAllProviders]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * GET /api/admin/provider/:id
 * Get a single provider with full details.
 * @access Private (Admin)
 */
exports.getProviderById = async (req, res) => {
  if (!validateId(req.params.id, res, "Provider")) return;

  try {
    const provider = await ServiceProvider.findById(req.params.id)
      .populate("userId", "name email mobile role isVerified createdAt")
      .lean();

    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    // Fetch some quick stats alongside
    const [ordersCount, completedOrdersCount, earnings] = await Promise.all([
      Order.countDocuments({ providerId: provider._id }),
      Order.countDocuments({ providerId: provider._id, status: "delivered" }),
      Order.aggregate([
        { $match: { providerId: provider._id, paymentStatus: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...provider,
        stats: {
          ordersCount,
          completedOrdersCount,
          totalEarnings: earnings[0]?.total ?? 0,
        },
      },
    });
  } catch (err) {
    console.error("[getProviderById]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/provider/:id/approve
 * Approves a pending service provider and verifies their user account.
 * @access Private (Admin)
 */
exports.approveProvider = async (req, res) => {
  if (!validateId(req.params.id, res, "Provider")) return;

  try {
    const provider = await ServiceProvider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (provider.isApproved === "approved") {
      return res.status(409).json({ success: false, message: "Provider is already approved" });
    }

    provider.isApproved = "approved";
    provider.isActive = true;
    await provider.save();

    const user = await User.findByIdAndUpdate(
      provider.userId,
      { isVerified: true },
      { new: true }
    ).lean();

    if (!user) {
      // Provider exists but linked user was deleted — flag it but don't fail
      console.warn(`[approveProvider] Provider ${provider._id} has no linked user ${provider.userId}`);
    }

    // Notify the provider
    notifyUser(
      provider.userId,
      "Congratulations! Your service provider account has been approved. You can now start receiving orders.",
      "general"
    );

    return res.status(200).json({
      success: true,
      message: "Provider approved successfully",
      data: {
        provider: {
          _id: provider._id,
          isApproved: provider.isApproved,
          isActive: provider.isActive,
        },
        user: user
          ? { _id: user._id, isVerified: user.isVerified }
          : null,
      },
    });
  } catch (err) {
    console.error("[approveProvider]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/provider/:id/reject
 * Rejects a pending provider application with an optional reason.
 * Body: { reason? }
 * @access Private (Admin)
 */
exports.rejectProvider = async (req, res) => {
  if (!validateId(req.params.id, res, "Provider")) return;

  try {
    const provider = await ServiceProvider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (provider.isApproved === "rejected") {
      return res.status(409).json({ success: false, message: "Provider is already rejected" });
    }

    provider.isApproved = "rejected";
    provider.isActive = false;
    await provider.save();

    const reason = req.body.reason?.trim() || "Your application did not meet our requirements.";

    notifyUser(
      provider.userId,
      `Your service provider application has been rejected. Reason: ${reason}`,
      "general"
    );

    return res.status(200).json({
      success: true,
      message: "Provider rejected",
      data: { _id: provider._id, isApproved: provider.isApproved },
    });
  } catch (err) {
    console.error("[rejectProvider]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/provider/:id/ban
 * Suspends an approved provider (sets isActive: false).
 * Body: { reason? }
 * @access Private (Admin)
 */
exports.banProvider = async (req, res) => {
  if (!validateId(req.params.id, res, "Provider")) return;

  try {
    const provider = await ServiceProvider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (!provider.isActive) {
      return res.status(409).json({ success: false, message: "Provider is already suspended" });
    }

    // isActive is Boolean — was being set to string 'false' in original (bug)
    provider.isActive = false;
    await provider.save();

    const reason = req.body.reason?.trim() || "Violation of platform policies.";

    notifyUser(
      provider.userId,
      `Your service provider account has been suspended. Reason: ${reason}`,
      "general"
    );

    return res.status(200).json({
      success: true,
      message: "Provider suspended successfully",
      data: { _id: provider._id, isActive: provider.isActive },
    });
  } catch (err) {
    console.error("[banProvider]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/provider/:id/unban
 * Reactivates a suspended provider.
 * @access Private (Admin)
 */
exports.unbanProvider = async (req, res) => {
  if (!validateId(req.params.id, res, "Provider")) return;

  try {
    const provider = await ServiceProvider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (provider.isApproved !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot reactivate a provider that is not approved",
      });
    }

    if (provider.isActive) {
      return res.status(409).json({ success: false, message: "Provider is already active" });
    }

    provider.isActive = true;
    await provider.save();

    notifyUser(
      provider.userId,
      "Your service provider account has been reactivated. You can now receive orders again.",
      "general"
    );

    return res.status(200).json({
      success: true,
      message: "Provider reactivated successfully",
      data: { _id: provider._id, isActive: provider.isActive },
    });
  } catch (err) {
    console.error("[unbanProvider]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * All regular users with pagination and search.
 * @query page, limit, search
 * @access Private (Admin)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { role: "user" };

    if (req.query.search?.trim()) {
      const rx = { $regex: req.query.search.trim(), $options: "i" };
      filter.$or = [{ name: rx }, { email: rx }, { mobile: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
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
    console.error("[getAllUsers]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/user/:id/ban
 * Suspends a user by setting isVerified: false, locking them out.
 * Body: { reason? }
 * @access Private (Admin)
 */
exports.banUser = async (req, res) => {
  if (!validateId(req.params.id, res, "User")) return;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Prevent admins from banning other admins
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot ban an admin account" });
    }

    if (!user.isVerified) {
      return res.status(409).json({ success: false, message: "User is already suspended" });
    }

    user.isVerified = false;
    await user.save();

    const reason = req.body.reason?.trim() || "Violation of platform terms of service.";

    notifyUser(
      user._id,
      `Your account has been suspended. Reason: ${reason}`,
      "general"
    );

    return res.status(200).json({
      success: true,
      message: "User suspended successfully",
      data: { _id: user._id, isVerified: user.isVerified },
    });
  } catch (err) {
    console.error("[banUser]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * PATCH /api/admin/user/:id/unban
 * Reinstates a suspended user.
 * @access Private (Admin)
 */
exports.unbanUser = async (req, res) => {
  if (!validateId(req.params.id, res, "User")) return;

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(409).json({ success: false, message: "User is already active" });
    }

    user.isVerified = true;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    notifyUser(user._id, "Your account has been reinstated. Welcome back!", "general");

    return res.status(200).json({
      success: true,
      message: "User reinstated successfully",
      data: { _id: user._id, isVerified: user.isVerified },
    });
  } catch (err) {
    console.error("[unbanUser]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Orders ───────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/orders
 * All orders with pagination, status filter, and provider/user population.
 * @query page, limit, status, paymentStatus
 * @access Private (Admin)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const VALID_ORDER_STATUSES = ["pending", "accepted", "in_progress", "ready", "delivered", "cancelled"];
    const VALID_PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"];

    const filter = {};
    if (req.query.status && VALID_ORDER_STATUSES.includes(req.query.status)) {
      filter.status = req.query.status;
    }
    if (req.query.paymentStatus && VALID_PAYMENT_STATUSES.includes(req.query.paymentStatus)) {
      filter.paymentStatus = req.query.paymentStatus;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email mobile")
        .populate("providerId", "name email mobile address")
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
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
    console.error("[getAllOrders]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Transactions ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/transactions
 * All completed-payment orders with pagination.
 * @query page, limit, paymentStatus
 * @access Private (Admin)
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const VALID_PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"];
    const paymentStatus =
      req.query.paymentStatus && VALID_PAYMENT_STATUSES.includes(req.query.paymentStatus)
        ? req.query.paymentStatus
        : "completed";

    const filter = { paymentStatus };

    const [transactions, total] = await Promise.all([
      Order.find(filter)
        .sort({ paidAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("userId", "name email")
        .populate("providerId", "name email")
        // razorpaySignature is select:false in schema — safe
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: transactions,
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
    console.error("[getAllTransactions]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Reports ──────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/reports
 * Monthly revenue and order-count report.
 * @query year (defaults to current year)
 * @access Private (Admin)
 */
exports.generateReports = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    if (year < 2000 || year > new Date().getFullYear() + 1) {
      return res.status(400).json({ success: false, message: "Invalid year parameter" });
    }

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year + 1}-01-01T00:00:00.000Z`);

    const [monthlyRevenue, orderStatusSummary, topProviders] = await Promise.all([
      // Monthly revenue breakdown
      Order.aggregate([
        {
          $match: {
            paymentStatus: "completed",
            createdAt: { $gte: startOfYear, $lt: endOfYear },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            totalEarnings: { $sum: "$amount" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]),

      // Orders by status for the year
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfYear, $lt: endOfYear } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Top 5 providers by earnings
      Order.aggregate([
        {
          $match: {
            paymentStatus: "completed",
            createdAt: { $gte: startOfYear, $lt: endOfYear },
          },
        },
        { $group: { _id: "$providerId", totalEarnings: { $sum: "$amount" }, orders: { $sum: 1 } } },
        { $sort: { totalEarnings: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "serviceproviders",
            localField: "_id",
            foreignField: "_id",
            as: "provider",
          },
        },
        { $unwind: { path: "$provider", preserveNullAndEmpty: true } },
        {
          $project: {
            totalEarnings: 1,
            orders: 1,
            "provider.name": 1,
            "provider.email": 1,
          },
        },
      ]),
    ]);

    // Normalise monthly data: fill missing months with zeroes
    const monthlyMap = monthlyRevenue.reduce((acc, row) => {
      acc[row._id.month] = { totalEarnings: row.totalEarnings, orderCount: row.orderCount };
      return acc;
    }, {});

    const fullMonthlyReport = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalEarnings: monthlyMap[i + 1]?.totalEarnings ?? 0,
      orderCount: monthlyMap[i + 1]?.orderCount ?? 0,
    }));

    const statusBreakdown = orderStatusSummary.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    const totalRevenue = fullMonthlyReport.reduce((sum, m) => sum + m.totalEarnings, 0);

    return res.status(200).json({
      success: true,
      data: {
        year,
        totalRevenue,
        monthlyReport: fullMonthlyReport,
        orderStatusBreakdown: statusBreakdown,
        topProviders,
      },
    });
  } catch (err) {
    console.error("[generateReports]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
