// // "use strict";

// // const ServiceProvider = require("../models/serviceProviderModel");
// // const Order = require("../models/orderModel");
// // const User = require("../models/userModel");
// // const Notification = require("../models/notificationModel");
// // const DhobiWallet = require("../models/dhobiWalletModel");
// // const bcrypt = require("bcryptjs");
// // const axios = require("axios");
// // const { isValidObjectId } = require("mongoose");
// // const { getIO } = require("../socket");
// // const { sendOtpEmail } = require("../utils/emailService");

// // // ─── Constants ────────────────────────────────────────────────────────────────

// // const BCRYPT_ROUNDS = 12;

// // const VALID_ORDER_STATUSES = [
// //   "pending",
// //   "accepted",
// //   "in_progress",
// //   "ready",
// //   "delivered",
// //   "cancelled",
// // ];

// // // ─── RazorpayX helpers (used by registerDhobiForPayoutInternal) ───────────────

// // const RZPX = "https://api.razorpay.com/v1";
// // const rzpxAuth = () =>
// //   "Basic " +
// //   Buffer.from(
// //     `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
// //   ).toString("base64");

// // // ─── Helpers ──────────────────────────────────────────────────────────────────

// // const validateId = (id, res, label = "Resource") => {
// //   if (!isValidObjectId(id)) {
// //     res.status(400).json({ success: false, message: `Invalid ${label} ID` });
// //     return false;
// //   }
// //   return true;
// // };

// // const findProviderByIdentifier = async (identifier, options = {}) => {
// //   if (!isValidObjectId(identifier)) return null;

// //   let providerQuery = ServiceProvider.findById(identifier);
// //   if (options.populateUser) {
// //     providerQuery = providerQuery.populate(
// //       "userId",
// //       options.populateUserFields || "name email mobile isVerified createdAt"
// //     );
// //   }
// //   if (options.lean) {
// //     const provider = await providerQuery.lean();
// //     if (provider) return provider;

// //     let fallbackQuery = ServiceProvider.findOne({ userId: identifier });
// //     if (options.populateUser) {
// //       fallbackQuery = fallbackQuery.populate(
// //         "userId",
// //         options.populateUserFields || "name email mobile isVerified createdAt"
// //       );
// //     }
// //     return fallbackQuery.lean();
// //   }

// //   const provider = await providerQuery;
// //   if (provider) return provider;

// //   let fallbackQuery = ServiceProvider.findOne({ userId: identifier });
// //   if (options.populateUser) {
// //     fallbackQuery = fallbackQuery.populate(
// //       "userId",
// //       options.populateUserFields || "name email mobile isVerified createdAt"
// //     );
// //   }
// //   return fallbackQuery;
// // };

// // const notifyUser = async (userId, message, type = "general") => {
// //   try {
// //     const notification = await Notification.create({ userId, message, type });
// //     getIO().to(userId.toString()).emit("receive-notification", notification);
// //   } catch (err) {
// //     console.error("[notifyUser]", err.message);
// //   }
// // };

// // const notifyAdmins = async (message) => {
// //   try {
// //     const admins = await User.find({ role: "admin" }).select("_id").lean();
// //     if (!admins.length) return;

// //     const notifications = admins.map((a) => ({
// //       userId: a._id,
// //       type: "general",
// //       message,
// //     }));

// //     const saved = await Notification.insertMany(notifications, { ordered: false });
// //     const io = getIO();
// //     for (const n of saved) {
// //       io.to(n.userId.toString()).emit("receive-notification", n);
// //     }
// //   } catch (err) {
// //     console.error("[notifyAdmins]", err.message);
// //   }
// // };

// // // ─── Internal RazorpayX registration ─────────────────────────────────────────
// // //
// // // Called from createProvider after the ServiceProvider document is saved.
// // // Uses data already in memory — no extra DB round trips.
// // // On failure it logs and lets the caller's .catch() handle it gracefully.
// // // Admin can retry via: POST /api/payout/register/:providerId

// // const registerDhobiForPayoutInternal = async (providerId, details) => {
// //   const {
// //     owner, email, mobile, name, dhobiId,
// //     accountHolderName, accountNumber, ifscCode,
// //   } = details;

// //   // Step A — Create RazorpayX contact
// //   const contactRes = await axios.post(
// //     `${RZPX}/contacts`,
// //     {
// //       name: owner,
// //       email,
// //       contact: mobile,
// //       type: "vendor",
// //       reference_id: providerId.toString(),
// //       notes: { dhobiId, business: name },
// //     },
// //     { headers: { Authorization: rzpxAuth(), "Content-Type": "application/json" } }
// //   );

// //   const contactId = contactRes.data.id; // cont_xxxxx

// //   // Step B — Create fund account linked to contact
// //   const fundRes = await axios.post(
// //     `${RZPX}/fund_accounts`,
// //     {
// //       contact_id: contactId,
// //       account_type: "bank_account",
// //       bank_account: {
// //         name: accountHolderName,
// //         ifsc: ifscCode,
// //         account_number: accountNumber,
// //       },
// //     },
// //     { headers: { Authorization: rzpxAuth(), "Content-Type": "application/json" } }
// //   );

// //   const fundAccountId = fundRes.data.id; // fa_xxxxx

// //   // Step C — Persist IDs on ServiceProvider
// //   await ServiceProvider.findByIdAndUpdate(providerId, {
// //     razorpayContactId: contactId,
// //     razorpayFundAccountId: fundAccountId,
// //     isFundAccountVerified: true,
// //   });

// //   // Step D — Create DhobiWallet (upsert — safe to call multiple times)
// //   await DhobiWallet.findOneAndUpdate(
// //     { providerId },
// //     { $setOnInsert: { providerId } },
// //     { upsert: true, new: true }
// //   );

// //   console.info(
// //     `[registerDhobiForPayoutInternal] Provider ${providerId} → ` +
// //     `contact=${contactId}, fundAccount=${fundAccountId}`
// //   );
// // };

// // // ─── Controllers ──────────────────────────────────────────────────────────────

// // /**
// //  * POST /api/provider/create
// //  * Admin creates a dhobi: User → ServiceProvider → RazorpayX registration.
// //  * RazorpayX registration is fire-and-forget (non-blocking).
// //  * @access Private (Admin)
// //  */
// // exports.createProvider = async (req, res) => {
// //   const {
// //     name, email, mobile, password,
// //     location, serviceAreas, profilePicture,
// //     owner, address, commissionRate, services,
// //     bankDetails,
// //   } = req.body;

// //   // ── Required field validation ────────────────────────────────────────────
// //   const missing = [];
// //   if (!name?.trim()) missing.push("name");
// //   if (!email?.trim()) missing.push("email");
// //   const mobileStr = String(mobile || "").trim();
// //   if (!mobileStr) missing.push("mobile");
// //   if (!password) missing.push("password");
// //   if (!owner?.trim()) missing.push("owner");
// //   if (!address?.trim()) missing.push("address");
// //   if (commissionRate === undefined) missing.push("commissionRate");

// //   if (!bankDetails || typeof bankDetails !== "object") {
// //     return res.status(400).json({ success: false, message: "Bank details are required" });
// //   }

// //   const { accountHolderName, accountNumber, ifscCode, bankName, branchName, accountType } = bankDetails;

// //   if (!accountHolderName?.trim()) missing.push("bankDetails.accountHolderName");
// //   if (!accountNumber?.trim()) missing.push("bankDetails.accountNumber");
// //   if (!ifscCode?.trim()) missing.push("bankDetails.ifscCode");
// //   if (!bankName?.trim()) missing.push("bankDetails.bankName");
// //   if (!branchName?.trim()) missing.push("bankDetails.branchName");

// //   if (missing.length) {
// //     return res.status(400).json({
// //       success: false,
// //       message: `Missing required fields: ${missing.join(", ")}`,
// //     });
// //   }

// //   const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
// //   if (!ifscRegex.test(ifscCode.trim().toUpperCase())) {
// //     return res.status(400).json({
// //       success: false,
// //       message: "Invalid IFSC code format (e.g. SBIN0001234)",
// //     });
// //   }

// //   if (accountType && !["savings", "current"].includes(accountType)) {
// //     return res.status(400).json({
// //       success: false,
// //       message: "Account type must be either 'savings' or 'current'",
// //     });
// //   }

// //   if (password.length < 8) {
// //     return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
// //   }

// //   if (
// //     !location?.coordinates ||
// //     !Array.isArray(location.coordinates) ||
// //     location.coordinates.length !== 2
// //   ) {
// //     return res.status(400).json({
// //       success: false,
// //       message: "location.coordinates must be [longitude, latitude]",
// //     });
// //   }

// //   const [lng, lat] = location.coordinates;
// //   if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
// //     return res.status(400).json({
// //       success: false,
// //       message: "Coordinates out of range. Longitude: -180–180, Latitude: -90–90",
// //     });
// //   }

// //   const [emailTaken, mobileTaken] = await Promise.all([
// //     User.findOne({ email: email.trim().toLowerCase() }).lean(),
// //     User.findOne({ mobile: mobileStr }).lean(),
// //   ]);

// //   if (emailTaken) {
// //     return res.status(409).json({ success: false, message: "Email is already registered" });
// //   }
// //   if (mobileTaken) {
// //     return res.status(409).json({ success: false, message: "Mobile number is already registered" });
// //   }

// //   let savedUser = null;

// //   try {
// //     // Step 1 — Create User
// //     const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

// //     savedUser = await User.create({
// //       name: name.trim(),
// //       email: email.trim().toLowerCase(),
// //       mobile: mobileStr,
// //       password: hashedPassword,
// //       location: { type: "Point", coordinates: [lng, lat] },
// //       serviceAreas: serviceAreas?.trim(),
// //       profilePicture: profilePicture?.trim(),
// //       role: "dhobi",
// //       isVerified: false,
// //     });

