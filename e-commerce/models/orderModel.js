const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: false,
      default: null,
    },
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    fullName: {
      type: String,
      required: [true, "Full Name is required"],
      trim: true,
      minlength: 3,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },
    streetAddress: {
      type: String,
      required: [true, "Street Address is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State/County is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\d{11}$/, "Phone number must be 11 digits"],
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      match: [/\S+@\S+\.\S+/, "Please provide a valid email address"],
    },
    shippingAddress: {
      type: Boolean,
      default: false,
    },
    orderNotes: {
      type: String,
      trim: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.ObjectId,
          ref: 'Product',
          required: true,
        },
        sizeName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        totalPrice: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
