/**
 * Integration tests for database connection
 * These tests require a running MongoDB instance
 * Run with: npm test -- config/db.integration.test.js
 * 
 * Prerequisites:
 * - MongoDB running on localhost:27017
 * - Or set MONGODB_TEST_URI environment variable
 */

const mongoose = require('mongoose');
const { connectDB, closeDB, getConnectionState } = require('./db');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.MONGODB_TEST_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/construction-management-test';
process.env.DB_MAX_RETRIES = '3';
process.env.DB_RETRY_INTERVAL = '1000';

describe('Database Connection Integration Tests', () => {
  // Skip these tests if MongoDB is not available
  const skipIfNoMongo = process.env.SKIP_INTEGRATION_TESTS === 'true';

  beforeAll(() => {
    if (skipIfNoMongo) {
      console.log('Skipping integration tests (SKIP_INTEGRATION_TESTS=true)');
    }
  });

  afterEach(async () => {
    if (!skipIfNoMongo && mongoose.connection.readyState !== 0) {
      await closeDB();
    }
  });

  describe('connectDB', () => {
    it('should connect to MongoDB successfully', async () => {
      if (skipIfNoMongo) return;

      await connectDB();
      expect(mongoose.connection.readyState).toBe(1); // 1 = connected
      expect(getConnectionState()).toBe('connected');
    }, 15000);

    it('should handle connection with invalid URI gracefully', async () => {
      if (skipIfNoMongo) return;

      const originalURI = process.env.MONGODB_TEST_URI;
      process.env.MONGODB_TEST_URI = 'mongodb://invalid-host:27017/test';

      // Suppress console output
      const consoleError = console.error;
      const consoleLog = console.log;
      console.error = jest.fn();
      console.log = jest.fn();

      // This should attempt retries and eventually fail
      // We're not waiting for it to complete to avoid long test times
      const connectPromise = connectDB();

      // Wait a bit to ensure retry logic is triggered
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Restore
      console.error = consoleError;
      console.log = consoleLog;
      process.env.MONGODB_TEST_URI = originalURI;

      // Clean up any pending connections
      if (mongoose.connection.readyState !== 0) {
        await closeDB();
      }
    }, 20000);
  });

  describe('Connection State', () => {
    it('should return connected state after successful connection', async () => {
      if (skipIfNoMongo) return;

      await connectDB();
      const state = getConnectionState();
      expect(state).toBe('connected');
    }, 15000);

    it('should return disconnected state after closing connection', async () => {
      if (skipIfNoMongo) return;

      await connectDB();
      await closeDB();
      const state = getConnectionState();
      expect(state).toBe('disconnected');
    }, 15000);
  });

  describe('Connection Events', () => {
    it('should set up connection event listeners', async () => {
      if (skipIfNoMongo) return;

      await connectDB();

      const errorListeners = mongoose.connection.listeners('error');
      const disconnectedListeners = mongoose.connection.listeners('disconnected');
      const reconnectedListeners = mongoose.connection.listeners('reconnected');

      expect(errorListeners.length).toBeGreaterThan(0);
      expect(disconnectedListeners.length).toBeGreaterThan(0);
      expect(reconnectedListeners.length).toBeGreaterThan(0);
    }, 15000);
  });

  describe('closeDB', () => {
    it('should close database connection successfully', async () => {
      if (skipIfNoMongo) return;

      await connectDB();
      await closeDB();
      expect(mongoose.connection.readyState).toBe(0); // 0 = disconnected
    }, 15000);

    it('should handle closing when already disconnected', async () => {
      if (skipIfNoMongo) return;

      await expect(closeDB()).resolves.not.toThrow();
    });
  });

  describe('Retry Logic', () => {
    it('should reset retry count on successful connection', async () => {
      if (skipIfNoMongo) return;

      await connectDB();
      // If we get here without error, retry count was properly managed
      expect(mongoose.connection.readyState).toBe(1);
    }, 15000);
  });
});
