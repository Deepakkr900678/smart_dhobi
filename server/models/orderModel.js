const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const OrderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            unique: true,
            // Auto-generate a prefixed unique ID before saving
        },

        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ServiceProvider",
            required: [true, "Provider is required"],
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            index: true,
        },

        services: {
            type: [
                {
                    name: {
                        type: String,
                        required: [true, "Service name is required"],
                        trim: true,
                    },
                    quantity: {
                        type: Number,
                        required: [true, "Quantity is required"],
                        min: [1, "Quantity must be at least 1"],
                    },
                    price: {
                        type: Number,
                        required: [true, "Price is required"],
                        min: [0, "Price cannot be negative"],
                    },
                    customerPrice: {
                        type: Number,
                        min: [0, "Customer price cannot be negative"],
                    },
                    dealerPrice: {
                        type: Number,
                        min: [0, "Dealer price cannot be negative"],
                    },
                },
            ],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: "At least one service is required",
            },
        },

        pickupAddress: {
            type: String,
            required: [true, "Pickup address is required"],
            trim: true,
        },

        deliveryAddress: {
            type: String,
            required: [true, "Delivery address is required"],
            trim: true,
        },

        // Optional geospatial fields — only set if current location used
        pickupLocation: {
            type: {
                type: String,
                enum: ["Point"],
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                validate: {
                    validator: (coords) =>
                        !coords ||
                        coords.length === 0 ||
                        (coords.length === 2 &&
                            coords[0] >= -180 && coords[0] <= 180 &&
                            coords[1] >= -90 && coords[1] <= 90),
                    message: "pickupLocation coordinates must be [longitude, latitude]",
                },
            },
        },

        deliveryLocation: {
            type: {
                type: String,
                enum: ["Point"],
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                validate: {
                    validator: (coords) =>
                        !coords ||
                        coords.length === 0 ||
                        (coords.length === 2 &&
                            coords[0] >= -180 && coords[0] <= 180 &&
                            coords[1] >= -90 && coords[1] <= 90),
                    message: "deliveryLocation coordinates must be [longitude, latitude]",
                },
            },
        },

        status: {
            type: String,
            enum: {
                values: ["pending", "accepted", "in_progress", "ready", "delivered", "cancelled"],
                message: "Invalid order status",
            },
            default: "pending",
            index: true,
        },

        pickupTime: {
            type: Date, // Changed from String to Date for proper sorting/comparison
        },

        deliveryTime: {
            type: Date, // Changed from String to Date
        },

        // ── Payment ───────────────────────────────────────────────────────────────

        amount: {
            type: Number, // Fixed: was String — amount should always be numeric
            required: [true, "Order amount is required"],
            min: [0, "Amount cannot be negative"],
        },

        paymentStatus: {
            type: String,
            enum: {
                values: ["pending", "completed", "failed", "refunded"],
                message: "Invalid payment status",
            },
            default: "pending",
            index: true,
        },

        // Razorpay Integration
        razorpayOrderId: {
            type: String,
            sparse: true, // Index only non-null values
            index: true,
        },
        razorpayPaymentId: {
            type: String,
            sparse: true,
        },
        razorpaySignature: {
            type: String,
            select: false, // Never expose signature in queries
        },
        paidAt: {
            type: Date,
        },
        failureReason: {
            type: String,
            trim: true,
            maxlength: [500, "Failure reason cannot exceed 500 characters"],
        },

        // ── Refund ────────────────────────────────────────────────────────────────

        refundId: {
            type: String,
            sparse: true,
        },
        refundAmount: {
            type: Number,
            min: [0, "Refund amount cannot be negative"],
        },
        refundStatus: {
            type: String,
            enum: {
                values: ["processed", "pending", "failed"],
                message: "Invalid refund status",
            },
        },
        refundedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(_doc, ret) {
                // Never expose Razorpay signature in API responses
                delete ret.razorpaySignature;
                return ret;
            },
        },
    }
);

// ── Indexes ───────────────────────────────────────────────────────────────────

OrderSchema.index({ pickupLocation: "2dsphere" }, { sparse: true });
OrderSchema.index({ deliveryLocation: "2dsphere" }, { sparse: true });
OrderSchema.index({ userId: 1, createdAt: -1 });      // user order history
OrderSchema.index({ providerId: 1, status: 1 });       // dhobi dashboard
OrderSchema.index({ status: 1, createdAt: -1 });       // admin dashboard
OrderSchema.index({ razorpayOrderId: 1 }, { sparse: true }); // payment lookup

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Auto-generate human-readable orderId before first save */
OrderSchema.pre("validate", function () {
    if (!this.isNew || this.orderId) return;
    const ts = Date.now().toString(36).toUpperCase();
    const rand = randomUUID().split("-")[0].toUpperCase();
    this.orderId = `ORD-${ts}-${rand}`;
});

const OrderModel = mongoose.model("Order", OrderSchema);
module.exports = OrderModel;
