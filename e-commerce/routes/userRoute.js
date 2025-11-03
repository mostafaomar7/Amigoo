const express = require('express');
const { loginUser, registerUser, getAllUsers, getUserById } = require('../services/user');
const { validateUserlogin, validateUserRegistration } = require('../middlewares/validationMW');
const { authenticate, authorize } = require('../middlewares/authMW');

const router = express.Router();

// Public routes
router.post('/login', validateUserlogin, loginUser);
router.post('/register', validateUserRegistration, registerUser);

// Protected routes (Admin only)
router.get('/', authenticate, authorize(['Admin']), getAllUsers);
router.get('/:id', authenticate, authorize(['Admin']), getUserById);

module.exports = router;
