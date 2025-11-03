const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    site_name: {
      type: String,
      required: [true, 'Site name is required'],
      trim: true,
      maxlength: [100, 'Site name cannot exceed 100 characters'],
    },
    site_logo: {
      type: String,
      trim: true,
    },
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
    site_description: {
      type: String,
      maxlength: [500, 'Site description cannot exceed 500 characters'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    currency_symbol: {
      type: String,
      default: '$',
    },
    shipping_cost: {
      type: Number,
      default: 0,
      min: [0, 'Shipping cost cannot be negative'],
    },
    free_shipping_threshold: {
      type: Number,
      default: 100,
      min: [0, 'Free shipping threshold cannot be negative'],
    },
    social_media: {
      facebook: { type: String, trim: true },
      twitter: { type: String, trim: true },
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      messenger: { type: String, trim: true },
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
      site_name: 'E-commerce Store',
      contact_email: 'admin@example.com',
      contact_phone: '1234567890',
    });
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