// //     // Step 2 — Create ServiceProvider
// //     const provider = await ServiceProvider.create({
// //       userId: savedUser._id,
// //       name: name.trim(),
// //       owner: owner.trim(),
// //       email: email.trim().toLowerCase(),
// //       mobile: mobileStr,
// //       address: address.trim(),
// //       serviceAreas: serviceAreas?.trim() || "",
// //       location: { type: "Point", coordinates: [lng, lat] },
// //       commissionRate: Number(commissionRate),
// //       services: Array.isArray(services) ? services : [],
// //       bankDetails: {
// //         accountHolderName: accountHolderName.trim(),
// //         accountNumber: accountNumber.trim(),
// //         ifscCode: ifscCode.trim().toUpperCase(),
// //         bankName: bankName.trim(),
// //         branchName: branchName.trim(),
// //         accountType: accountType || "savings",
// //         isVerified: false,
// //       },
// //       isApproved: "pending",
// //       isActive: false,
// //     });

// //     // Step 3 — Register on RazorpayX (non-blocking fire-and-forget)
// //     registerDhobiForPayoutInternal(provider._id, {
// //       owner: owner.trim(),
// //       email: email.trim().toLowerCase(),
// //       mobile: mobileStr,
// //       name: name.trim(),
// //       dhobiId: provider.dhobiId,
// //       accountHolderName: accountHolderName.trim(),
// //       accountNumber: accountNumber.trim(),
// //       ifscCode: ifscCode.trim().toUpperCase(),
// //     }).catch((err) =>
// //       console.error(
// //         `[createProvider] RazorpayX registration failed for ${provider._id}:`,
// //         err?.response?.data?.error?.description ?? err.message,
// //         "— Retry via POST /api/payout/register/:providerId"
// //       )
// //     );

// //     // Step 4 — Notify admins + welcome email (non-blocking)
// //     notifyAdmins(
// //       `New dhobi registered: ${name.trim()} (${email.trim().toLowerCase()}) — awaiting approval`
// //     );

// //     sendOtpEmail(email.trim().toLowerCase(), null, "welcome").catch((err) =>
// //       console.error("[createProvider] Welcome email failed:", err.message)
// //     );

// //     return res.status(201).json({
// //       success: true,
// //       message:
// //         "Service provider created successfully and is pending approval. " +
// //         "RazorpayX registration is processing in the background.",
// //       data: {
// //         user: { _id: savedUser._id, name: savedUser.name, email: savedUser.email },
// //         provider: { _id: provider._id, dhobiId: provider.dhobiId, isApproved: provider.isApproved },
// //       },
// //     });
// //   } catch (err) {
// //     console.error("[createProvider]", err);

// //     // Rollback: delete user if provider creation failed
// //     if (savedUser?._id) {
// //       await User.deleteOne({ _id: savedUser._id }).catch((e) =>
// //         console.error("[createProvider] Rollback failed:", e.message)
// //       );
// //     }

// //     if (err.name === "ValidationError") {
// //       const messages = Object.values(err.errors).map((e) => e.message);
// //       return res.status(400).json({ success: false, message: messages.join(". ") });
// //     }

// //     if (err.code === 11000) {
// //       const field = Object.keys(err.keyPattern || {})[0] || "field";
// //       return res.status(409).json({
// //         success: false,
// //         message: `An account with this ${field} already exists`,
// //       });
// //     }

// //     if (err.name === "MongooseError" && err.message.includes("buffering timed out")) {
// //       return res.status(503).json({
// //         success: false,
// //         message: "Database connection timeout. Please try again.",
// //       });
// //     }

// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * GET /api/provider
// //  * Public listing of approved, active providers.
// //  * @query page, limit, search, lat, lng, radius (km)
// //  * @access Public
// //  */
// // exports.getProviders = async (req, res) => {
// //   try {
// //     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
// //     const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
// //     const skip = (page - 1) * limit;

// //     const filter = {};

// //     if (req.query.search?.trim()) {
// //       const rx = { $regex: req.query.search.trim(), $options: "i" };
// //       filter.$or = [{ name: rx }, { serviceAreas: rx }, { address: rx }];
// //     }

// //     const { lat, lng, radius } = req.query;
// //     if (lat && lng) {
// //       const radiusKm = parseFloat(radius) || 10;
// //       filter.location = {
// //         $nearSphere: {
// //           $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
// //           $maxDistance: radiusKm * 1000,
// //         },
// //       };
// //       const countFilter = { isApproved: "approved", isActive: true };
// //       const [providers, total] = await Promise.all([
// //         ServiceProvider.find(filter).skip(skip).limit(limit).lean(),
// //         ServiceProvider.countDocuments(countFilter),
// //       ]);
// //       return res.status(200).json({
// //         success: true,
// //         data: providers,
// //         pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
// //       });
// //     }

// //     const [providers, total] = await Promise.all([
// //       ServiceProvider.find(filter).sort({ rating: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
// //       ServiceProvider.countDocuments(filter),
// //     ]);

// //     return res.status(200).json({
// //       success: true,
// //       data: providers,
// //       pagination: {
// //         total, page, limit,
// //         totalPages: Math.ceil(total / limit),
// //         hasNextPage: page * limit < total,
// //         hasPrevPage: page > 1,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("[getProviders]", err);
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * GET /api/provider/profile/:id
// //  * @access Private
// //  */
// // exports.getProfile = async (req, res) => {
// //   if (!validateId(req.params.id, res, "Provider")) return;

// //   try {
// //     const provider = await findProviderByIdentifier(req.params.id, {
// //       lean: true,
// //       populateUser: true,
// //     });

// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider not found" });
// //     }

// //     return res.status(200).json({ success: true, data: provider });
// //   } catch (err) {
// //     console.error("[getProfile]", err);
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * PATCH /api/provider/profile/:id
// //  * @access Private (own provider or admin)
// //  */
// // exports.updateProfile = async (req, res) => {
// //   if (!validateId(req.params.id, res, "Provider")) return;

// //   try {
// //     const provider = await findProviderByIdentifier(req.params.id);
// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider not found" });
// //     }

// //     const isOwner = provider.userId.toString() === req.user.id.toString();
// //     const isAdmin = req.user.role === "admin";

// //     if (!isOwner && !isAdmin) {
// //       return res.status(403).json({
// //         success: false,
// //         message: "You are not authorized to update this profile",
// //       });
// //     }

// //     const ADMIN_ONLY_FIELDS = new Set(["commissionRate", "isApproved", "isActive", "earnings"]);
// //     const IMMUTABLE_FIELDS = new Set(["userId", "dhobiId", "rating", "ordersCompleted"]);

// //     const updates = {};
// //     for (const key of Object.keys(req.body)) {
// //       if (IMMUTABLE_FIELDS.has(key)) continue;
// //       if (ADMIN_ONLY_FIELDS.has(key) && !isAdmin) continue;
// //       updates[key] = req.body[key];
// //     }

// //     if (Object.keys(updates).length === 0) {
// //       return res.status(400).json({ success: false, message: "No valid fields provided for update" });
// //     }

// //     if (updates.email) {
// //       updates.email = updates.email.trim().toLowerCase();
// //     }

// //     if (updates.commissionRate !== undefined) {
// //       const rate = Number(updates.commissionRate);
// //       if (isNaN(rate) || rate < 0 || rate > 100) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "Commission rate must be a number between 0 and 100",
// //         });
// //       }
// //       updates.commissionRate = rate;
// //     }

// //     if (updates.location) {
// //       if (
// //         updates.location.type !== "Point" ||
// //         !Array.isArray(updates.location.coordinates) ||
// //         updates.location.coordinates.length !== 2
// //       ) {
// //         return res.status(400).json({
// //           success: false,
// //           message: "location.coordinates must be [longitude, latitude]",
// //         });
// //       }
// //       const [pLng, pLat] = updates.location.coordinates;
// //       if (pLng < -180 || pLng > 180 || pLat < -90 || pLat > 90) {
// //         return res.status(400).json({ success: false, message: "Coordinates out of range" });
// //       }
// //     }

// //     // Sync User.isVerified when approval/active status changes
// //     if (updates.isApproved !== undefined || updates.isActive !== undefined) {
// //       const approvedStatus = updates.isApproved ?? provider.isApproved;
// //       const activeStatus = updates.isActive ?? provider.isActive;
// //       const shouldBeVerified = approvedStatus === "approved" && activeStatus === true;

// //       const user = await User.findByIdAndUpdate(
// //         provider.userId,
// //         { isVerified: shouldBeVerified },
// //         { new: true }
// //       );

// //       if (!user) {
// //         console.warn(`[updateProfile] No linked user found for provider ${provider._id}`);
// //       }
// //     }

// //     const updated = await ServiceProvider.findByIdAndUpdate(
// //       provider._id,
// //       { $set: updates },
// //       { new: true, runValidators: true }
// //     ).lean();

// //     return res.status(200).json({
// //       success: true,
// //       message: "Profile updated successfully",
// //       data: updated,
// //     });
// //   } catch (err) {
// //     console.error("[updateProfile]", err);

// //     if (err.name === "ValidationError") {
// //       const messages = Object.values(err.errors).map((e) => e.message);
// //       return res.status(400).json({ success: false, message: messages.join(". ") });
// //     }

// //     if (err.code === 11000) {
// //       const field = Object.keys(err.keyPattern || {})[0] || "field";
// //       return res.status(409).json({ success: false, message: `This ${field} is already in use` });
// //     }

// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * PATCH /api/provider/toggle-active/:id
// //  * @access Private (Admin or own provider)
// //  */
// // exports.toggleActive = async (req, res) => {
// //   if (!validateId(req.params.id, res, "Provider")) return;

// //   try {
// //     const provider = await findProviderByIdentifier(req.params.id);
// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider not found" });
// //     }

