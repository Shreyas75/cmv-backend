const express = require('express');
const router = express.Router();
const mswipeController = require('../controllers/mswipeController');

/**
 * POST /api/mswipe/initiate
 * Initiate Mswipe payment for donation
 *
 * Public endpoint - rate limited
 * Creates pending donation and returns Mswipe payment URL (smslink)
 */
router.post('/initiate', mswipeController.initiatePayment);

/**
 * POST /api/mswipe/callback
 * Webhook endpoint for Mswipe BackPosting callbacks
 *
 * PUBLIC - No authentication (called by Mswipe servers)
 * Updates donation status based on payment result
 * Redirects to frontend payment result page
 */
router.post('/callback', mswipeController.handleCallback);

/**
 * GET /api/mswipe/status/:donationRef
 * Get donation payment status by reference
 *
 * Public endpoint - rate limited
 * Useful for frontend to check/poll status
 */
router.get('/status/:donationRef', mswipeController.getDonationStatus);

/**
 * GET /api/mswipe/status-sync/:donationRef
 * Get donation status with one-step auto-sync for pending records.
 * Useful for frontend auto-refresh polling.
 */
router.get('/status-sync/:donationRef', mswipeController.getDonationStatusSync);

/**
 * POST /api/mswipe/verify/:donationRef
 * Manually verify transaction status with Mswipe
 *
 * Public endpoint - rate limited
 * Use if callback is missed or for debugging
 */
router.post('/verify/:donationRef', mswipeController.verifyTransaction);

/**
 * GET /api/mswipe/receipt/:donationRef
 * Download receipt PDF for successful donations.
 */
router.get('/receipt/:donationRef', mswipeController.downloadReceipt);

/**
 * GET /api/mswipe/info
 * Get Mswipe service environment info (for debugging)
 *
 * SECURED - Should be admin-only in production
 */
// TODO: Add admin authentication middleware
router.get('/info', mswipeController.getServiceInfo);

/**
 * GET /api/mswipe/debug/token
 * Debug endpoint to test Mswipe token generation
 *
 * SECURED - Should be admin-only in production
 */
// TODO: Add admin authentication middleware
router.get('/debug/token', mswipeController.debugTestToken);

module.exports = router;
