const { body, param } = require('express-validator');
const { validatorMiddleware } = require('../../middlewares/validatorMiddleware');

// Create/Update settings validation
const createSettingsValidator = [
  body('contact_email')
    .notEmpty()
    .withMessage('Contact email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('contact_phone')
    .notEmpty()
    .withMessage('Contact phone is required')
    .matches(/^\d{11}$/)
    .withMessage('Phone number must be exactly 11 digits'),

  body('shipping_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a non-negative number'),

  body('address')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('social_media.facebook')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return true; // Skip validation if empty
      }
      return /^https?:\/\/.+/.test(value.trim());
    })
    .withMessage('Facebook URL must be valid'),

  body('social_media.instagram')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return true; // Skip validation if empty
      }
      return /^https?:\/\/.+/.test(value.trim());
    })
    .withMessage('Instagram URL must be valid'),

  body('social_media.tiktok')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return true; // Skip validation if empty
      }
      return /^https?:\/\/.+/.test(value.trim());
    })
    .withMessage('TikTok URL must be valid'),

  body('social_media.whatsapp')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return true; // Skip validation if empty
      }
      return /^\d{11}$/.test(value.trim());
    })
    .withMessage('WhatsApp must be exactly 11 digits'),

  validatorMiddleware,
];

// Update settings validation
const updateSettingsValidator = [
  body('contact_email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('contact_phone')
    .optional()
    .matches(/^\d{11}$/)
    .withMessage('Phone number must be exactly 11 digits'),

  body('shipping_cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Shipping cost must be a non-negative number'),

  body('address')
    .optional({ checkFalsy: true })
    .isLength({ max: 500 })
    .withMessage('Address cannot exceed 500 characters'),

  body('social_media.facebook')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return true; // Skip validation if empty
      }
      return /^https?:\/\/.+/.test(value.trim());
    })
    .withMessage('Facebook URL must be valid'),

  body('social_media.instagram')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return true; // Skip validation if empty
      }
      return /^https?:\/\/.+/.test(value.trim());
    })
    .withMessage('Instagram URL must be valid'),

  body('social_media.tiktok')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return true; // Skip validation if empty
      }
      return /^https?:\/\/.+/.test(value.trim());
    })
    .withMessage('TikTok URL must be valid'),

  body('social_media.whatsapp')
    .optional({ checkFalsy: true })
    .custom((value) => {
      if (!value || typeof value !== 'string' || value.trim().length === 0) {
        return true; // Skip validation if empty
      }
      return /^\d{11}$/.test(value.trim());
    })
    .withMessage('WhatsApp must be exactly 11 digits'),

  validatorMiddleware,
];

// Get setting by key validation
const getSettingByKeyValidator = [
  param('key')
    .notEmpty()
    .withMessage('Setting key is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Setting key must be between 1 and 50 characters'),

  validatorMiddleware,
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

  validatorMiddleware,
];

// Calculate shipping validation
const calculateShippingValidator = [
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a non-negative number'),

  validatorMiddleware,
];

module.exports = {
  createSettingsValidator,
  updateSettingsValidator,
  getSettingByKeyValidator,
  updateSettingByKeyValidator,
  calculateShippingValidator,
};
