const { validateEnv, getConfig } = require('./env');

describe('Environment Configuration', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should pass validation with all required variables', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'test-secret-key-with-sufficient-length-32chars';

      expect(() => validateEnv()).not.toThrow();
    });

    it('should throw error when MONGODB_URI is missing', () => {
      delete process.env.MONGODB_URI;
      process.env.JWT_SECRET = 'test-secret-key-with-sufficient-length-32chars';

      expect(() => validateEnv()).toThrow('Missing required environment variables: MONGODB_URI');
    });

    it('should throw error when JWT_SECRET is missing', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      delete process.env.JWT_SECRET;

      expect(() => validateEnv()).toThrow('Missing required environment variables: JWT_SECRET');
    });

    it('should throw error when multiple variables are missing', () => {
      delete process.env.MONGODB_URI;
      delete process.env.JWT_SECRET;

      expect(() => validateEnv()).toThrow('Missing required environment variables');
    });

    it('should warn when JWT_SECRET is too short', () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.JWT_SECRET = 'short';

      const consoleWarn = console.warn;
      console.warn = jest.fn();

      validateEnv();

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('JWT_SECRET should be at least 32 characters')
      );

      console.warn = consoleWarn;
    });
  });

  describe('getConfig', () => {
    beforeEach(() => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/test-db';
      process.env.JWT_SECRET = 'test-secret-key-with-sufficient-length-32chars';
      process.env.JWT_EXPIRE = '30d';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-key';
      process.env.CLOUDINARY_API_SECRET = 'test-secret';
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'development';
      process.env.DB_MAX_RETRIES = '10';
      process.env.DB_RETRY_INTERVAL = '3000';
    });

    it('should return complete configuration object', () => {
      const config = getConfig();

      expect(config).toHaveProperty('mongodbURI');
      expect(config).toHaveProperty('mongodbTestURI');
      expect(config).toHaveProperty('jwtSecret');
      expect(config).toHaveProperty('jwtExpire');
      expect(config).toHaveProperty('cloudinary');
      expect(config).toHaveProperty('port');
      expect(config).toHaveProperty('nodeEnv');
    });

    it('should parse numeric values correctly', () => {
      const config = getConfig();

      expect(config.port).toBe(3000);
      expect(config.dbMaxRetries).toBe(10);
      expect(config.dbRetryInterval).toBe(3000);
    });

    it('should use default values when optional variables are missing', () => {
      delete process.env.JWT_EXPIRE;
      delete process.env.PORT;
      delete process.env.NODE_ENV;
      delete process.env.DB_MAX_RETRIES;
      delete process.env.DB_RETRY_INTERVAL;

      const config = getConfig();

      expect(config.jwtExpire).toBe('7d');
      expect(config.port).toBe(5000);
      expect(config.nodeEnv).toBe('development');
      expect(config.dbMaxRetries).toBe(5);
      expect(config.dbRetryInterval).toBe(5000);
    });

    it('should set environment flags correctly', () => {
      process.env.NODE_ENV = 'production';
      let config = getConfig();
      expect(config.isProduction).toBe(true);
      expect(config.isDevelopment).toBe(false);
      expect(config.isTest).toBe(false);

      process.env.NODE_ENV = 'development';
      config = getConfig();
      expect(config.isProduction).toBe(false);
      expect(config.isDevelopment).toBe(true);
      expect(config.isTest).toBe(false);

      process.env.NODE_ENV = 'test';
      config = getConfig();
      expect(config.isProduction).toBe(false);
      expect(config.isDevelopment).toBe(false);
      expect(config.isTest).toBe(true);
    });

    it('should include Cloudinary configuration', () => {
      const config = getConfig();

      expect(config.cloudinary).toEqual({
        cloudName: 'test-cloud',
        apiKey: 'test-key',
        apiSecret: 'test-secret'
      });
    });
  });
});