// //     if (provider.isApproved !== "approved") {
// //       return res.status(400).json({
// //         success: false,
// //         message: "Provider must be approved before toggling active status",
// //       });
// //     }

// //     const isOwner = provider.userId.toString() === req.user.id.toString();
// //     const isAdmin = req.user.role === "admin";

// //     if (!isOwner && !isAdmin) {
// //       return res.status(403).json({
// //         success: false,
// //         message: "Not authorized to change this provider's status",
// //       });
// //     }

// //     provider.isActive = !provider.isActive;
// //     await provider.save();

// //     return res.status(200).json({
// //       success: true,
// //       message: `Provider is now ${provider.isActive ? "active" : "inactive"}`,
// //       data: { _id: provider._id, isActive: provider.isActive },
// //     });
// //   } catch (err) {
// //     console.error("[toggleActive]", err);
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * GET /api/provider/orders
// //  * @access Private (Provider)
// //  */
// // exports.getOrders = async (req, res) => {
// //   try {
// //     const provider = await ServiceProvider.findOne({ userId: req.user.id }).select("_id").lean();
// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider profile not found" });
// //     }

// //     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
// //     const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
// //     const skip = (page - 1) * limit;

// //     const filter = { providerId: provider._id };
// //     if (req.query.status && VALID_ORDER_STATUSES.includes(req.query.status)) {
// //       filter.status = req.query.status;
// //     }

// //     const [orders, total] = await Promise.all([
// //       Order.find(filter)
// //         .sort({ createdAt: -1 })
// //         .skip(skip)
// //         .limit(limit)
// //         .populate("userId", "name email mobile")
// //         .lean(),
// //       Order.countDocuments(filter),
// //     ]);

// //     return res.status(200).json({
// //       success: true,
// //       data: orders,
// //       pagination: {
// //         total, page, limit,
// //         totalPages: Math.ceil(total / limit),
// //         hasNextPage: page * limit < total,
// //         hasPrevPage: page > 1,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("[getOrders]", err);
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * PATCH /api/provider/order/:id/status
// //  * @access Private (Provider who owns the order)
// //  */
// // exports.updateOrderStatus = async (req, res) => {
// //   if (!validateId(req.params.id, res, "Order")) return;

// //   try {
// //     const { status } = req.body;

// //     if (!status) {
// //       return res.status(400).json({ success: false, message: "Status is required" });
// //     }

// //     if (!VALID_ORDER_STATUSES.includes(status)) {
// //       return res.status(400).json({
// //         success: false,
// //         message: `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
// //       });
// //     }

// //     const provider = await ServiceProvider.findOne({ userId: req.user.id }).select("_id").lean();
// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider profile not found" });
// //     }

// //     const order = await Order.findOne({ _id: req.params.id, providerId: provider._id });
// //     if (!order) {
// //       return res.status(404).json({
// //         success: false,
// //         message: "Order not found or does not belong to you",
// //       });
// //     }

// //     const STATUS_RANK = {
// //       pending: 0, accepted: 1, in_progress: 2,
// //       ready: 3, delivered: 4, cancelled: 5,
// //     };

// //     const currentRank = STATUS_RANK[order.status] ?? -1;
// //     const newRank = STATUS_RANK[status] ?? -1;

// //     if (status !== "cancelled" && newRank < currentRank) {
// //       return res.status(400).json({
// //         success: false,
// //         message: `Cannot move order from "${order.status}" back to "${status}"`,
// //       });
// //     }

// //     if (order.status === "delivered" || order.status === "cancelled") {
// //       return res.status(400).json({
// //         success: false,
// //         message: `Order is already ${order.status} and cannot be updated`,
// //       });
// //     }

// //     order.status = status;
// //     await order.save();

// //     notifyUser(
// //       order.userId,
// //       `Your order #${order.orderId} status has been updated to: ${status}`,
// //       "order"
// //     );

// //     return res.status(200).json({
// //       success: true,
// //       message: "Order status updated",
// //       data: { _id: order._id, orderId: order.orderId, status: order.status },
// //     });
// //   } catch (err) {
// //     console.error("[updateOrderStatus]", err);
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * GET /api/provider/analytics
// //  * @access Private (Provider)
// //  */
// // exports.getAnalytics = async (req, res) => {
// //   try {
// //     const provider = await ServiceProvider.findOne({ userId: req.user.id })
// //       .select("_id earnings rating ordersCompleted")
// //       .lean();

// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider profile not found" });
// //     }

// //     const [orderStats, monthlyRevenue] = await Promise.all([
// //       Order.aggregate([
// //         { $match: { providerId: provider._id } },
// //         { $group: { _id: "$status", count: { $sum: 1 } } },
// //       ]),
// //       Order.aggregate([
// //         {
// //           $match: {
// //             providerId: provider._id,
// //             paymentStatus: "completed",
// //             createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
// //             revenue: { $sum: "$amount" },
// //             orders: { $sum: 1 },
// //           },
// //         },
// //         { $sort: { "_id.year": 1, "_id.month": 1 } },
// //       ]),
// //     ]);

// //     const statusBreakdown = orderStats.reduce((acc, { _id, count }) => {
// //       acc[_id] = count;
// //       return acc;
// //     }, {});

// //     return res.status(200).json({
// //       success: true,
// //       data: {
// //         totalOrders: Object.values(statusBreakdown).reduce((a, b) => a + b, 0),
// //         completedOrders: statusBreakdown.delivered ?? 0,
// //         cancelledOrders: statusBreakdown.cancelled ?? 0,
// //         totalEarnings: provider.earnings ?? 0,
// //         rating: provider.rating ?? 0,
// //         statusBreakdown,
// //         monthlyRevenue,
// //       },
// //     });
// //   } catch (err) {
// //     console.error("[getAnalytics]", err);
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // // ─── Services Sub-resource ────────────────────────────────────────────────────

// // /**
// //  * POST /api/provider/profile/:id/services
// //  * @access Private (own provider or admin)
// //  */
// // exports.addService = async (req, res) => {
// //   if (!validateId(req.params.id, res, "Provider")) return;

// //   try {
// //     const { name, price } = req.body;

// //     if (!name?.trim()) {
// //       return res.status(400).json({ success: false, message: "Service name is required" });
// //     }

// //     const parsedPrice = Number(price);
// //     if (isNaN(parsedPrice) || parsedPrice < 0) {
// //       return res.status(400).json({ success: false, message: "Price must be a non-negative number" });
// //     }

// //     const provider = await findProviderByIdentifier(req.params.id);
// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider not found" });
// //     }

// //     const isOwner = provider.userId.toString() === req.user.id.toString();
// //     if (!isOwner && req.user.role !== "admin") {
// //       return res.status(403).json({ success: false, message: "Not authorized" });
// //     }

// //     const duplicate = provider.services.some(
// //       (s) => s.name.toLowerCase() === name.trim().toLowerCase()
// //     );
// //     if (duplicate) {
// //       return res.status(409).json({
// //         success: false,
// //         message: `A service named "${name.trim()}" already exists`,
// //       });
// //     }

// //     provider.services.push({ name: name.trim(), price: parsedPrice });
// //     await provider.save();

// //     const added = provider.services[provider.services.length - 1];

// //     return res.status(201).json({
// //       success: true,
// //       message: "Service added successfully",
// //       data: { service: added, services: provider.services },
// //     });
// //   } catch (err) {
// //     console.error("[addService]", err);
// //     if (err.name === "ValidationError") {
// //       const messages = Object.values(err.errors).map((e) => e.message);
// //       return res.status(400).json({ success: false, message: messages.join(". ") });
// //     }
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * PATCH /api/provider/profile/:id/services/:serviceId
// //  * @access Private (own provider or admin)
// //  */
// // exports.updateService = async (req, res) => {
// //   if (!validateId(req.params.id, res, "Provider")) return;
// //   if (!validateId(req.params.serviceId, res, "Service")) return;

// //   try {
// //     const { name, price } = req.body;

// //     if (name === undefined && price === undefined) {
// //       return res.status(400).json({ success: false, message: "Provide name or price to update" });
// //     }

// //     const provider = await findProviderByIdentifier(req.params.id);
// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider not found" });
// //     }

// //     const isOwner = provider.userId.toString() === req.user.id.toString();
// //     if (!isOwner && req.user.role !== "admin") {
// //       return res.status(403).json({ success: false, message: "Not authorized" });
// //     }

// //     const service = provider.services.id(req.params.serviceId);
// //     if (!service) {
// //       return res.status(404).json({ success: false, message: "Service not found" });
// //     }

// //     if (name !== undefined) {
// //       if (!name.trim()) {
// //         return res.status(400).json({ success: false, message: "Service name cannot be empty" });
// //       }
// //       const duplicate = provider.services.some(
// //         (s) =>
// //           s._id.toString() !== req.params.serviceId &&
// //           s.name.toLowerCase() === name.trim().toLowerCase()
// //       );
// //       if (duplicate) {
// //         return res.status(409).json({
// //           success: false,
// //           message: `Another service named "${name.trim()}" already exists`,
// //         });
// //       }
// //       service.name = name.trim();
// //     }

// //     if (price !== undefined) {
// //       const parsedPrice = Number(price);
// //       if (isNaN(parsedPrice) || parsedPrice < 0) {
// //         return res.status(400).json({ success: false, message: "Price must be a non-negative number" });
// //       }
// //       service.price = parsedPrice;
// //     }

// //     await provider.save();

// //     return res.status(200).json({
// //       success: true,
// //       message: "Service updated successfully",
// //       data: { service, services: provider.services },
// //     });
// //   } catch (err) {
// //     console.error("[updateService]", err);
// //     if (err.name === "ValidationError") {
// //       const messages = Object.values(err.errors).map((e) => e.message);
// //       return res.status(400).json({ success: false, message: messages.join(". ") });
// //     }
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// // /**
// //  * DELETE /api/provider/profile/:id/services/:serviceId
// //  * @access Private (own provider or admin)
// //  */
// // exports.deleteService = async (req, res) => {
// //   if (!validateId(req.params.id, res, "Provider")) return;
// //   if (!validateId(req.params.serviceId, res, "Service")) return;

