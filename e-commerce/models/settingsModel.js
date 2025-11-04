const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    contact_email: {
      type: String,
      required: [true, 'Contact email is required'],
      match: [/\S+@\S+\.\S+/, 'Please provide a valid email address'],
    },
    contact_phone: {
      type: String,
      required: [true, 'Contact phone is required'],
      match: [/^\d{11}$/, 'Phone number must be exactly 11 digits'],
    },
    shipping_cost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [500, 'Address cannot exceed 500 characters'],
    },
    social_media: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      tiktok: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne({ isActive: true });
  if (!settings) {
    settings = await this.create({
      contact_email: 'admin@example.com',
      contact_phone: '12345678901',
    });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
