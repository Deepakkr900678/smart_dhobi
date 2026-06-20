const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    type: {
      type: String,
      enum: {
        values: ["order", "service", "general"],
        message: "Type must be one of: order, service, general",
      },
      required: [true, "Notification type is required"],
    },
  },
  {
    timestamps: true, // Use createdAt from timestamps instead of a manual field
  }
);

// Compound index for common query: unread notifications for a user
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

// TTL: auto-delete notifications older than 90 days
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

module.exports = mongoose.model("Notification", NotificationSchema);