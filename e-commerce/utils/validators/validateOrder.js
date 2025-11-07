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
    .custom((value) => {
      // If value is not provided, skip validation (optional field)
      if (value === null || value === undefined) {
        return true;
      }
      // Accept boolean (true/false)
      if (typeof value === 'boolean') {
        return true;
      }
      // If it's an object, validate it has required fields with non-empty values
      if (typeof value === 'object' && !Array.isArray(value)) {
        const hasFullName = value.fullName && typeof value.fullName === 'string' && value.fullName.trim().length > 0;
        const hasStreetAddress = value.streetAddress && typeof value.streetAddress === 'string' && value.streetAddress.trim().length > 0;
        const hasCountry = value.country && typeof value.country === 'string' && value.country.trim().length > 0;
        const hasState = value.state && typeof value.state === 'string' && value.state.trim().length > 0;
        return hasFullName && hasStreetAddress && hasCountry && hasState;
      }
      // Reject any other type
      return false;
    })
    .withMessage("Shipping Address must be true, false, or an object with fullName, streetAddress, country, and state"),
  check("orderNotes")
    .optional()
    .isString()
    .withMessage("Order Notes must be a string"),
  check("termsAccepted")
    .equals('true')
    .withMessage("You must accept the terms and conditions"),
  validatorMiddleware
];

module.exports = {validateOrder};
