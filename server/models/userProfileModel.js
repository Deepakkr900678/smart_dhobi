const mongoose = require("mongoose");

const AddressSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: [true, "Address label is required"],
            trim: true,
            maxlength: [50, "Label cannot exceed 50 characters"],
        },
        address: {
            type: String,
            required: [true, "Address is required"],
            trim: true,
            maxlength: [300, "Address cannot exceed 300 characters"],
        },
        coordinates: {
            lat: {
                type: Number,
                required: [true, "Latitude is required"],
                min: [-90, "Latitude must be between -90 and 90"],
                max: [90, "Latitude must be between -90 and 90"],
            },
            lng: {
                type: Number,
                required: [true, "Longitude is required"],
                min: [-180, "Longitude must be between -180 and 180"],
                max: [180, "Longitude must be between -180 and 180"],
            },
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { _id: false }
);

const UserProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User reference is required"],
            unique: true,
            index: true,
        },
        preferences: {
            type: String,
            default: "",
            trim: true,
            maxlength: [500, "Preferences cannot exceed 500 characters"],
        },
        addresses: {
            type: [AddressSchema],
            default: [],
            validate: {
                validator: (arr) => arr.length <= 10,
                message: "Cannot store more than 10 addresses",
            },
        },
    },
    { timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", UserProfileSchema);
module.exports = UserProfile;