// //   try {
// //     const provider = await findProviderByIdentifier(req.params.id);
// //     if (!provider) {
// //       return res.status(404).json({ success: false, message: "Provider not found" });
// //     }

// //     const isOwner = provider.userId.toString() === req.user.id.toString();
// //     if (!isOwner && req.user.role !== "admin") {
// //       return res.status(403).json({ success: false, message: "Not authorized" });
// //     }

// //     const service = provider.services.id(req.params.serviceId);
// //     if (!service) {
// //       return res.status(404).json({ success: false, message: "Service not found" });
// //     }

// //     service.deleteOne();
// //     await provider.save();

// //     return res.status(200).json({
// //       success: true,
// //       message: "Service deleted successfully",
// //       data: { services: provider.services },
// //     });
// //   } catch (err) {
// //     console.error("[deleteService]", err);
// //     return res.status(500).json({ success: false, message: "Internal server error" });
// //   }
// // };

// "use strict";

// /**
//  * serviceProviderController.js
//  *
//  * CHANGES vs original:
//  *   updateProfile — when isApproved flips to "approved" and the provider does
//  *   not yet have a razorpayFundAccountId, automatically calls
//  *   payoutController._registerOnRazorpayX as a non-blocking fire-and-forget.
//  *   This covers the gap where dhobis created before the payout system existed,
//  *   or where the initial registerDhobiForPayoutInternal call inside createProvider
//  *   failed silently. Admin can always retry via POST /api/payout/register/:providerId.
//  *
//  *   createProvider — registerDhobiForPayoutInternal is now a thin wrapper around
//  *   payoutController._registerOnRazorpayX to avoid duplicating Axios logic.
//  */

// const ServiceProvider = require("../models/serviceProviderModel");
// const Order = require("../models/orderModel");
// const User = require("../models/userModel");
// const Notification = require("../models/notificationModel");
// const DhobiWallet = require("../models/dhobiWalletModel");
// const bcrypt = require("bcryptjs");
// const { isValidObjectId } = require("mongoose");
// const { getIO } = require("../socket");
// const { sendOtpEmail } = require("../utils/emailService");

// // ─── Constants ────────────────────────────────────────────────────────────────

// const BCRYPT_ROUNDS = 12;

// const VALID_ORDER_STATUSES = [
//   "pending",
//   "accepted",
//   "in_progress",
//   "ready",
//   "delivered",
//   "cancelled",
// ];

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// const validateId = (id, res, label = "Resource") => {
//   if (!isValidObjectId(id)) {
//     res.status(400).json({ success: false, message: `Invalid ${label} ID` });
//     return false;
//   }
//   return true;
// };

// const findProviderByIdentifier = async (identifier, options = {}) => {
//   if (!isValidObjectId(identifier)) return null;

//   let q = ServiceProvider.findById(identifier);
//   if (options.populateUser) {
//     q = q.populate(
//       "userId",
//       options.populateUserFields || "name email mobile isVerified createdAt"
//     );
//   }

//   if (options.lean) {
//     const provider = await q.lean();
//     if (provider) return provider;

//     let fallback = ServiceProvider.findOne({ userId: identifier });
//     if (options.populateUser) {
//       fallback = fallback.populate(
//         "userId",
//         options.populateUserFields || "name email mobile isVerified createdAt"
//       );
//     }
//     return fallback.lean();
//   }

//   const provider = await q;
//   if (provider) return provider;

//   let fallback = ServiceProvider.findOne({ userId: identifier });
//   if (options.populateUser) {
//     fallback = fallback.populate(
//       "userId",
//       options.populateUserFields || "name email mobile isVerified createdAt"
//     );
//   }
//   return fallback;
// };

// const notifyUser = async (userId, message, type = "general") => {
//   try {
//     const notification = await Notification.create({ userId, message, type });
//     getIO().to(userId.toString()).emit("receive-notification", notification);
//   } catch (err) {
//     console.error("[notifyUser]", err.message);
//   }
// };

// const notifyAdmins = async (message) => {
//   try {
//     const admins = await User.find({ role: "admin" }).select("_id").lean();
//     if (!admins.length) return;

//     const notifications = admins.map((a) => ({
//       userId: a._id,
//       type: "general",
//       message,
//     }));

//     const saved = await Notification.insertMany(notifications, { ordered: false });
//     const io = getIO();
//     for (const n of saved) io.to(n.userId.toString()).emit("receive-notification", n);
//   } catch (err) {
//     console.error("[notifyAdmins]", err.message);
//   }
// };

// /**
//  * Non-blocking RazorpayX registration — wraps payoutController._registerOnRazorpayX.
//  * Kept as a named function so createProvider can call it in a fire-and-forget pattern.
//  * Logs on failure; the admin retry endpoint is POST /api/payout/register/:providerId.
//  */
// const registerDhobiForPayoutInternal = (providerId, details) => {
//   // Lazy-require to avoid circular dependency at module load time
//   const { _registerOnRazorpayX } = require("./payoutController");
//   return _registerOnRazorpayX(providerId, details).catch((err) =>
//     console.error(
//       `[registerDhobiForPayoutInternal] RazorpayX registration failed for ${providerId}:`,
//       err?.response?.data?.error?.description ?? err.message,
//       "— Retry via POST /api/payout/register/:providerId"
//     )
//   );
// };

// // ─── Controllers ──────────────────────────────────────────────────────────────

// /**
//  * POST /api/provider/create
//  * Admin creates a dhobi: User → ServiceProvider → RazorpayX registration (async).
//  * @access Private (Admin)
//  */
// exports.createProvider = async (req, res) => {
//   const {
//     name, email, mobile, password,
//     location, serviceAreas, profilePicture,
//     owner, address, commissionRate, services,
//     bankDetails,
//   } = req.body;

//   // ── Required field validation ────────────────────────────────────────────
//   const missing = [];
//   if (!name?.trim()) missing.push("name");
//   if (!email?.trim()) missing.push("email");
//   const mobileStr = String(mobile || "").trim();
//   if (!mobileStr) missing.push("mobile");
//   if (!password) missing.push("password");
//   if (!owner?.trim()) missing.push("owner");
//   if (!address?.trim()) missing.push("address");
//   if (commissionRate === undefined) missing.push("commissionRate");

//   if (!bankDetails || typeof bankDetails !== "object") {
//     return res.status(400).json({ success: false, message: "Bank details are required" });
//   }

//   const { accountHolderName, accountNumber, ifscCode, bankName, branchName, accountType } =
//     bankDetails;

//   if (!accountHolderName?.trim()) missing.push("bankDetails.accountHolderName");
//   if (!accountNumber?.trim()) missing.push("bankDetails.accountNumber");
//   if (!ifscCode?.trim()) missing.push("bankDetails.ifscCode");
//   if (!bankName?.trim()) missing.push("bankDetails.bankName");
//   if (!branchName?.trim()) missing.push("bankDetails.branchName");

//   if (missing.length) {
//     return res.status(400).json({
//       success: false,
//       message: `Missing required fields: ${missing.join(", ")}`,
//     });
//   }

//   const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
//   if (!ifscRegex.test(ifscCode.trim().toUpperCase())) {
//     return res.status(400).json({
//       success: false,
//       message: "Invalid IFSC code format (e.g. SBIN0001234)",
//     });
//   }

//   if (accountType && !["savings", "current"].includes(accountType)) {
//     return res.status(400).json({
//       success: false,
//       message: "Account type must be either 'savings' or 'current'",
//     });
//   }

//   if (password.length < 8) {
//     return res.status(400).json({
//       success: false,
//       message: "Password must be at least 8 characters",
//     });
//   }

//   if (
//     !location?.coordinates ||
//     !Array.isArray(location.coordinates) ||
//     location.coordinates.length !== 2
//   ) {
//     return res.status(400).json({
//       success: false,
//       message: "location.coordinates must be [longitude, latitude]",
//     });
//   }

//   const [lng, lat] = location.coordinates;
//   if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
//     return res.status(400).json({
//       success: false,
//       message: "Coordinates out of range. Longitude: -180–180, Latitude: -90–90",
//     });
//   }

//   const [emailTaken, mobileTaken] = await Promise.all([
//     User.findOne({ email: email.trim().toLowerCase() }).lean(),
//     User.findOne({ mobile: mobileStr }).lean(),
//   ]);

//   if (emailTaken) {
//     return res.status(409).json({ success: false, message: "Email is already registered" });
//   }
//   if (mobileTaken) {
//     return res.status(409).json({ success: false, message: "Mobile number is already registered" });
//   }

//   let savedUser = null;

//   try {
//     // Step 1 — User
//     const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

//     savedUser = await User.create({
//       name: name.trim(),
//       email: email.trim().toLowerCase(),
//       mobile: mobileStr,
//       password: hashedPassword,
//       location: { type: "Point", coordinates: [lng, lat] },
//       serviceAreas: serviceAreas?.trim(),
//       profilePicture: profilePicture?.trim(),
//       role: "dhobi",
//       isVerified: false,
//     });

//     // Step 2 — ServiceProvider
//     const provider = await ServiceProvider.create({
//       userId: savedUser._id,
//       name: name.trim(),
//       owner: owner.trim(),
//       email: email.trim().toLowerCase(),
//       mobile: mobileStr,
//       address: address.trim(),
//       serviceAreas: serviceAreas?.trim() || "",
//       location: { type: "Point", coordinates: [lng, lat] },
//       commissionRate: Number(commissionRate),
//       services: Array.isArray(services) ? services : [],
//       bankDetails: {
//         accountHolderName: accountHolderName.trim(),
//         accountNumber: accountNumber.trim(),
//         ifscCode: ifscCode.trim().toUpperCase(),
//         bankName: bankName.trim(),
//         branchName: branchName.trim(),
//         accountType: accountType || "savings",
//         isVerified: false,
//       },
//       isApproved: "pending",
//       isActive: false,
//     });

