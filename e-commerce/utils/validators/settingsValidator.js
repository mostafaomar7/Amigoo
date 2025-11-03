const { body, param, query } = require('express-validator');
const { validationResult } = require('express-validator');

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// Create/Update settings validation
const createSettingsValidator = [
  body('site_name')
    .notEmpty()
    .withMessage('Site name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Site name must be between 3 and 100 characters'),

  body('contact_email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('contact_phone')
    .matches(/^\d{10,15}$/)
    .withMessage('Phone number must be between 10 and 15 digits'),

  body('site_logo')
    .optional()
    .isURL()
    .withMessage('Site logo must be a valid URL'),

  body('site_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Site description cannot exceed 500 characters'),

  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be exactly 3 characters')
    .isUppercase()
    .withMessage('Currency must be uppercase'),

  body('currency_symbol')
    .optional()
    .isLength({ min: 1, max: 5 })
    .withMessage('Currency symbol must be between 1 and 5 characters'),

  body('shipping_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a non-negative number'),

  body('free_shipping_threshold')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Free shipping threshold must be a non-negative number'),

  body('social_media.facebook')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be valid'),

  body('social_media.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter URL must be valid'),

  body('social_media.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be valid'),

  body('social_media.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid'),

  handleValidationErrors,
];

// Update settings validation
const updateSettingsValidator = [
  body('site_name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Site name must be between 3 and 100 characters'),

  body('contact_email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('contact_phone')
    .optional()
    .matches(/^\d{10,15}$/)
    .withMessage('Phone number must be between 10 and 15 digits'),

  body('site_logo')
    .optional()
    .isURL()
    .withMessage('Site logo must be a valid URL'),

  body('site_description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Site description cannot exceed 500 characters'),

  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be exactly 3 characters')
    .isUppercase()
    .withMessage('Currency must be uppercase'),

  body('currency_symbol')
    .optional()
    .isLength({ min: 1, max: 5 })
    .withMessage('Currency symbol must be between 1 and 5 characters'),

  body('shipping_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a non-negative number'),

  body('free_shipping_threshold')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Free shipping threshold must be a non-negative number'),

  body('social_media.facebook')
    .optional()
    .isURL()
    .withMessage('Facebook URL must be valid'),

  body('social_media.twitter')
    .optional()
    .isURL()
    .withMessage('Twitter URL must be valid'),

  body('social_media.instagram')
    .optional()
    .isURL()
    .withMessage('Instagram URL must be valid'),

  body('social_media.linkedin')
    .optional()
    .isURL()
    .withMessage('LinkedIn URL must be valid'),

  handleValidationErrors,
];

// Get setting by key validation
const getSettingByKeyValidator = [
  param('key')
    .notEmpty()
    .withMessage('Setting key is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Setting key must be between 1 and 50 characters'),

  handleValidationErrors,
];

// Update setting by key validation
const updateSettingByKeyValidator = [
  param('key')
    .notEmpty()
    .withMessage('Setting key is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Setting key must be between 1 and 50 characters'),

  body('value')
    .notEmpty()
    .withMessage('Setting value is required'),

  handleValidationErrors,
];

// Calculate shipping validation
const calculateShippingValidator = [
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a non-negative number'),

  handleValidationErrors,
];

module.exports = {
  createSettingsValidator,
  updateSettingsValidator,
  getSettingByKeyValidator,
  updateSettingByKeyValidator,
  calculateShippingValidator,
};
