const { createTransporter } = require('../config/email');
const logger = require('../utils/logger');

// Don't cache transporter - create fresh each time to use latest config

async function sendDonationEmail({ to, subject, text, html }) {
  // Create fresh transporter to use latest config
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"Chinmaya Mission Vasai" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Donation email sent to ${to}`);
  } catch (err) {
    logger.error('Error sending donation email', err);
    throw err;
  }
}

module.exports = { sendDonationEmail };
