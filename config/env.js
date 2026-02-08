const dotenv = require('dotenv');
const path = require('path');

/**
 * Load and validate environment variables
 */

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
const validateEnv = () => {
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }

  // Validate JWT_SECRET strength
  if (process.env.JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters for security');
  }
};

/**
 * Get configuration object
 * @returns {Object} Configuration object
 */
const getConfig = () => {
  return {
    // Database
    mongodbURI: process.env.MONGODB_URI,
    mongodbTestURI: process.env.MONGODB_TEST_URI,
    dbMaxRetries: parseInt(process.env.DB_MAX_RETRIES) || 5,
    dbRetryInterval: parseInt(process.env.DB_RETRY_INTERVAL) || 5000,

    // JWT
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE || '7d',

    // Cloudinary
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    },

    // Server
    port: parseInt(process.env.PORT) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Feature flags
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    isTest: process.env.NODE_ENV === 'test'
  };
};

module.exports = {
  validateEnv,
  getConfig
};
