const express = require('express');
const {
  createSettingsValidator,
  updateSettingsValidator,
  getSettingByKeyValidator,
  updateSettingByKeyValidator,
  calculateShippingValidator,
} = require('../utils/validators/settingsValidator');
const { authenticate, authorize } = require('../middlewares/authMW');

const {
  getSettings,
  updateSettings,
  createSettings,
  getSettingByKey,
  updateSettingByKey,
  resetSettings,
  getShippingInfo,
  calculateShipping,
} = require('../services/settingsService');

const router = express.Router();

// Public routes
router.route('/shipping/info').get(getShippingInfo);
router.route('/shipping/calculate').post(calculateShippingValidator, calculateShipping);
router.route('/').get(getSettings);
router.route('/:key').get(getSettingByKeyValidator, getSettingByKey);

// Protected routes (Admin only)
router.use(authenticate, authorize(['Admin']));

router.route('/').post(createSettingsValidator, createSettings);
router.route('/').put(updateSettingsValidator, updateSettings);
router.route('/:key').put(updateSettingByKeyValidator, updateSettingByKey);
router.route('/reset').post(resetSettings);

module.exports = router;
