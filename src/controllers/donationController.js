const Donation = require('../models/Donation');
const { sendDonationEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const crypto = require('crypto');

function generateDonationRef() {
  return 'CMV' + Date.now() + Math.floor(Math.random() * 10000);
}

exports.createDonation = async (req, res) => {
  try {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const donationRef = generateDonationRef();
    const donationData = {
      ...req.body,
      amount: Number(req.body.amount),
      donationRef,
      ipAddress,
      userAgent
    };
    const donation = new Donation(donationData);
    await donation.save();
    logger.info(`Donation submitted: ${donationRef} by ${donation.email}`);
    // Send email notification
    try {
      await sendDonationEmail({
        to: donation.email,
        subject: 'Thank you for your donation',
        text: `Dear ${donation.fullName},\n\nThank you for your generous donation of Rs. ${donation.amount}. Your reference number is ${donationRef}.\n\nChinmaya Mission`,
        html: `<p>Dear ${donation.fullName},</p><p>Thank you for your generous donation of <b>Rs. ${donation.amount}</b>.<br>Your reference number is <b>${donationRef}</b>.</p><p>Chinmaya Mission</p>`
      });
    } catch (emailErr) {
      logger.error('Donation email failed', emailErr);
    }
    return res.status(201).json({ donationId: donation._id, donationRef });
  } catch (err) {
    logger.error('Donation submission error', err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.transactionId) {
      return res.status(409).json({ error: 'Duplicate transaction ID' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};