//     // Step 3 — RazorpayX registration (fire-and-forget)
//     registerDhobiForPayoutInternal(provider._id, {
//       owner: owner.trim(),
//       email: email.trim().toLowerCase(),
//       mobile: mobileStr,
//       name: name.trim(),
//       dhobiId: provider.dhobiId,
//       accountHolderName: accountHolderName.trim(),
//       accountNumber: accountNumber.trim(),
//       ifscCode: ifscCode.trim().toUpperCase(),
//     });

//     // Step 4 — Notifications (fire-and-forget)
//     notifyAdmins(
//       `New dhobi registered: ${name.trim()} (${email.trim().toLowerCase()}) — awaiting approval`
//     );

//     sendOtpEmail(email.trim().toLowerCase(), null, "welcome").catch((err) =>
//       console.error("[createProvider] Welcome email failed:", err.message)
//     );

//     return res.status(201).json({
//       success: true,
//       message:
//         "Service provider created successfully and is pending approval. " +
//         "RazorpayX registration is processing in the background.",
//       data: {
//         user: { _id: savedUser._id, name: savedUser.name, email: savedUser.email },
//         provider: { _id: provider._id, dhobiId: provider.dhobiId, isApproved: provider.isApproved },
//       },
//     });
//   } catch (err) {
//     console.error("[createProvider]", err);

//     // Rollback: delete user if provider creation failed
//     if (savedUser?._id) {
//       await User.deleteOne({ _id: savedUser._id }).catch((e) =>
//         console.error("[createProvider] Rollback failed:", e.message)
//       );
//     }

//     if (err.name === "ValidationError") {
//       const messages = Object.values(err.errors).map((e) => e.message);
//       return res.status(400).json({ success: false, message: messages.join(". ") });
//     }

//     if (err.code === 11000) {
//       const field = Object.keys(err.keyPattern || {})[0] || "field";
//       return res.status(409).json({
//         success: false,
//         message: `An account with this ${field} already exists`,
//       });
//     }

//     if (err.name === "MongooseError" && err.message.includes("buffering timed out")) {
//       return res.status(503).json({
//         success: false,
//         message: "Database connection timeout. Please try again.",
//       });
//     }

//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * GET /api/provider
//  * Public listing of approved, active providers.
//  * @query page, limit, search, lat, lng, radius (km)
//  * @access Public
//  */
// exports.getProviders = async (req, res) => {
//   try {
//     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
//     const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
//     const skip = (page - 1) * limit;

//     const filter = {};

//     if (req.query.search?.trim()) {
//       const rx = { $regex: req.query.search.trim(), $options: "i" };
//       filter.$or = [{ name: rx }, { serviceAreas: rx }, { address: rx }];
//     }

//     const { lat, lng, radius } = req.query;
//     if (lat && lng) {
//       const radiusKm = parseFloat(radius) || 10;
//       filter.location = {
//         $nearSphere: {
//           $geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
//           $maxDistance: radiusKm * 1000,
//         },
//       };
//       const countFilter = { isApproved: "approved", isActive: true };
//       const [providers, total] = await Promise.all([
//         ServiceProvider.find(filter).skip(skip).limit(limit).lean(),
//         ServiceProvider.countDocuments(countFilter),
//       ]);
//       return res.status(200).json({
//         success: true,
//         data: providers,
//         pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
//       });
//     }

//     const [providers, total] = await Promise.all([
//       ServiceProvider.find(filter)
//         .sort({ rating: -1, createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//       ServiceProvider.countDocuments(filter),
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: providers,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: page * limit < total,
//         hasPrevPage: page > 1,
//       },
//     });
//   } catch (err) {
//     console.error("[getProviders]", err);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * GET /api/provider/profile/:id
//  * @access Private
//  */
// exports.getProfile = async (req, res) => {
//   if (!validateId(req.params.id, res, "Provider")) return;

//   try {
//     const provider = await findProviderByIdentifier(req.params.id, {
//       lean: true,
//       populateUser: true,
//     });

//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider not found" });
//     }

//     return res.status(200).json({ success: true, data: provider });
//   } catch (err) {
//     console.error("[getProfile]", err);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * PATCH /api/provider/profile/:id
//  *
//  * When isApproved flips to "approved" and the provider has no razorpayFundAccountId,
//  * automatically triggers RazorpayX registration in the background.
//  *
//  * @access Private (own provider or admin)
//  */
// exports.updateProfile = async (req, res) => {
//   if (!validateId(req.params.id, res, "Provider")) return;

//   try {
//     const provider = await findProviderByIdentifier(req.params.id);
//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider not found" });
//     }

//     const isOwner = provider.userId.toString() === req.user.id.toString();
//     const isAdmin = req.user.role === "admin";

//     if (!isOwner && !isAdmin) {
//       return res.status(403).json({
//         success: false,
//         message: "You are not authorized to update this profile",
//       });
//     }

//     const ADMIN_ONLY_FIELDS = new Set(["commissionRate", "isApproved", "isActive", "earnings"]);
//     const IMMUTABLE_FIELDS = new Set(["userId", "dhobiId", "rating", "ordersCompleted"]);

//     const updates = {};
//     for (const key of Object.keys(req.body)) {
//       if (IMMUTABLE_FIELDS.has(key)) continue;
//       if (ADMIN_ONLY_FIELDS.has(key) && !isAdmin) continue;
//       updates[key] = req.body[key];
//     }

//     if (Object.keys(updates).length === 0) {
//       return res.status(400).json({ success: false, message: "No valid fields provided for update" });
//     }

//     if (updates.email) {
//       updates.email = updates.email.trim().toLowerCase();
//     }

//     if (updates.commissionRate !== undefined) {
//       const rate = Number(updates.commissionRate);
//       if (isNaN(rate) || rate < 0 || rate > 100) {
//         return res.status(400).json({
//           success: false,
//           message: "Commission rate must be a number between 0 and 100",
//         });
//       }
//       updates.commissionRate = rate;
//     }

//     if (updates.location) {
//       if (
//         updates.location.type !== "Point" ||
//         !Array.isArray(updates.location.coordinates) ||
//         updates.location.coordinates.length !== 2
//       ) {
//         return res.status(400).json({
//           success: false,
//           message: "location.coordinates must be [longitude, latitude]",
//         });
//       }
//       const [pLng, pLat] = updates.location.coordinates;
//       if (pLng < -180 || pLng > 180 || pLat < -90 || pLat > 90) {
//         return res.status(400).json({
//           success: false,
//           message: "Coordinates out of range",
//         });
//       }
//     }

//     // ── Sync User.isVerified when approval / active status changes ────────────
//     if (updates.isApproved !== undefined || updates.isActive !== undefined) {
//       const approvedStatus = updates.isApproved ?? provider.isApproved;
//       const activeStatus = updates.isActive ?? provider.isActive;
//       const shouldBeVerified = approvedStatus === "approved" && activeStatus === true;

//       const user = await User.findByIdAndUpdate(
//         provider.userId,
//         { isVerified: shouldBeVerified },
//         { new: true }
//       );

//       if (!user) {
//         console.warn(`[updateProfile] No linked user found for provider ${provider._id}`);
//       }

//       // ── Auto-register on RazorpayX if newly approved and not yet registered ──
//       //
//       // This covers dhobis who were created before the payout system was in place
//       // or whose original registerDhobiForPayoutInternal call (in createProvider)
//       // failed silently. The re-fetch is needed because `provider` is a Mongoose
//       // document (not lean) so bankDetails.accountNumber is accessible.
//       if (
//         updates.isApproved === "approved" &&
//         provider.isApproved !== "approved" && // was not already approved
//         !provider.razorpayFundAccountId       // not yet registered
//       ) {
//         // Fetch full provider with the select:false accountNumber field
//         const fullProvider = await ServiceProvider.findById(provider._id)
//           .select("+bankDetails.accountNumber")
//           .lean();

//         if (fullProvider?.bankDetails?.accountNumber) {
//           registerDhobiForPayoutInternal(provider._id, {
//             owner: fullProvider.owner,
//             email: fullProvider.email,
//             mobile: fullProvider.mobile,
//             name: fullProvider.name,
//             dhobiId: fullProvider.dhobiId,
//             accountHolderName: fullProvider.bankDetails.accountHolderName,
//             accountNumber: fullProvider.bankDetails.accountNumber,
//             ifscCode: fullProvider.bankDetails.ifscCode,
//           });

//           console.info(
//             `[updateProfile] Triggered RazorpayX registration for newly approved provider ${provider._id}`
//           );
//         } else {
//           console.warn(
//             `[updateProfile] Cannot auto-register provider ${provider._id}: ` +
//             `bank details incomplete — use POST /api/payout/register/:providerId`
//           );
//         }
//       }
//     }

//     const updated = await ServiceProvider.findByIdAndUpdate(
//       provider._id,
//       { $set: updates },
//       { new: true, runValidators: true }
//     ).lean();

//     return res.status(200).json({
//       success: true,
//       message: "Profile updated successfully",
//       data: updated,
//     });
//   } catch (err) {
//     console.error("[updateProfile]", err);

//     if (err.name === "ValidationError") {
//       const messages = Object.values(err.errors).map((e) => e.message);
//       return res.status(400).json({ success: false, message: messages.join(". ") });
//     }

//     if (err.code === 11000) {
//       const field = Object.keys(err.keyPattern || {})[0] || "field";
//       return res.status(409).json({ success: false, message: `This ${field} is already in use` });
//     }

//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * PATCH /api/provider/toggle-active/:id
//  * @access Private (Admin or own provider)
//  */
// exports.toggleActive = async (req, res) => {
//   if (!validateId(req.params.id, res, "Provider")) return;

