const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
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
    localStorge: [
      {
        category: { type: Object, required: true },
        colors: { type: Array, default: [] },
        createdAt: { type: Date, default: Date.now },
        description: { type: String, required: true },
        imageCover: { type: String, required: true },
        images: { type: [String], required: true },
        originalQuantity: { type: Number, required: true },
        price: { type: Number, required: true },
        priceAfterDiscount: { type: Number, required: true },
        quantity: { type: Number, required: true },
        size: { type: [String], default: [] },
        slug: { type: String, required: true },
        sold: { type: Number, default: 0 },
        title: { type: String, required: true },
        updatedAt: { type: Date, default: Date.now },
        selectedSize : { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
