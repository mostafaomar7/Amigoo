const express = require('express');
const {
  createSizeValidator,
  updateSizeValidator,
  getSizeValidator,
  getSizesByProductValidator,
  deleteSizeValidator,
  getAllSizesValidator,
} = require('../utils/validators/sizeValidator');
const { authenticate, authorize } = require('../middlewares/authMW');

const {
  getSizesByProduct,
  getAllSizes,
  createSize,
  updateSize,
  deleteSize,
  getSizeById,
  getAvailableSizes,
  getMasterSizes,
} = require('../services/sizeService');

const router = express.Router();

// Public routes
router.route('/product/:productId/available').get(getSizesByProductValidator, getAvailableSizes);
router.route('/product/:productId').get(getSizesByProductValidator, getSizesByProduct);

// Protected routes (Admin only)
router.use(authenticate, authorize(['Admin']));

router.route('/master').get(getMasterSizes); // Get all master sizes for dropdown
router.route('/').get(getAllSizesValidator, getAllSizes);
router.route('/').post(createSizeValidator, createSize);
router.route('/:id').get(getSizeValidator, getSizeById);
router.route('/:id').put(updateSizeValidator, updateSize);
router.route('/:id').delete(deleteSizeValidator, deleteSize);

module.exports = router;
