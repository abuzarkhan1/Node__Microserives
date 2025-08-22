const mongoose = require('mongoose');
const logger = require('../utils/logger');
const DB_URL = process.env.MONGODB_URL;


const connectDB = async () => {  try {
    await mongoose.connect(DB_URL);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

module.exports = connectDB;
