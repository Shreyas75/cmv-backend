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

// Production CORS configuration - more restrictive
const prodCorsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const Logger = require('../utils/logger');
    
    const allowedOrigins = [
      'http://localhost:3000',     // React development server
      'http://localhost:3001',     // Alternative React port
      'http://localhost:5173',     // Vite development server
      'http://127.0.0.1:3000',     // Localhost alternative
      'http://127.0.0.1:3001',     // Localhost alternative
      'http://localhost:5173/',     // Vite localhost alternative
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log blocked origins only in development
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
