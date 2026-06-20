const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId, // Fixed: was String — should be ObjectId ref
      ref: "Order",
      required: [true, "Order reference is required"],
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Fixed: was String
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId, // Fixed: was String
      ref: "ServiceProvider",
      required: [true, "Provider reference is required"],
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      validate: {
        validator: Number.isInteger,
        message: "Rating must be a whole number",
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
    },
    isVisible: {
      type: Boolean,
      default: true, // Admin can hide abusive reviews without deleting them
    },
  },
  { timestamps: true }
);

// One review per order per user — prevents duplicate reviews
ReviewSchema.index({ orderId: 1, userId: 1 }, { unique: true });

// Efficient provider rating recalculation
ReviewSchema.index({ providerId: 1, isVisible: 1, createdAt: -1 });

/**
 * After saving a review, recalculate the provider's average rating.
 * Uses an aggregation pipeline for accuracy across concurrent writes.
 */
ReviewSchema.post("save", async function () {
  try {
    const ServiceProvider = mongoose.model("ServiceProvider");

    const result = await mongoose.model("Review").aggregate([
      { $match: { providerId: this.providerId, isVisible: true } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (result.length > 0) {
      await ServiceProvider.findByIdAndUpdate(this.providerId, {
        rating: Math.round(result[0].avgRating * 10) / 10,
      });
    }
  } catch (err) {
    console.error("[Review post-save] Failed to update provider rating:", err.message);
  }
});

const ReviewModel = mongoose.model("Review", ReviewSchema);
module.exports = ReviewModel;