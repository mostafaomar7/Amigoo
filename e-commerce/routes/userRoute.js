const express = require('express');
const  {loginUser,registerUser} = require('../services/user');
const {validateUserlogin,validateUserRegistration}= require("../middlewares/validationMW")

const router = express.Router();

router.post('/login',validateUserlogin,loginUser);
router.post('/register',validateUserRegistration,registerUser);

module.exports = router;
