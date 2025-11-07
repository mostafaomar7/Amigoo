const { check } = require('express-validator');
const {validatorMiddleware} = require('../../middlewares/validatorMiddleware');

exports.validateContactForm = [
  check('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long'),
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  check('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\d{11}$/)
    .withMessage('Phone number must be 11 number'),
  check('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),

    validatorMiddleware
];
