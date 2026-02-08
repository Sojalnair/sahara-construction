const { getConnectionState } = require('./db');

// Mock environment variables
process.env.MONGODB_URI = 'mongodb://localhost:27017/construction-management-test';
process.env.DB_MAX_RETRIES = '3';
process.env.DB_RETRY_INTERVAL = '1000';

describe('Database Connection', () => {
  describe('getConnectionState', () => {
    it('should return a valid connection state', () => {
      const state = getConnectionState();
      expect(['disconnected', 'connected', 'connecting', 'disconnecting']).toContain(state);
    });
  });

  describe('Configuration', () => {
    it('should have required environment variables', () => {
      expect(process.env.MONGODB_URI).toBeDefined();
      expect(process.env.DB_MAX_RETRIES).toBeDefined();
      expect(process.env.DB_RETRY_INTERVAL).toBeDefined();
    });

    it('should parse retry configuration correctly', () => {
      const maxRetries = parseInt(process.env.DB_MAX_RETRIES);
      const retryInterval = parseInt(process.env.DB_RETRY_INTERVAL);
      
      expect(maxRetries).toBe(3);
      expect(retryInterval).toBe(1000);
    });
  });

  describe('Module exports', () => {
    it('should export connectDB function', () => {
      const { connectDB } = require('./db');
      expect(typeof connectDB).toBe('function');
    });

    it('should export closeDB function', () => {
      const { closeDB } = require('./db');
      expect(typeof closeDB).toBe('function');
    });

    it('should export getConnectionState function', () => {
      expect(typeof getConnectionState).toBe('function');
    });
  });
});