//   try {
//     const provider = await findProviderByIdentifier(req.params.id);
//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider not found" });
//     }

//     if (provider.isApproved !== "approved") {
//       return res.status(400).json({
//         success: false,
//         message: "Provider must be approved before toggling active status",
//       });
//     }

//     const isOwner = provider.userId.toString() === req.user.id.toString();
//     const isAdmin = req.user.role === "admin";

//     if (!isOwner && !isAdmin) {
//       return res.status(403).json({
//         success: false,
//         message: "Not authorized to change this provider's status",
//       });
//     }

//     provider.isActive = !provider.isActive;
//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: `Provider is now ${provider.isActive ? "active" : "inactive"}`,
//       data: { _id: provider._id, isActive: provider.isActive },
//     });
//   } catch (err) {
//     console.error("[toggleActive]", err);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * GET /api/provider/orders
//  * @access Private (Provider)
//  */
// exports.getOrders = async (req, res) => {
//   try {
//     const provider = await ServiceProvider.findOne({ userId: req.user.id })
//       .select("_id")
//       .lean();
//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider profile not found" });
//     }

//     const page = Math.max(1, parseInt(req.query.page, 10) || 1);
//     const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
//     const skip = (page - 1) * limit;

//     const filter = { providerId: provider._id };
//     if (req.query.status && VALID_ORDER_STATUSES.includes(req.query.status)) {
//       filter.status = req.query.status;
//     }

//     const [orders, total] = await Promise.all([
//       Order.find(filter)
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .populate("userId", "name email mobile")
//         .lean(),
//       Order.countDocuments(filter),
//     ]);

//     return res.status(200).json({
//       success: true,
//       data: orders,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//         hasNextPage: page * limit < total,
//         hasPrevPage: page > 1,
//       },
//     });
//   } catch (err) {
//     console.error("[getOrders]", err);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * PATCH /api/provider/order/:id/status
//  * @access Private (Provider who owns the order)
//  */
// exports.updateOrderStatus = async (req, res) => {
//   if (!validateId(req.params.id, res, "Order")) return;

//   try {
//     const { status } = req.body;

//     if (!status) {
//       return res.status(400).json({ success: false, message: "Status is required" });
//     }

//     if (!VALID_ORDER_STATUSES.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: `Invalid status. Must be one of: ${VALID_ORDER_STATUSES.join(", ")}`,
//       });
//     }

//     const provider = await ServiceProvider.findOne({ userId: req.user.id })
//       .select("_id")
//       .lean();
//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider profile not found" });
//     }

//     const order = await Order.findOne({ _id: req.params.id, providerId: provider._id });
//     if (!order) {
//       return res.status(404).json({
//         success: false,
//         message: "Order not found or does not belong to you",
//       });
//     }

//     const STATUS_RANK = {
//       pending: 0, accepted: 1, in_progress: 2,
//       ready: 3, delivered: 4, cancelled: 5,
//     };

//     const currentRank = STATUS_RANK[order.status] ?? -1;
//     const newRank = STATUS_RANK[status] ?? -1;

//     if (status !== "cancelled" && newRank < currentRank) {
//       return res.status(400).json({
//         success: false,
//         message: `Cannot move order from "${order.status}" back to "${status}"`,
//       });
//     }

//     if (order.status === "delivered" || order.status === "cancelled") {
//       return res.status(400).json({
//         success: false,
//         message: `Order is already ${order.status} and cannot be updated`,
//       });
//     }

//     order.status = status;
//     await order.save();

//     notifyUser(
//       order.userId,
//       `Your order #${order.orderId} status has been updated to: ${status}`,
//       "order"
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Order status updated",
//       data: { _id: order._id, orderId: order.orderId, status: order.status },
//     });
//   } catch (err) {
//     console.error("[updateOrderStatus]", err);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * GET /api/provider/analytics
//  * @access Private (Provider)
//  */
// exports.getAnalytics = async (req, res) => {
//   try {
//     const provider = await ServiceProvider.findOne({ userId: req.user.id })
//       .select("_id earnings rating ordersCompleted")
//       .lean();

//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider profile not found" });
//     }

//     const [orderStats, monthlyRevenue] = await Promise.all([
//       Order.aggregate([
//         { $match: { providerId: provider._id } },
//         { $group: { _id: "$status", count: { $sum: 1 } } },
//       ]),
//       Order.aggregate([
//         {
//           $match: {
//             providerId: provider._id,
//             paymentStatus: "completed",
//             createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
//           },
//         },
//         {
//           $group: {
//             _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
//             revenue: { $sum: "$amount" },
//             orders: { $sum: 1 },
//           },
//         },
//         { $sort: { "_id.year": 1, "_id.month": 1 } },
//       ]),
//     ]);

//     const statusBreakdown = orderStats.reduce((acc, { _id, count }) => {
//       acc[_id] = count;
//       return acc;
//     }, {});

//     return res.status(200).json({
//       success: true,
//       data: {
//         totalOrders: Object.values(statusBreakdown).reduce((a, b) => a + b, 0),
//         completedOrders: statusBreakdown.delivered ?? 0,
//         cancelledOrders: statusBreakdown.cancelled ?? 0,
//         totalEarnings: provider.earnings ?? 0,
//         rating: provider.rating ?? 0,
//         statusBreakdown,
//         monthlyRevenue,
//       },
//     });
//   } catch (err) {
//     console.error("[getAnalytics]", err);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// // ─── Services Sub-resource ────────────────────────────────────────────────────

// /**
//  * POST /api/provider/profile/:id/services
//  * @access Private (own provider or admin)
//  */
// exports.addService = async (req, res) => {
//   if (!validateId(req.params.id, res, "Provider")) return;

//   try {
//     const { name, price } = req.body;

//     if (!name?.trim()) {
//       return res.status(400).json({ success: false, message: "Service name is required" });
//     }

//     const parsedPrice = Number(price);
//     if (isNaN(parsedPrice) || parsedPrice < 0) {
//       return res.status(400).json({ success: false, message: "Price must be a non-negative number" });
//     }

//     const provider = await findProviderByIdentifier(req.params.id);
//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider not found" });
//     }

//     const isOwner = provider.userId.toString() === req.user.id.toString();
//     if (!isOwner && req.user.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Not authorized" });
//     }

//     const duplicate = provider.services.some(
//       (s) => s.name.toLowerCase() === name.trim().toLowerCase()
//     );
//     if (duplicate) {
//       return res.status(409).json({
//         success: false,
//         message: `A service named "${name.trim()}" already exists`,
//       });
//     }

//     provider.services.push({ name: name.trim(), price: parsedPrice });
//     await provider.save();

//     const added = provider.services[provider.services.length - 1];

//     return res.status(201).json({
//       success: true,
//       message: "Service added successfully",
//       data: { service: added, services: provider.services },
//     });
//   } catch (err) {
//     console.error("[addService]", err);
//     if (err.name === "ValidationError") {
//       const messages = Object.values(err.errors).map((e) => e.message);
//       return res.status(400).json({ success: false, message: messages.join(". ") });
//     }
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * PATCH /api/provider/profile/:id/services/:serviceId
//  * @access Private (own provider or admin)
//  */
// exports.updateService = async (req, res) => {
//   if (!validateId(req.params.id, res, "Provider")) return;
//   if (!validateId(req.params.serviceId, res, "Service")) return;

//   try {
//     const { name, price } = req.body;

//     if (name === undefined && price === undefined) {
//       return res.status(400).json({ success: false, message: "Provide name or price to update" });
//     }

//     const provider = await findProviderByIdentifier(req.params.id);
//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider not found" });
//     }

//     const isOwner = provider.userId.toString() === req.user.id.toString();
//     if (!isOwner && req.user.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Not authorized" });
//     }

//     const service = provider.services.id(req.params.serviceId);
//     if (!service) {
//       return res.status(404).json({ success: false, message: "Service not found" });
//     }

//     if (name !== undefined) {
//       if (!name.trim()) {
//         return res.status(400).json({ success: false, message: "Service name cannot be empty" });
//       }
//       const duplicate = provider.services.some(
//         (s) =>
//           s._id.toString() !== req.params.serviceId &&
//           s.name.toLowerCase() === name.trim().toLowerCase()
//       );
//       if (duplicate) {
//         return res.status(409).json({
//           success: false,
//           message: `Another service named "${name.trim()}" already exists`,
//         });
//       }
//       service.name = name.trim();
//     }

//     if (price !== undefined) {
//       const parsedPrice = Number(price);
//       if (isNaN(parsedPrice) || parsedPrice < 0) {
//         return res.status(400).json({ success: false, message: "Price must be a non-negative number" });
//       }
//       service.price = parsedPrice;
//     }

//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: "Service updated successfully",
//       data: { service, services: provider.services },
//     });
//   } catch (err) {
//     console.error("[updateService]", err);
//     if (err.name === "ValidationError") {
//       const messages = Object.values(err.errors).map((e) => e.message);
//       return res.status(400).json({ success: false, message: messages.join(". ") });
//     }
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// /**
//  * DELETE /api/provider/profile/:id/services/:serviceId
//  * @access Private (own provider or admin)
//  */
// exports.deleteService = async (req, res) => {
//   if (!validateId(req.params.id, res, "Provider")) return;
//   if (!validateId(req.params.serviceId, res, "Service")) return;

//   try {
//     const provider = await findProviderByIdentifier(req.params.id);
//     if (!provider) {
//       return res.status(404).json({ success: false, message: "Provider not found" });
//     }

//     const isOwner = provider.userId.toString() === req.user.id.toString();
//     if (!isOwner && req.user.role !== "admin") {
//       return res.status(403).json({ success: false, message: "Not authorized" });
//     }

//     const service = provider.services.id(req.params.serviceId);
//     if (!service) {
//       return res.status(404).json({ success: false, message: "Service not found" });
//     }

