const request = require('supertest');

// Set test environment before requiring app
process.env.NODE_ENV = 'test';
process.env.MONGODB_TEST_URI = 'mongodb://localhost:27017/construction-management-test';
process.env.JWT_SECRET = 'test-secret-key-with-sufficient-length-32chars';

// Mock the database connection to avoid hanging
jest.mock('./config/db', () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  closeDB: jest.fn().mockResolvedValue(undefined),
  getConnectionState: jest.fn().mockReturnValue('disconnected')
}));

// Mock Cloudinary configuration
jest.mock('./config/cloudinary', () => ({
  configureCloudinary: jest.fn().mockReturnValue(true),
  uploadImage: jest.fn(),
  deleteImage: jest.fn(),
  cloudinary: {}
}));

const app = require('./server');

describe('Server', () => {
  describe('Health Check', () => {
    it('should return 200 OK for health endpoint', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Root Endpoint', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Construction Management System API');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('status', 'running');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/non-existent-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Route not found');
    });
  });

  describe('Middleware', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/test-json')
        .send({ test: 'data' })
        .set('Content-Type', 'application/json');
      
      // Should get 404 since route doesn't exist, but JSON should be parsed
      expect(response.status).toBe(404);
    });

    it('should have CORS enabled', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
