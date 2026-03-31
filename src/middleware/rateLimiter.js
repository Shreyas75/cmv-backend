const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Creates a rate limiter with custom options.
 * @param {object} options - Options for the rate limiter.
 * @param {number} options.windowMs - The time window in milliseconds.
 * @param {number} options.max - The max number of requests per window per IP.
 * @param {string} options.message - The message to send when the limit is exceeded.
 * @returns {function} - The rate limit middleware.
 */
const createRateLimiter = ({ windowMs, max, message }) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for ${req.ip}: ${options.message.error}`);
      res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

// General purpose limiter for most API routes
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Stricter limiter for sensitive endpoints like payment initiation
const paymentLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 payment initiation requests per minute
  message: 'Too many payment attempts from this IP, please try again after a minute.',
});

// Very strict limiter for authentication attempts
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/register attempts per 15 minutes
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
});

module.exports = {
  generalLimiter,
  paymentLimiter,
  authLimiter,
};
