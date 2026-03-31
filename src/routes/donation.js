const express = require('express');
const router = express.Router();
const validateDonation = require('../middleware/validateDonation');
const { createDonation } = require('../controllers/donationController');
const logger = require('../utils/logger');

// Request logging middleware
router.use((req, res, next) => {
  logger.info(`Donation route accessed: ${req.method} ${req.originalUrl} from ${req.ip}`);
  next();
});

router.post(
  '/',
  express.json(),
  validateDonation,
  createDonation
);

module.exports = router;
