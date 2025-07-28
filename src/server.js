const express = require('express');
const cors = require('cors');
const corsOptions = require('./config/cors');
const corsLogger = require('./middleware/corsDebugger');
const connectDB = require('./config/database');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const Logger = require('./utils/logger');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// Connect to MongoDB
connectDB().catch(err => {
  Logger.error('Database connection failed:', err.message);
});

// Middleware
app.use(corsLogger); // Log CORS issues only when needed
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/', routes);

// Error handler middleware
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  Logger.info(`Server running on port ${port}`);
  Logger.info(`Health check: http://localhost:${port}/health`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  Logger.info('Press Ctrl+C to stop the server');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  Logger.error('Unhandled Promise Rejection:', err.message);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  Logger.error('Uncaught Exception:', err.message);
  Logger.debug('Stack trace:', err.stack);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

module.exports = app;
