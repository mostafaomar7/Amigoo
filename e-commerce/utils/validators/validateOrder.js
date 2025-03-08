const { check } = require("express-validator");
const {validatorMiddleware} = require('../../middlewares/validatorMiddleware');

const validateOrder = [
  check("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full Name is required")
    .isLength({ min: 3 })
    .withMessage("Full Name must be at least 3 characters long"),
  check("country")
    .trim()
    .notEmpty()
    .withMessage("Country is required"),
  check("streetAddress")
    .trim()
    .notEmpty()
    .withMessage("Street Address is required"),
  check("state")
    .trim()
    .notEmpty()
    .withMessage("State/County is required"),
  check("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required")
    .matches(/^\d{11}$/)
    .withMessage("Phone number must be exactly 11 digits"),
  check("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Invalid email address"),
  check("shippingAddress")
    .optional()
    .isBoolean()
    .withMessage("Shipping Address must be true or false"),
  check("orderNotes")
    .optional()
    .isString()
    .withMessage("Order Notes must be a string"),
  validatorMiddleware
];

module.exports = {validateOrder};
