const mongoose = require('mongoose');
const Logger = require('../utils/logger');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    Logger.success('MongoDB Connected Successfully');
  } catch (error) {
    Logger.error('MongoDB Connection Error:', error.message);
    Logger.info('Please check your MONGODB_URI in .env file');
    Logger.warn('Server will continue running without database...');
    // Don't exit - let server run without DB for development
    // process.exit(1);
  }
};

module.exports = connectDB;
