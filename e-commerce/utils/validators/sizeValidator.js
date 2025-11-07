const { body, param, query } = require('express-validator');
const { validatorMiddleware } = require('../../middlewares/validatorMiddleware');

// Create size validation
const createSizeValidator = [
  body('sizeName')
    .notEmpty()
    .withMessage('Size name is required')
    .isLength({ min: 1, max: 10 })
    .withMessage('Size name must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Size name must contain only letters and numbers'),

  validatorMiddleware,
];

// Update size validation
const updateSizeValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid size ID format'),

  body('sizeName')
    .optional()
    .isLength({ min: 1, max: 10 })
    .withMessage('Size name must be between 1 and 10 characters')
    .matches(/^[A-Za-z0-9]+$/)
    .withMessage('Size name must contain only letters and numbers'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  validatorMiddleware,
];

// Get size by ID validation
const getSizeValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid size ID format'),

  validatorMiddleware,
];

// Get sizes by product validation
const getSizesByProductValidator = [
  param('productId')
    .isMongoId()
    .withMessage('Invalid product ID format'),

  validatorMiddleware,
];

// Delete size validation
const deleteSizeValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid size ID format'),

  validatorMiddleware,
];

// Get all sizes validation (pagination)
const getAllSizesValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  validatorMiddleware,
];

module.exports = {
  createSizeValidator,
  updateSizeValidator,
  getSizeValidator,
  getSizesByProductValidator,
  deleteSizeValidator,
  getAllSizesValidator,
};
