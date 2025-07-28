const rateLimit = require('express-rate-limit');

const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 donation requests per windowMs
  message: {
    error: 'Too many donation requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = donationLimiter;
