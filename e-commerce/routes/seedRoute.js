const express = require('express');
const { seedDatabase } = require('../services/seedService');

const router = express.Router();

// Route لملء البيانات الوهمية
router.post('/', seedDatabase);

module.exports = router;