//     service.deleteOne();
//     await provider.save();

//     return res.status(200).json({
//       success: true,
//       message: "Service deleted successfully",
//       data: { services: provider.services },
//     });
//   } catch (err) {
//     console.error("[deleteService]", err);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };


"use strict";

const ServiceProvider = require("../models/serviceProviderModel");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const Notification = require("../models/notificationModel");
const DhobiWallet = require("../models/dhobiWalletModel");
const bcrypt = require("bcryptjs");
const { isValidObjectId } = require("mongoose");
const { sendOtpEmail } = require("../utils/emailService");

// ─── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const validateId = (id, res, label = "Resource") => {
  if (!isValidObjectId(id)) {
    res.status(400).json({ success: false, message: `Invalid ${label} ID` });
    return false;
  }
  return true;
};

const findProviderByIdentifier = async (identifier, options = {}) => {
  if (!isValidObjectId(identifier)) return null;

  let q = ServiceProvider.findById(identifier);
  if (options.includeAccountNumber) {
    q = q.select("+bankDetails.accountNumber");
  }
  if (options.populateUser) {
    q = q.populate(
      "userId",
      options.populateUserFields || "name email mobile isVerified createdAt"
    );
  }

  if (options.lean) {
    const provider = await q.lean();
    if (provider) return provider;
    let fallback = ServiceProvider.findOne({ userId: identifier });
    if (options.includeAccountNumber) {
      fallback = fallback.select("+bankDetails.accountNumber");
    }
    if (options.populateUser) {
      fallback = fallback.populate(
        "userId",
        options.populateUserFields || "name email mobile isVerified createdAt"
      );
    }
    return fallback.lean();
  }

  const provider = await q;
  if (provider) return provider;

  let fallback = ServiceProvider.findOne({ userId: identifier });
  if (options.includeAccountNumber) {
    fallback = fallback.select("+bankDetails.accountNumber");
  }
  if (options.populateUser) {
    fallback = fallback.populate(
      "userId",
      options.populateUserFields || "name email mobile isVerified createdAt"
    );
  }
  return fallback;
};

// Lazy-require getIO inside helpers to avoid circular dependency at module load
const notifyUser = async (userId, message, type = "general") => {
  try {
    const notification = await Notification.create({ userId, message, type });
    const { getIO } = require("../socket");
    getIO().to(userId.toString()).emit("receive-notification", notification);
  } catch (err) {
    console.error("[notifyUser]", err.message);
  }
};

const notifyAdmins = async (message) => {
  try {
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    if (!admins.length) return;

    const notifications = admins.map((a) => ({
      userId: a._id,
      type: "general",
      message,
    }));

    const saved = await Notification.insertMany(notifications, { ordered: false });
    const { getIO } = require("../socket");
    const io = getIO();
    for (const n of saved) io.to(n.userId.toString()).emit("receive-notification", n);
  } catch (err) {
    console.error("[notifyAdmins]", err.message);
  }
};

const registerDhobiForPayoutInternal = (providerId, details) => {
  const { _registerOnRazorpayX } = require("./payoutController");
  return _registerOnRazorpayX(providerId, details).catch((err) =>
    console.error(
      `[registerDhobiForPayoutInternal] RazorpayX registration failed for ${providerId}:`,
      err?.response?.data?.error?.description ?? err.message,
      "— Retry via POST /api/payout/register/:providerId"
    )
  );
};

// ─── Sanitize mobile — normalize to +91XXXXXXXXXX for Indian numbers ──────────
const normalizeMobile = (mobile) => {
  const digits = String(mobile).replace(/\D/g, "");
  // If 10 digits, assume Indian — prepend +91
  if (digits.length === 10) return `+91${digits}`;
  // If already has country code (11+ digits starting with 91)
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  // Already has + prefix passed as string
  if (String(mobile).startsWith("+")) return String(mobile).trim();
  return `+${digits}`;
};

// ─── createProvider ───────────────────────────────────────────────────────────

exports.createProvider = async (req, res) => {
  const {
    name, email, password,
    location, serviceAreas, profilePicture,
    owner, address, commissionRate, services,
    bankDetails, pricing,
  } = req.body;

  // Normalize mobile — accept with or without +91
  const mobile = normalizeMobile(req.body.mobile);

  // ── Validation ──────────────────────────────────────────────────────────
  const missing = [];
  if (!name?.trim()) missing.push("name");
  if (!email?.trim()) missing.push("email");
  if (!mobile) missing.push("mobile");
  if (!password) missing.push("password");
  if (!owner?.trim()) missing.push("owner");
  if (!address?.trim()) missing.push("address");
  if (commissionRate === undefined || commissionRate === null) missing.push("commissionRate");

  if (!bankDetails || typeof bankDetails !== "object") {
    return res.status(400).json({ success: false, message: "Bank details are required" });
  }

  const {
    accountHolderName, accountNumber, ifscCode,
    bankName, branchName, accountType,
  } = bankDetails;

  if (!accountHolderName?.trim()) missing.push("bankDetails.accountHolderName");
  if (!accountNumber?.trim()) missing.push("bankDetails.accountNumber");
  if (!ifscCode?.trim()) missing.push("bankDetails.ifscCode");
  if (!bankName?.trim()) missing.push("bankDetails.bankName");
  if (!branchName?.trim()) missing.push("bankDetails.branchName");

  if (missing.length) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missing.join(", ")}`,
    });
  }

  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(ifscCode.trim().toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "Invalid IFSC code format (e.g. HDFC0001234)",
    });
  }

  if (accountType && !["savings", "current"].includes(accountType)) {
    return res.status(400).json({
      success: false,
      message: "Account type must be either 'savings' or 'current'",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  if (
    !location?.coordinates ||
    !Array.isArray(location.coordinates) ||
    location.coordinates.length !== 2
  ) {
    return res.status(400).json({
      success: false,
      message: "location.coordinates must be [longitude, latitude]",
    });
  }

  const [lng, lat] = location.coordinates;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return res.status(400).json({
      success: false,
      message: "Coordinates out of range. Longitude: -180–180, Latitude: -90–90",
    });
  }

  const [emailTaken, mobileTaken] = await Promise.all([
    User.findOne({ email: email.trim().toLowerCase() }).lean(),
    User.findOne({ mobile }).lean(),
  ]);

  if (emailTaken) {
    return res.status(409).json({ success: false, message: "Email is already registered" });
  }
  if (mobileTaken) {
    return res.status(409).json({ success: false, message: "Mobile number is already registered" });
  }

  // ── Normalize services — price must be Number ────────────────────────────
  const normalizedServices = Array.isArray(services)
    ? services
      .filter((s) => s?.name)
      .map((s) => ({
        name: String(s.name).trim(),
        price: Number(s.price) || 0,
      }))
    : [];

  let savedUser = null;

  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Step 1 — User
    savedUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile,
      password: hashedPassword,
      location: { type: "Point", coordinates: [lng, lat] },
      serviceAreas: serviceAreas?.trim(),
      profilePicture: profilePicture?.trim(),
      role: "dhobi",
      isVerified: false,
    });

    // Step 2 — ServiceProvider
    const provider = await ServiceProvider.create({
      userId: savedUser._id,
      name: name.trim(),
      owner: owner.trim(),
      email: email.trim().toLowerCase(),
      mobile,
      address: address.trim(),
      serviceAreas: serviceAreas?.trim() || "",
      location: { type: "Point", coordinates: [lng, lat] },
      commissionRate: Number(commissionRate),
      services: normalizedServices,
      pricing: pricing || {},
      bankDetails: {
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        accountType: accountType || "savings",
        isVerified: false,
      },
      isApproved: "pending",
      isActive: false,
    });

    // Step 3 — RazorpayX (fire-and-forget)
    registerDhobiForPayoutInternal(provider._id, {
      owner: owner.trim(),
      email: email.trim().toLowerCase(),
      mobile,
      name: name.trim(),
      dhobiId: provider.dhobiId,
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
    });

    // Step 4 — Notifications (fire-and-forget)
    notifyAdmins(
      `New dhobi registered: ${name.trim()} (${email.trim().toLowerCase()}) — awaiting approval`
    );

    sendOtpEmail(email.trim().toLowerCase(), null, "welcome").catch((err) =>
      console.error("[createProvider] Welcome email failed:", err.message)
    );

    return res.status(201).json({
      success: true,
      message:
        "Service provider created successfully and is pending approval. " +
        "RazorpayX registration is processing in the background.",
      data: {
        user: {
          _id: savedUser._id,
          name: savedUser.name,
          email: savedUser.email,
        },
        provider: {
          _id: provider._id,
          dhobiId: provider.dhobiId,
          isApproved: provider.isApproved,
        },
      },
    });
  } catch (err) {
    console.error("[createProvider]", err);

    // Rollback: delete user if provider creation failed
    if (savedUser?._id) {
      await User.deleteOne({ _id: savedUser._id }).catch((e) =>
        console.error("[createProvider] Rollback failed:", e.message)
      );
    }

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists`,
      });
    }

    if (err.name === "MongooseError" && err.message.includes("buffering timed out")) {
      return res.status(503).json({
        success: false,
        message: "Database connection timeout. Please try again.",
      });
    }

    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── getProviders ─────────────────────────────────────────────────────────────

