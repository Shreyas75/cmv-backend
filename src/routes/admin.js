const express = require('express');
const router = express.Router();
const { AdminController } = require('../controllers/adminController');
const logger = require('../utils/logger');

// Request logging middleware for admin routes
router.use((req, res, next) => {
  logger.info(`Admin route accessed: ${req.method} ${req.originalUrl} from ${req.ip}`);
  logger.info(`Query params: ${JSON.stringify(req.query)}`);
  next();
});

// Simple admin routes - no authentication required (same as export user data)
router.get('/export/donations', AdminController.exportDonations);     // Export CSV with filters
router.get('/stats/donations', AdminController.getDonationStats);     // Get donation statistics  
router.get('/donations/recent', AdminController.getRecentDonations);  // Get recent donations

module.exports = router;
