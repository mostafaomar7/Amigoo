const express = require('express');
const {
  submitForm,
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,
  replyToForm
} = require('../services/contactFormService');
const {validateContactForm} = require('../utils/validators/contactFormValidator');
const {authenticate,authorize} =require("../middlewares/authMW")

const router = express.Router();

// Public routes
router.route('/').post(validateContactForm, submitForm);

// Protected routes (Admin only)
router.use(authenticate, authorize(['Admin']));

router.route('/').get(getAllForms);
router.route('/:id').get(getFormById);
router.route('/:id').put(validateContactForm, updateForm);
router.route('/:id').delete(deleteForm);
router.route('/:id/reply').post(replyToForm);

module.exports = router;
