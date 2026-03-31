// Development CORS configuration - more permissive for testing
const devCorsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Disposition'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Production CORS configuration - more permissive for debugging
const prodCorsOptions = {
  origin: function (origin, callback) {
    const Logger = require('../utils/logger');
    
    // Normalize environment variables by removing any trailing slashes
    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null;
    const adminUrl = process.env.ADMIN_URL ? process.env.ADMIN_URL.replace(/\/$/, '') : null;

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:5173',
      frontendUrl,
      adminUrl,
    ].filter(Boolean); // Remove null/undefined values

    // Log the allowed origins for debugging, but only once at startup
    if (process.env.NODE_ENV === 'production' && !global.corsLogged) {
      Logger.info(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
      global.corsLogged = true; // Prevent re-logging
    }
    
    // Normalize the incoming origin by removing any trailing slash
    const normalizedOrigin = origin ? origin.replace(/\/$/, '') : origin;

    if (!origin || allowedOrigins.indexOf(normalizedOrigin) !== -1) {
      callback(null, true);
    } else {
      Logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400
};

// Use development CORS in development, production CORS in production
const corsOptions = process.env.NODE_ENV === 'production' ? prodCorsOptions : devCorsOptions;

module.exports = corsOptions;
