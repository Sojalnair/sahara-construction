const mongoose = require('mongoose');

/**
 * Database connection configuration with retry logic
 * Implements connection error handling and automatic reconnection
 */

let retryCount = 0;
const maxRetries = parseInt(process.env.DB_MAX_RETRIES) || 5;
const retryInterval = parseInt(process.env.DB_RETRY_INTERVAL) || 5000;

/**
 * Connect to MongoDB with retry logic
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.NODE_ENV === 'test' 
      ? process.env.MONGODB_TEST_URI 
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const options = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Reset retry count on successful connection
    retryCount = 0;

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
      handleDisconnection();
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
      retryCount = 0;
    });

  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    
    if (retryCount < maxRetries) {
      retryCount++;
      console.log(`Retry attempt ${retryCount}/${maxRetries} in ${retryInterval/1000} seconds...`);
      
      setTimeout(() => {
        connectDB();
      }, retryInterval);
    } else {
      console.error(`Failed to connect to MongoDB after ${maxRetries} attempts`);
      process.exit(1);
    }
  }
};

/**
 * Handle disconnection and attempt reconnection
 */
const handleDisconnection = () => {
  if (retryCount < maxRetries) {
    retryCount++;
    console.log(`Reconnection attempt ${retryCount}/${maxRetries}...`);
    
    setTimeout(() => {
      mongoose.connect(process.env.MONGODB_URI)
        .then(() => {
          console.log('Reconnection successful');
          retryCount = 0;
        })
        .catch((err) => {
          console.error(`Reconnection failed: ${err.message}`);
          handleDisconnection();
        });
    }, retryInterval);
  }
};

/**
 * Close database connection gracefully
 * @returns {Promise<void>}
 */
const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error(`Error closing MongoDB connection: ${error.message}`);
    throw error;
  }
};

/**
 * Get current connection state
 * @returns {string} Connection state
 */
const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return states[mongoose.connection.readyState] || 'unknown';
};

module.exports = {
  connectDB,
  closeDB,
  getConnectionState
};
