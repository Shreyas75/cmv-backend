const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/send-otp-email', authController.sendOTPEmail);
router.post('/verify-otp', authController.verifyOTP);
router.post('/admin/login', authController.adminLogin);

module.exports = router;
