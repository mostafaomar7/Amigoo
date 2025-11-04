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

  // Filter out unwanted fields from req.body
  const allowedFields = ['contact_email', 'contact_phone', 'shipping_cost', 'address', 'social_media', 'isActive'];
  const updateData = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = req.body[key];
    }
  });

  // Fields to remove from existing documents
  const fieldsToRemove = ['site_name', 'site_logo', 'site_description', 'currency', 'currency_symbol', 'free_shipping_threshold'];
  const unsetData = {};
  fieldsToRemove.forEach(field => {
    unsetData[field] = '';
  });

  if (!settings) {
    // Create new settings if none exist
    settings = await Settings.create(updateData);
  } else {
    // First, remove old fields without validation
    if (Object.keys(unsetData).length > 0) {
      await Settings.findByIdAndUpdate(
        settings._id,
        { $unset: unsetData },
        { runValidators: false }
      );
    }

    // Then update with new data (validators will run)
    settings = await Settings.findByIdAndUpdate(
      settings._id,
      { $set: updateData },
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

  // Filter out unwanted fields from req.body
  const allowedFields = ['contact_email', 'contact_phone', 'shipping_cost', 'address', 'social_media', 'isActive'];
  const createData = {};
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      createData[key] = req.body[key];
    }
  });

  const settings = await Settings.create(createData);

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

  const settings = await Settings.findOne({ isActive: true });

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
    contact_email: 'admin@example.com',
    contact_phone: '12345678901',
    shipping_cost: 0,
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
      shipping_cost: settings.shipping_cost || 0,
    },
  });
});

// Calculate shipping cost
exports.calculateShipping = asyncHandler(async (req, res) => {
  const settings = await Settings.getSettings();

  const shippingCost = settings.shipping_cost || 0;

  res.status(200).json({
    success: true,
    message: 'Shipping cost calculated successfully',
    data: {
      shipping_cost: shippingCost,
    },
  });
});
