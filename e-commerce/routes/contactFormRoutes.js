const express = require('express');
const { submitForm,getAllForms,getFormById,updateForm,deleteForm } = require('../services/contactFormService');
const {validateContactForm} = require('../utils/validators/contactFormValidator');
const {authenticate,authorize} =require("../middlewares/authMW")

const router = express.Router();

router.route('/').get( authenticate,authorize(['Admin']),getAllForms)
.post(validateContactForm, submitForm);
router
  .route('/:id')
  .get(authenticate,authorize(['Admin']),getFormById)
  .put(authenticate,authorize(['Admin']), validateContactForm,updateForm)
  .delete(authenticate,authorize(['Admin']), deleteForm);
module.exports = router;
