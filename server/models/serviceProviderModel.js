const mongoose = require("mongoose");

// ── Bank Details Sub-Schema ────────────────────────────────────────────────
const BankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      required: [true, "Account holder name is required"],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      trim: true,
      select: false, // 🔒 Hidden by default in queries for security
    },
    ifscCode: {
      type: String,
      required: [true, "IFSC code is required"],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Please provide a valid IFSC code"],
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      trim: true,
    },
    branchName: {
      type: String,
      required: [true, "Branch name is required"],
      trim: true,
    },
    accountType: {
      type: String,
      required: [true, "Account type is required"],
      enum: {
        values: ["savings", "current"],
        message: "Account type must be either savings or current",
      },
      default: "savings",
    },
    isVerified: {
      type: Boolean,
      default: false, // Admin can mark bank details as verified
    },
  },
  { _id: false } // No separate _id for subdocument
);

const ServiceProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },

    dhobiId: {
      type: Number,
      unique: true,
    },

    name: { type: String, required: [true, "Business name is required"], trim: true },
    owner: { type: String, required: [true, "Owner name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    mobile: {
      type: String,
      required: [true, "Mobile is required"],
      trim: true,
      match: [/^\+?[1-9]\d{9,14}$/, "Please provide a valid mobile number"],
    },
    address: { type: String, required: [true, "Address is required"], trim: true },
    serviceAreas: { type: String, required: [true, "Service areas are required"], trim: true },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords) =>
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 &&
            coords[1] >= -90 &&
            coords[1] <= 90,
          message: "Coordinates must be [longitude, latitude] with valid ranges",
        },
      },
    },

    commissionRate: {
      type: Number,
      required: [true, "Commission rate is required"],
      min: [0, "Commission rate cannot be negative"],
      max: [100, "Commission rate cannot exceed 100"],
    },

    services: [
      {
        name: { type: String, required: [true, "Service name is required"], trim: true },
        price: { type: Number, required: [true, "Service price is required"], min: 0 },
      },
    ],

    // ── Bank Details ───────────────────────────────────────────────────────
    bankDetails: {
      type: BankDetailsSchema,
      required: [true, "Bank details are required"],
    },

    // ── RazorpayX Payout Fields ────────────────────────────────────────────
    // Populated automatically when admin approves the dhobi via
    // registerDhobiForPayout(). null until that step completes.
    razorpayContactId: {
      type: String,
      trim: true,
      default: null,   // cont_xxxxx — RazorpayX contact
    },
    razorpayFundAccountId: {
      type: String,
      trim: true,
      default: null,   // fa_xxxxx — linked to bank account above
    },
    isFundAccountVerified: {
      type: Boolean,
      default: false,  // true once RazorpayX confirms the fund account
    },
    // ──────────────────────────────────────────────────────────────────────

    joinDate: { type: Date, default: Date.now },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    ordersCompleted: { type: Number, default: 0, min: 0 },

    pricing: {
      type: Map,
      of: Number,
    },

    images: [{ type: String, trim: true }],

    isApproved: {
      type: String,
      default: "pending",
      enum: {
        values: ["pending", "approved", "rejected"],
        message: "Status must be one of: pending, approved, rejected",
      },
    },

    isActive: { type: Boolean, default: false },

    earnings: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

ServiceProviderSchema.index({ location: "2dsphere" });
ServiceProviderSchema.index({ userId: 1 });
ServiceProviderSchema.index({ isApproved: 1, isActive: 1 });
ServiceProviderSchema.index({ serviceAreas: 1 });

ServiceProviderSchema.index({ razorpayFundAccountId: 1 }, { sparse: true });
 
// ── Auto-increment dhobiId ─────────────────────────────────────────────────

ServiceProviderSchema.pre("validate", async function () {
  if (!this.isNew || this.dhobiId) return;

  const last = await this.constructor
    .findOne()
    .sort({ dhobiId: -1 })
    .select("dhobiId")
    .lean();

  this.dhobiId = last?.dhobiId ? last.dhobiId + 1 : 1;
});

const ServiceProvider = mongoose.model("ServiceProvider", ServiceProviderSchema);
module.exports = ServiceProvider;