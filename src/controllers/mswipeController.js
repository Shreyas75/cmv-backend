const { v4: uuidv4 } = require('uuid');
const Donation = require('../models/Donation');
const mswipeService = require('../services/mswipeService');
const { sendDonationEmail } = require('../services/emailService');
const { generateDonationReceiptPdf } = require('../services/receiptService');
const logger = require('../utils/logger');
const validator = require('validator');
const { sanitizeInput } = require('../utils/helpers');

// ... existing code
function generateDonationRef() {
  return `CMV-${Date.now()}-${uuidv4()}`;
}

function toDonationStatusResponse(donation, extra = {}) {
  return {
    donationRef: donation.donationRef,
    status: donation.paymentStatus,
    amount: donation.amount,
    transactionRef: donation.mswipeTransactionRef,
    ipgId: donation.mswipeIpgId,
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
    ...extra,
  };
}

async function sendSuccessEmail(donation, source = 'callback') {
  try {
    await sendDonationEmail({
      to: donation.email,
      subject: 'Thank you for your donation - Chinmaya Mission Vasai',
      text: `Dear ${donation.fullName},\n\nThank you for your generous donation of Rs. ${donation.amount}.\n\nYour donation reference number is: ${donation.donationRef}\nTransaction ID: ${donation.mswipeTransactionRef}\n\nYour support helps us continue our mission.\n\nWith gratitude,\nChinmaya Mission Vasai`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6600;">Thank You for Your Donation</h2>
          <p>Dear <strong>${donation.fullName}</strong>,</p>
          <p>Thank you for your generous donation of <strong>Rs. ${donation.amount}</strong>.</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-left: 4px solid #ff6600;">
            <p style="margin: 5px 0;"><strong>Donation Reference:</strong> ${donation.donationRef}</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${donation.mswipeTransactionRef}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> Rs. ${donation.amount}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(donation.updatedAt).toLocaleDateString('en-IN')}</p>
          </div>
          <p>Your support helps us continue our mission to spread knowledge and serve the community.</p>
          <p style="margin-top: 30px;">With gratitude,<br><strong>Chinmaya Mission Vasai</strong></p>
        </div>
      `,
    });
    logger.info(`Success email sent to ${donation.email} (via ${source})`);
  } catch (emailErr) {
    logger.error('Failed to send donation success email', emailErr);
  }
}

async function syncPendingDonationStatus(donation, requestMeta) {
  if (!donation || donation.paymentStatus !== 'PENDING' || !donation.mswipeTransId) {
    return { donation, statusResult: null };
  }

  const statusResult = await mswipeService.checkTransactionStatus(donation.mswipeTransId, requestMeta);
  if (!statusResult.success) {
    return { donation, statusResult };
  }

  const mswipeStatus = statusResult.data.status;
  if (mswipeStatus !== 'PENDING') {
    donation.paymentStatus = mswipeStatus;
    donation.status = mswipeStatus === 'SUCCESS' ? 'completed' : 'failed';
    donation.mswipeTransactionRef = statusResult.data.paymentId || statusResult.data.ipgId;
    donation.mswipeIpgId = statusResult.data.ipgId;
    donation.mswipePaymentResponse = {
      ...donation.mswipePaymentResponse,
      statusCheck: statusResult.data,
    };
    donation.updatedAt = new Date();
    await donation.save();

    if (mswipeStatus === 'SUCCESS') {
      await sendSuccessEmail(donation, 'status-sync');
    }
  }

  return { donation, statusResult };
}

/**
 * Sanitize input string
// ... existing code
 */
exports.initiatePayment = async (req, res) => {
  try {
    // Check if Mswipe is configured
    if (!mswipeService.isConfigured()) {
      logger.error('Mswipe service not configured');
      return res.status(503).json({ 
        error: 'Payment service temporarily unavailable' 
      });
    }

    // Extract and sanitize input
    const {
      fullName,
      email,
      phoneNumber,
      amount,
      state,
      city,
      pinCode,
      address,
      houseNumber,
      area,
      country,
      seek80G,
      reasonForDonation,
      purpose,
      panCardNumber
    } = req.body;

    // Basic validation (detailed validation in middleware)
    const errors = [];
    if (!fullName || !fullName.trim()) errors.push('fullName is required');
    if (!email || !validator.isEmail(email)) errors.push('Valid email is required');
    if (!phoneNumber || !/^[0-9]{10}$/.test(phoneNumber)) errors.push('Valid 10-digit phone number is required');
    if (!amount || amount <= 0) errors.push('Amount must be greater than 0');

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Capture request metadata
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Capture other metadata
    const userAgent = req.headers['user-agent'] || '';

    // --- MODIFIED LOGIC: Check for recent pending/failed donations ---
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    let donation = await Donation.findOne({
      email: sanitizeInput(email),
      amount: Number(amount),
      paymentStatus: { $in: ['PENDING', 'FAILED'] },
      createdAt: { $gte: fiveMinutesAgo }
    }).sort({ createdAt: -1 });

    if (donation) {
      // If a recent donation is found, reuse it
      logger.info(`Reusing existing donation record: ${donation.donationRef} for email ${email}`);
      donation.mswipeOrderId = mswipeService.generateOrderId(); // Generate a new order ID for this attempt
      // Keep legacy unique field populated to avoid duplicate-key issues on older indexes.
      if (!donation.transactionId) {
        donation.transactionId = `MSW-${donation.donationRef}`;
      }
      // Update address components if provided in new request
      if (houseNumber) donation.houseNumber = sanitizeInput(houseNumber);
      if (area) donation.area = sanitizeInput(area);
      // Update other fields that might have changed
      if (phoneNumber) donation.phoneNumber = sanitizeInput(phoneNumber);
      if (state) donation.state = sanitizeInput(state);
      if (city) donation.city = sanitizeInput(city);
      if (pinCode) donation.pinCode = sanitizeInput(pinCode);
      if (address) donation.address = sanitizeInput(address);
      if (country) donation.country = country || 'India';
      donation.paymentStatus = 'PENDING';
      donation.status = 'pending';
      donation.updatedAt = new Date();
    } else {
      // No recent donation found, create a new one
      const donationRef = generateDonationRef();
      const mswipeOrderId = mswipeService.generateOrderId();

      const donationData = {
        fullName: sanitizeInput(fullName),
        email: sanitizeInput(email),
        phoneNumber: sanitizeInput(phoneNumber),
        state: sanitizeInput(state),
        city: sanitizeInput(city),
        pinCode: sanitizeInput(pinCode),
        address: sanitizeInput(address),
        country: country || 'India',
        seek80G: seek80G,
        amount: Number(amount),
        reasonForDonation: reasonForDonation,
        purpose: sanitizeInput(purpose),
        panCardNumber: panCardNumber,
        donationRef,
        // Populate legacy unique field with a deterministic unique value.
        transactionId: `MSW-${donationRef}`,
        paymentGateway: 'mswipe',
        paymentStatus: 'PENDING',
        status: 'pending',
        mswipeOrderId,
        ipAddress,
        userAgent
      };
      // Only add address components if they have non-empty values
      if (houseNumber && houseNumber.trim()) {
        donationData.houseNumber = sanitizeInput(houseNumber);
      }
      if (area && area.trim()) {
        donationData.area = sanitizeInput(area);
      }
      donation = new Donation(donationData);
    }
    
    await donation.save();
    // --- END MODIFIED LOGIC ---

    logger.info(`Mswipe donation initiated: ${donation.donationRef} (Order: ${donation.mswipeOrderId}) by ${email}`);

    // Call Mswipe API to create payment link
    const mswipeResult = await mswipeService.createOrder({
      name: fullName,
      email: email,
      mobile: phoneNumber,
      amount: Number(amount),
      orderId: donation.mswipeOrderId,
      donationRef: donation.donationRef,
      purpose: purpose || reasonForDonation
    });

    if (!mswipeResult.success) {
      // Mark donation as failed
      donation.paymentStatus = 'FAILED';
      donation.status = 'failed';
      donation.mswipePaymentResponse = { error: mswipeResult.error };
      await donation.save();

      logger.error(`Mswipe order creation failed for ${donation.donationRef}: ${mswipeResult.error}`);
      return res.status(500).json({ 
        error: 'Failed to initiate payment',
        details: process.env.NODE_ENV !== 'production' ? mswipeResult.error : undefined,
        donationRef: donation.donationRef // Return reference for support queries
      });
    }

    // Store Mswipe response (includes IPG_ID, transId for status checks)
    donation.mswipePaymentResponse = mswipeResult.data.mswipeResponse;
    donation.mswipeIpgId = mswipeResult.data.txnId;      // IPG_ID from Mswipe
    donation.mswipeTransId = mswipeResult.data.transId;  // TransID for status checks
    await donation.save();

    // Return payment URL - frontend will redirect user
    return res.status(200).json({
      success: true,
      paymentUrl: mswipeResult.data.paymentUrl,
      donationRef: donation.donationRef,
      orderId: donation.mswipeOrderId
    });

  } catch (err) {
    logger.error('Mswipe initiate payment error', {
      message: err.message,
      code: err.code,
      keyPattern: err.keyPattern,
      stack: err.stack
    });
    
    // Handle duplicate donation reference (unlikely but possible)
    if (err.code === 11000) {
      // Log which field caused the duplicate
      const duplicateField = err.keyPattern ? Object.keys(err.keyPattern)[0] : 'unknown';
      logger.error(`Duplicate key error on field: ${duplicateField}`);
      return res.status(409).json({ 
        error: 'A duplicate donation record was detected. Please retry the payment.',
        field: duplicateField
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Handle Mswipe BackPosting callback
 * Updates donation status based on payment result
 * 
 * POST /api/mswipe/callback
 * Body: Mswipe BackPosting data (see documentation for structure)
 * 
 * SECURITY CRITICAL:
 * - Only trust data from Mswipe callback
 * - Verify order ID matches pending donation
 * - Prevent replay attacks by checking current status
 * - Only update PENDING donations
 * - Never accept payment status from frontend
 */
exports.handleCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    
    logger.info('Mswipe BackPosting callback received', { 
      ipgId: callbackData.IPG_ID,
      invoiceNo: callbackData.ME_InvNo,
      status: callbackData.TRAN_STATUS,
      amount: callbackData.TranAmount
    });

    // Verify callback data using the new BackPosting format
    const verification = mswipeService.verifyCallback(callbackData);
    
    if (!verification.valid) {
      logger.error('Invalid Mswipe callback', verification.error);
      return res.status(400).json({ error: 'Invalid callback data' });
    }

    // Find donation by Mswipe order ID (ME_InvNo = our invoice_id = mswipeOrderId)
    const donation = await Donation.findOne({ 
      mswipeOrderId: verification.orderId 
    });

    if (!donation) {
      logger.error(`Donation not found for Mswipe order: ${verification.orderId}`);
      return res.status(404).json({ error: 'Donation not found' });
    }

    // SECURITY: Only update donations that are currently PENDING
    // This prevents replay attacks and duplicate callbacks
    if (donation.paymentStatus !== 'PENDING') {
      logger.warn(`Attempted to update non-pending donation: ${donation.donationRef} (Current status: ${donation.paymentStatus})`);
      
      // Redirect to frontend anyway (callback might be duplicate)
      const frontendUrl = process.env.FRONTEND_PAYMENT_RESULT_URL;
      if (frontendUrl) {
        return res.redirect(`${frontendUrl}?status=${donation.paymentStatus.toLowerCase()}&ref=${donation.donationRef}`);
      }
      
      return res.status(200).json({ 
        message: 'Donation already processed',
        status: donation.paymentStatus 
      });
    }

    // Verify amount matches (additional security check)
    if (verification.amount && Number(verification.amount) !== donation.amount) {
      logger.error(`Amount mismatch for ${donation.donationRef}: Expected ${donation.amount}, got ${verification.amount}`);
      donation.paymentStatus = 'FAILED';
      donation.status = 'failed';
      await donation.save();
      return res.status(400).json({ error: 'Amount verification failed' });
    }

    // Update donation status based on payment result
    donation.paymentStatus = verification.status;
    donation.status = verification.status === 'SUCCESS' ? 'completed' : 'failed';
    donation.mswipeTransactionRef = verification.transactionRef;  // RRN or IPG_ID
    donation.mswipeIpgId = verification.ipgId;                    // IPG_ID
    donation.mswipePaymentResponse = {
      ...donation.mswipePaymentResponse,
      callback: {
        ipgId: verification.ipgId,
        transactionRef: verification.transactionRef,
        cardType: verification.cardType,
        cardNumber: verification.cardNumber,
        responseCode: verification.responseCode,
        responseDesc: verification.responseDesc,
        dateTime: verification.dateTime,
        merchantId: verification.merchantId,
        terminalId: verification.terminalId,
        extraNotes: verification.extraNotes,
        rawStatus: callbackData.TRAN_STATUS
      }
    };
    donation.updatedAt = new Date();

    await donation.save();

    logger.info(`Donation ${donation.donationRef} updated to ${donation.paymentStatus} (IPG: ${verification.ipgId}, RRN: ${verification.transactionRef})`);

    // Send success email ONLY for successful payments
    if (donation.paymentStatus === 'SUCCESS') {
      await sendSuccessEmail(donation, 'callback');
    }

    // Redirect to frontend payment result page
    const frontendUrl = process.env.FRONTEND_PAYMENT_RESULT_URL;
    if (frontendUrl) {
      const status = donation.paymentStatus.toLowerCase();
      const redirectUrl = `${frontendUrl}?status=${status}&ref=${donation.donationRef}&amount=${donation.amount}`;
      logger.info(`Redirecting to frontend: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    }

    // Fallback: Return JSON if no redirect URL configured
    return res.status(200).json({
      success: donation.paymentStatus === 'SUCCESS',
      status: donation.paymentStatus,
      donationRef: donation.donationRef,
      message: donation.paymentStatus === 'SUCCESS' 
        ? 'Payment successful' 
        : 'Payment failed'
    });

  } catch (err) {
    logger.error('Mswipe callback handler error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get donation status by reference
 * Allows frontend to check payment status
 * 
 * GET /api/mswipe/status/:donationRef
 */
exports.getDonationStatus = async (req, res) => {
  try {
    const { donationRef } = req.params;

    if (!donationRef) {
      return res.status(400).json({ error: 'Donation reference is required' });
    }

    const donation = await Donation.findOne({ donationRef })
      .select('donationRef paymentStatus amount createdAt updatedAt mswipeTransactionRef mswipeOrderId mswipeIpgId');

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    return res.status(200).json(toDonationStatusResponse(donation));

  } catch (err) {
    logger.error('Get donation status error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Verify transaction status with Mswipe API
 * Use this to manually verify payment status if callback was missed
 * 
 * POST /api/mswipe/verify/:donationRef
 */
exports.verifyTransaction = async (req, res) => {
  try {
    const { donationRef } = req.params;

    if (!donationRef) {
      return res.status(400).json({ error: 'Donation reference is required' });
    }

    const donation = await Donation.findOne({ donationRef });

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    // Get transId stored during payment initiation
    const transId = donation.mswipeTransId;
    
    if (!transId) {
      return res.status(400).json({ 
        error: 'Transaction ID not available for verification',
        status: donation.paymentStatus
      });
    }

    // Call Mswipe API to check transaction status
    const statusResult = await mswipeService.checkTransactionStatus(transId, {
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    if (!statusResult.success) {
      logger.error(`Mswipe status check failed for ${donationRef}: ${statusResult.error}`);
      return res.status(500).json({ 
        error: 'Failed to verify transaction status',
        currentStatus: donation.paymentStatus
      });
    }

    const mswipeStatus = statusResult.data.status;
    if (donation.paymentStatus === 'PENDING' && mswipeStatus !== 'PENDING') {
      donation.paymentStatus = mswipeStatus;
      donation.status = mswipeStatus === 'SUCCESS' ? 'completed' : 'failed';
      donation.mswipeTransactionRef = statusResult.data.paymentId || statusResult.data.ipgId;
      donation.mswipeIpgId = statusResult.data.ipgId;
      donation.mswipePaymentResponse = {
        ...donation.mswipePaymentResponse,
        statusCheck: statusResult.data,
      };
      donation.updatedAt = new Date();
      await donation.save();

      logger.info(`Donation ${donationRef} updated via verify endpoint to ${mswipeStatus}`);
      if (mswipeStatus === 'SUCCESS') {
        await sendSuccessEmail(donation, 'verify');
      }
    }

    return res.status(200).json(
      toDonationStatusResponse(donation, {
        mswipeStatus: statusResult.data,
      })
    );

  } catch (err) {
    logger.error('Verify transaction error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get Mswipe service environment info (for debugging)
 * 
 * GET /api/mswipe/info
 */
exports.getServiceInfo = async (req, res) => {
  try {
    const info = mswipeService.getEnvironmentInfo();
    return res.status(200).json(info);
  } catch (err) {
    logger.error('Get service info error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get donation status and auto-sync once with Mswipe when still pending.
 * Intended for frontend auto-refresh polling.
 *
 * GET /api/mswipe/status-sync/:donationRef
 */
exports.getDonationStatusSync = async (req, res) => {
  try {
    const { donationRef } = req.params;
    if (!donationRef) {
      return res.status(400).json({ error: 'Donation reference is required' });
    }

    const donation = await Donation.findOne({ donationRef });
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    const requestMeta = {
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    const syncAttempted = donation.paymentStatus === 'PENDING' && !!donation.mswipeTransId;

    const { donation: syncedDonation, statusResult } = await syncPendingDonationStatus(
      donation,
      requestMeta
    );

    const response = toDonationStatusResponse(syncedDonation, {
      syncAttempted,
    });

    if (statusResult && statusResult.success) {
      response.mswipeStatus = statusResult.data;
    }

    if (statusResult && !statusResult.success) {
      response.syncError = statusResult.error;
    }

    return res.status(200).json(response);
  } catch (err) {
    logger.error('Status sync error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Download donation receipt (PDF) for successful payments.
 *
 * GET /api/mswipe/receipt/:donationRef
 */
exports.downloadReceipt = async (req, res) => {
  try {
    const { donationRef } = req.params;
    if (!donationRef) {
      return res.status(400).json({ error: 'Donation reference is required' });
    }

    const donation = await Donation.findOne({ donationRef })
      .select(
        'donationRef fullName email phoneNumber address houseNumber area city state pinCode country panCardNumber amount purpose reasonForDonation paymentStatus mswipeTransactionRef mswipeIpgId mswipeOrderId transactionId createdAt updatedAt'
      );

    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.paymentStatus !== 'SUCCESS') {
      return res.status(409).json({
        error: 'Receipt is only available for successful payments',
        status: donation.paymentStatus,
      });
    }

    const pdfBuffer = await generateDonationReceiptPdf(donation);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="donation-receipt-${donation.donationRef}.pdf"`
    );
    return res.status(200).send(pdfBuffer);
  } catch (err) {
    logger.error('Download receipt error', err);
    return res.status(500).json({ error: 'Failed to generate receipt' });
  }
};

/**
 * Debug endpoint to test Mswipe token generation
 * This helps verify if credentials are correct
 * 
 * GET /api/mswipe/debug/token
 * 
 * REMOVE IN PRODUCTION or secure with admin auth
 */
exports.debugTestToken = async (req, res) => {
  try {
    const info = mswipeService.getEnvironmentInfo();
    
    // Try to generate a token
    const tokenResult = await mswipeService.generateToken();
    
    return res.status(200).json({
      environment: info.environment,
      baseUrl: info.baseUrl,
      configured: info.configured,
      tokenGeneration: {
        success: tokenResult.success,
        error: tokenResult.error || null,
        hasToken: !!tokenResult.token,
        // Don't expose actual token for security
        tokenPreview: tokenResult.token ? `${tokenResult.token.substring(0, 20)}...` : null
      },
      configCheck: {
        hasUserId: !!process.env.MSWIPE_USER_ID,
        hasClientId: !!process.env.MSWIPE_CLIENT_ID,
        hasPassword: !!process.env.MSWIPE_PASSWORD,
        hasCustCode: !!process.env.MSWIPE_CUST_CODE,
        hasRedirectUrl: !!process.env.MSWIPE_REDIRECT_URL
      }
    });
  } catch (err) {
    logger.error('Debug token test error', err);
    return res.status(500).json({ 
      error: 'Token test failed',
      message: err.message 
    });
  }
};