exports.getProviders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, lat, lng, radius = 10000 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = { isApproved: "approved", isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { serviceAreas: { $regex: search, $options: "i" } },
      ];
    }

    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: Number(radius),
        },
      };
    }

    const [providers, total] = await Promise.all([
      ServiceProvider.find(filter)
        .select("-bankDetails.accountNumber")
        .populate("userId", "name email mobile isVerified")
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ServiceProvider.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: providers,
    });
  } catch (err) {
    console.error("[getProviders]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// exports.getProviders = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, lat, lng, radius = 10000, all } = req.query;
//     const skip = (Number(page) - 1) * Number(limit);

//     // Build filter — no isApproved/isActive restriction by default
//     const filter = {};

//     // Optional: filter by status if passed as query param
//     // e.g. ?status=approved  or  ?status=pending
//     if (req.query.status) {
//       filter.isApproved = req.query.status;
//     }

//     if (req.query.isActive !== undefined) {
//       filter.isActive = req.query.isActive === "true";
//     }

//     if (search) {
//       filter.$or = [
//         { name:         { $regex: search, $options: "i" } },
//         { serviceAreas: { $regex: search, $options: "i" } },
//         { email:        { $regex: search, $options: "i" } },
//         { owner:        { $regex: search, $options: "i" } },
//       ];
//     }

//     if (lat && lng) {
//       filter.location = {
//         $near: {
//           $geometry:    { type: "Point", coordinates: [Number(lng), Number(lat)] },
//           $maxDistance: Number(radius),
//         },
//       };
//     }

//     const [providers, total] = await Promise.all([
//       ServiceProvider.find(filter)
//         .select("-bankDetails.accountNumber") 
//         .populate("userId", "name email mobile isVerified")
//         .sort({ createdAt: -1 })             
//         .skip(skip)
//         .limit(Number(limit))
//         .lean(),
//       ServiceProvider.countDocuments(filter),
//     ]);

//     return res.status(200).json({
//       success: true,
//       total,
//       page:  Number(page),
//       pages: Math.ceil(total / Number(limit)),
//       data:  providers,
//     });
//   } catch (err) {
//     console.error("[getProviders]", err);
//     return res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

// ─── getProfile ───────────────────────────────────────────────────────────────

exports.getProfile = async (req, res) => {
  try {
    if (!validateId(req.params.id, res, "Provider")) return;

    let provider = await findProviderByIdentifier(req.params.id, {
      populateUser: true,
      lean: true,
    });

    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = provider.userId?._id?.toString() === req.user?.id?.toString();

    if (isAdmin || isOwner) {
      provider = await findProviderByIdentifier(req.params.id, {
        populateUser: true,
        includeAccountNumber: true,
        lean: true,
      });
    }

    return res.status(200).json({ success: true, data: provider });
  } catch (err) {
    console.error("[getProfile]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── updateProfile ────────────────────────────────────────────────────────────

exports.updateProfile = async (req, res) => {
  try {
    if (!validateId(req.params.id, res, "Provider")) return;

    const provider = await findProviderByIdentifier(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = provider.userId?.toString() === req.user?.id?.toString();
    const prevStatus = provider.isApproved;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const allowedFields = [
      "name", "owner", "email", "mobile", "address", "serviceAreas", "location",
      "commissionRate", "services", "pricing", "images",
      "bankDetails",
    ];
    const adminOnlyFields = ["isApproved", "isActive", "commissionRate", "bankDetails"];

    for (const [key, val] of Object.entries(req.body)) {
      if (adminOnlyFields.includes(key) && !isAdmin) continue;
      if (allowedFields.includes(key) || isAdmin) {
        provider[key] = val;
      }
    }

    // Normalize services prices if updated
    if (req.body.services) {
      provider.services = Array.isArray(req.body.services)
        ? req.body.services.map((s) => ({
          name: String(s.name).trim(),
          price: Number(s.price) || 0,
        }))
        : provider.services;
    }

    if (req.body.email !== undefined) {
      provider.email = String(req.body.email).trim().toLowerCase();
    }

    if (req.body.mobile !== undefined) {
      provider.mobile = String(req.body.mobile).trim();
    }

    if (req.body.bankDetails) {
      provider.bankDetails = {
        ...provider.bankDetails?.toObject?.(),
        ...req.body.bankDetails,
      };
    }

    const userUpdates = {};
    if (req.body.owner !== undefined) userUpdates.name = String(req.body.owner).trim();
    if (req.body.email !== undefined) userUpdates.email = String(req.body.email).trim().toLowerCase();
    if (req.body.mobile !== undefined) userUpdates.mobile = String(req.body.mobile).trim();
    if (req.body.serviceAreas !== undefined) {
      userUpdates.serviceAreas = String(req.body.serviceAreas).trim();
    }
    if (req.body.location !== undefined) {
      userUpdates.location = req.body.location;
    }

    if (Object.keys(userUpdates).length > 0) {
      const linkedUser = await User.findById(provider.userId);

      if (!linkedUser) {
        return res.status(404).json({ success: false, message: "Linked user not found" });
      }

      Object.assign(linkedUser, userUpdates);
      await linkedUser.save();
    }

    await provider.save();

    // Auto-register on RazorpayX when admin approves and not yet registered
    if (
      isAdmin &&
      req.body.isApproved === "approved" &&
      prevStatus !== "approved" &&
      !provider.razorpayFundAccountId
    ) {
      registerDhobiForPayoutInternal(provider._id, {
        owner: provider.owner,
        email: provider.email,
        mobile: provider.mobile,
        name: provider.name,
        dhobiId: provider.dhobiId,
        accountHolderName: provider.bankDetails?.accountHolderName,
        accountNumber: provider.bankDetails?.accountNumber,
        ifscCode: provider.bankDetails?.ifscCode,
      });
    }

    // Notify provider when approval status changes
    if (isAdmin && req.body.isApproved && req.body.isApproved !== prevStatus) {
      const msg =
        req.body.isApproved === "approved"
          ? "Your dhobi account has been approved! You can now start accepting orders."
          : req.body.isApproved === "rejected"
            ? "Your dhobi account application has been rejected. Please contact support."
            : `Your account status has been updated to: ${req.body.isApproved}`;

      notifyUser(provider.userId, msg, "general");
    }

    return res.status(200).json({ success: true, data: provider });
  } catch (err) {
    console.error("[updateProfile]", err);
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── toggleActive ─────────────────────────────────────────────────────────────

exports.toggleActive = async (req, res) => {
  try {
    if (!validateId(req.params.id, res, "Provider")) return;

    const provider = await findProviderByIdentifier(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = provider.userId?.toString() === req.user?.id?.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (provider.isApproved !== "approved" && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Account must be approved before going active",
      });
    }

    provider.isActive = !provider.isActive;
    await provider.save();

    return res.status(200).json({
      success: true,
      message: `Provider is now ${provider.isActive ? "active" : "inactive"}`,
      data: { isActive: provider.isActive },
    });
  } catch (err) {
    console.error("[toggleActive]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── getOrders ────────────────────────────────────────────────────────────────

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const provider = await findProviderByIdentifier(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const filter = { providerId: provider._id };
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("userId", "name email mobile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: orders,
    });
  } catch (err) {
    console.error("[getOrders]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── updateOrderStatus ────────────────────────────────────────────────────────

exports.updateOrderStatus = async (req, res) => {
  try {
    if (!validateId(req.params.id, res, "Order")) return;

    const { status } = req.body;
    const validStatuses = ["pending", "accepted", "in_progress", "ready", "delivered", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const provider = await findProviderByIdentifier(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const order = await Order.findOne({ _id: req.params.id, providerId: provider._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.status = status;
    await order.save();

    // Notify customer
    notifyUser(
      order.userId,
      `Your order #${order.orderId} status has been updated to: ${status}`,
      "order"
    );

    return res.status(200).json({ success: true, data: order });
  } catch (err) {
    console.error("[updateOrderStatus]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── getAnalytics ─────────────────────────────────────────────────────────────

exports.getAnalytics = async (req, res) => {
  try {
    const provider = await findProviderByIdentifier(req.user.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const [totalOrders, completedOrders, cancelledOrders, revenueData] =
      await Promise.all([
        Order.countDocuments({ providerId: provider._id }),
        Order.countDocuments({ providerId: provider._id, status: "delivered" }),
        Order.countDocuments({ providerId: provider._id, status: "cancelled" }),
        Order.aggregate([
          { $match: { providerId: provider._id, status: "delivered" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue: revenueData[0]?.total || 0,
        rating: provider.rating,
        ordersCompleted: provider.ordersCompleted,
      },
    });
  } catch (err) {
    console.error("[getAnalytics]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── addService ───────────────────────────────────────────────────────────────

exports.addService = async (req, res) => {
  try {
    if (!validateId(req.params.id, res, "Provider")) return;

    const { name, price } = req.body;
    if (!name?.trim() || price === undefined) {
      return res.status(400).json({ success: false, message: "name and price are required" });
    }

    const provider = await findProviderByIdentifier(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = provider.userId?.toString() === req.user?.id?.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    provider.services.push({ name: name.trim(), price: Number(price) });
    await provider.save();

    return res.status(201).json({ success: true, data: provider.services });
  } catch (err) {
    console.error("[addService]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── updateService ────────────────────────────────────────────────────────────

exports.updateService = async (req, res) => {
  try {
    if (!validateId(req.params.id, res, "Provider")) return;
    if (!validateId(req.params.serviceId, res, "Service")) return;

    const provider = await findProviderByIdentifier(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = provider.userId?.toString() === req.user?.id?.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const service = provider.services.id(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    if (req.body.name !== undefined) service.name = String(req.body.name).trim();
    if (req.body.price !== undefined) service.price = Number(req.body.price);

    await provider.save();
    return res.status(200).json({ success: true, data: provider.services });
  } catch (err) {
    console.error("[updateService]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── deleteService ────────────────────────────────────────────────────────────

exports.deleteService = async (req, res) => {
  try {
    if (!validateId(req.params.id, res, "Provider")) return;
    if (!validateId(req.params.serviceId, res, "Service")) return;

    const provider = await findProviderByIdentifier(req.params.id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = provider.userId?.toString() === req.user?.id?.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    provider.services = provider.services.filter(
      (s) => s._id.toString() !== req.params.serviceId
    );
    await provider.save();

    return res.status(200).json({ success: true, data: provider.services });
  } catch (err) {
    console.error("[deleteService]", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
