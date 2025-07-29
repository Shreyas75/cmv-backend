const express = require('express');
const router = express.Router();
const cgcc2025Controller = require('../controllers/cgcc2025Controller');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Rate limiting for registration endpoint
const registrationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 registration attempts per windowMs (increased from 3)
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again after 15 minutes.',
    errors: [
      { field: 'rate_limit', message: 'Registration rate limit exceeded' }
    ]
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for local development and testing
    return process.env.NODE_ENV === 'development' || req.ip === '::1' || req.ip === '127.0.0.1';
  }
});

// Request logging middleware
router.use((req, res, next) => {
  logger.info(`CGCC 2025 route accessed: ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

// Main registration endpoint
router.post('/register', registrationRateLimit, cgcc2025Controller.register);

// Admin endpoints (no authentication for consistency with existing admin routes)
router.get('/stats', cgcc2025Controller.getStats);
router.get('/export', cgcc2025Controller.exportRegistrations);

module.exports = router;
