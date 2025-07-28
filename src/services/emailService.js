const { createTransporter } = require('../config/email');
const logger = require('../utils/logger');

const transporter = createTransporter();

async function sendDonationEmail({ to, subject, text, html }) {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
