const slugify = require('slugify');
const { check, body } = require('express-validator');
const {validatorMiddleware} = require('../../middlewares/validatorMiddleware');
const Category = require('../../models/categoryModel');

exports.createProductValidator = [
  (req, res, next) => {
    // Parse quantity if it's a JSON string
    if (req.body.quantity && typeof req.body.quantity === 'string') {
      try {
        req.body.quantity = JSON.parse(req.body.quantity);
      } catch (e) {
        // If parsing fails, leave it as is to let validation handle it
      }
    }
    next(); // انتقل إلى الفالديشن التالي
  },
  check('title')
    .isLength({ min: 3 })
    .withMessage('must be at least 3 chars')
    .notEmpty()
    .withMessage('Product required')
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('description')
    .notEmpty()
    .withMessage('Product description is required')
    .isLength({ max: 2000 })
    .withMessage('Too long description'),
  check('sold')
    .optional()
    .isNumeric()
    .withMessage('Product quantity must be a number'),
  check('price')
    .notEmpty()
    .withMessage('Product price is required')
    .isNumeric()
    .withMessage('Product price must be a number')
    .isLength({ max: 32 })
    .withMessage('To long price'),
  check('priceAfterDiscount')
    .optional()
    .isNumeric()
    .withMessage('Product priceAfterDiscount must be a number')
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.price <= value) {
        throw new Error('priceAfterDiscount must be smaller than price');
      }
      return true;
    }),

  check('colors')
    .optional()
    .isArray()
    .withMessage('availableColors should be array of string'),
  check('imageCover').notEmpty().withMessage('Product imageCover is required'),
  check('images')
    .optional()
    .isArray()
    .withMessage('images should be array of string'),
  check('category')
    .notEmpty()
    .withMessage('Product must be belong to a category')
    .isMongoId()
    .withMessage('Invalid ID formate')
    .custom((categoryId) =>
      Category.findById(categoryId).then((category) => {
        if (!category) {
          return Promise.reject(
            new Error(`No category for this id: ${categoryId}`)
          );
        }
      })
    ),
  check('quantity')
    .optional()
    .isArray()
    .withMessage('Quantity must be an array')
    .custom((quantity) => {
      if (quantity.length === 0) {
        return true; // Empty array is allowed
      }
      for (const item of quantity) {
        if (!item.size) {
          throw new Error('Each quantity item must have a size');
        }
        if (item.no === undefined || item.no === null) {
          throw new Error('Each quantity item must have a no (number) field');
        }
        if (typeof item.no !== 'number' && typeof item.no !== 'string') {
          throw new Error('Quantity no must be a number');
        }
        const numValue = Number(item.no);
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('Quantity no must be a non-negative number');
        }
      }
      return true;
    }),

  validatorMiddleware,

];

exports.getProductValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];

exports.updateProductValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  (req, res, next) => {
    // Parse quantity if it's a JSON string
    if (req.body.quantity && typeof req.body.quantity === 'string') {
      try {
        req.body.quantity = JSON.parse(req.body.quantity);
      } catch (e) {
        // If parsing fails, leave it as is to let validation handle it
      }
    }
    next();
  },
  body('title')
    .optional()
    .custom((val, { req }) => {
      req.body.slug = slugify(val);
      return true;
    }),
  check('quantity')
    .optional()
    .isArray()
    .withMessage('Quantity must be an array')
    .custom((quantity) => {
      if (quantity.length === 0) {
        return true; // Empty array is allowed
      }
      for (const item of quantity) {
        if (!item.size) {
          throw new Error('Each quantity item must have a size');
        }
        if (item.no === undefined || item.no === null) {
          throw new Error('Each quantity item must have a no (number) field');
        }
        if (typeof item.no !== 'number' && typeof item.no !== 'string') {
          throw new Error('Quantity no must be a number');
        }
        const numValue = Number(item.no);
        if (isNaN(numValue) || numValue < 0) {
          throw new Error('Quantity no must be a non-negative number');
        }
      }
      return true;
    }),
  validatorMiddleware,
];

exports.deleteProductValidator = [
  check('id').isMongoId().withMessage('Invalid ID formate'),
  validatorMiddleware,
];
