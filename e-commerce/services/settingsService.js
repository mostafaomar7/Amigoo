const asyncHandler = require('express-async-handler');
const Settings = require('../models/settingsModel');

// Get current settings
exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();

  res.status(200).json({
    success: true,
    message: 'Settings retrieved successfully',
    data: settings,
  });
});

// Update settings (admin only)
exports.updateSettings = asyncHandler(async (req, res) => {
  let settings = await Settings.findOne({ isActive: true });

  if (!settings) {
    // Create new settings if none exist
    settings = await Settings.create(req.body);
  } else {
    // Update existing settings
    settings = await Settings.findByIdAndUpdate(
      settings._id,
      req.body,
      { new: true, runValidators: true }
    );
  }

  res.status(200).json({
    success: true,
    message: 'Settings updated successfully',
    data: settings,
  });
});

// Create new settings (admin only)
exports.createSettings = asyncHandler(async (req, res) => {
  // Deactivate any existing settings
  await Settings.updateMany({}, { isActive: false });

  const settings = await Settings.create(req.body);

  res.status(201).json({
    success: true,
    message: 'Settings created successfully',
    data: settings,
  });
});

// Get specific setting by key
exports.getSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const settings = await Settings.getSettings();

  if (!settings[key]) {
    return res.status(404).json({
      success: false,
      message: `Setting '${key}' not found`,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Setting retrieved successfully',
    data: {
      key,
      value: settings[key],
    },
  });
});

// Update specific setting by key
exports.updateSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;

  let settings = await Settings.findOne({ isActive: true });

  if (!settings) {
    return res.status(404).json({
      success: false,
      message: 'No settings found. Please create settings first.',
    });
  }

  // Update the specific field
  settings[key] = value;
  await settings.save();

  res.status(200).json({
    success: true,
    message: `Setting '${key}' updated successfully`,
    data: {
      key,
      value: settings[key],
    },
  });
});

// Reset settings to default
exports.resetSettings = asyncHandler(async (req, res) => {
  // Deactivate current settings
  await Settings.updateMany({}, { isActive: false });

  // Create default settings
  const defaultSettings = {
    site_name: 'E-commerce Store',
    contact_email: 'admin@example.com',
    contact_phone: '1234567890',
    currency: 'USD',
    currency_symbol: '$',
    shipping_cost: 0,
    free_shipping_threshold: 100,
  };

  const settings = await Settings.create(defaultSettings);

  res.status(200).json({
    success: true,
    message: 'Settings reset to default successfully',
    data: settings,
  });
});

// Get shipping information
exports.getShippingInfo = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();

  res.status(200).json({
    success: true,
    message: 'Shipping information retrieved successfully',
    data: {
      shipping_cost: settings.shipping_cost,
      free_shipping_threshold: settings.free_shipping_threshold,
      currency: settings.currency,
      currency_symbol: settings.currency_symbol,
    },
  });
});

// Calculate shipping cost
exports.calculateShipping = asyncHandler(async (req, res) => {
  const { totalAmount } = req.body;
  const settings = await Settings.getSettings();

  let shippingCost = 0;
  if (totalAmount < settings.free_shipping_threshold) {
    shippingCost = settings.shipping_cost;
  }

  res.status(200).json({
    success: true,
    message: 'Shipping cost calculated successfully',
    data: {
      shipping_cost: shippingCost,
      free_shipping_threshold: settings.free_shipping_threshold,
      is_free_shipping: totalAmount >= settings.free_shipping_threshold,
    },
  });
});
