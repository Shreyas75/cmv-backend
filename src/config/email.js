const nodemailer = require('nodemailer');
require('dotenv').config();

const createTransporter = () => {
  // Check if using GoDaddy SMTP or Gmail
  if (process.env.SMTP_HOST) {
    // GoDaddy Professional Email Configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Fallback to Gmail configuration
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
};

module.exports = { createTransporter };
