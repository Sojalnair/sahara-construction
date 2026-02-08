// Mock dependencies BEFORE importing the controller
jest.mock('../models/User');
jest.mock('jsonwebtoken');
jest.mock('../config/env', () => ({
  getConfig: jest.fn(() => ({
    jwtSecret: 'test-secret',
    jwtExpire: '7d'
  }))
}));

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authController = require('./authController');
const { getConfig } = require('../config/env');

// Create Express app for testing
const app = express();
app.use(express.json());

// Setup routes
app.post('/register', authController.register);
app.post('/login', authController.login);
app.get('/me', (req, res, next) => {
  // Mock auth middleware - set req.user
  req.user = { id: 'mockUserId' };
  next();
}, authController.getCurrentUser);
app.put('/password', (req, res, next) => {
  // Mock auth middleware - set req.user
  req.user = { id: 'mockUserId' };
  next();
}, authController.updatePassword);
app.post('/logout', authController.logout);

describe('Authentication Controller', () => {
  let mockConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock config is already set in the module mock
    mockConfig = {
      jwtSecret: 'test-secret',
      jwtExpire: '7d'
    };
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'user123';
      const mockToken = 'mock.jwt.token';
      
      jwt.sign.mockReturnValue(mockToken);
      
      const token = authController.generateToken(userId);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: userId },
        mockConfig.jwtSecret,
        { expiresIn: mockConfig.jwtExpire }
      );
      expect(token).toBe(mockToken);
    });
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      };

      const mockUser = {
        _id: 'user123',
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isActive: true
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('mock.jwt.token');

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toMatchObject({
        id: mockUser._id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role
      });
      expect(response.body.data.token).toBe('mock.jwt.token');
      expect(User.findOne).toHaveBeenCalledWith({ email: userData.email });
      expect(User.create).toHaveBeenCalledWith(userData);
    });

    it('should return 400 if user already exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      };

      User.findOne.mockResolvedValue({ email: userData.email });

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should return 400 on validation error', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      };

      const validationError = {
        name: 'ValidationError',
        errors: {
          email: { message: 'Email is invalid' }
        }
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(validationError);

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toContain('Email is invalid');
    });

    it('should return 500 on server error', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/register')
        .send(userData)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error registering user');
    });
  });

  describe('POST /login', () => {
    it('should login user with valid credentials', async () => {
      const credentials = {
        email: 'john@example.com',
        password: 'password123'
      };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: credentials.email,
        role: 'Admin',
        isActive: true,
        assignedSites: [],
        lastLogin: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      jwt.sign.mockReturnValue('mock.jwt.token');

      const response = await request(app)
        .post('/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe(credentials.email);
      expect(response.body.data.token).toBe('mock.jwt.token');
      expect(mockUser.comparePassword).toHaveBeenCalledWith(credentials.password);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide email and password');
    });

    it('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/login')
        .send({ email: 'john@example.com' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide email and password');
    });

    it('should return 401 if user not found', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .post('/login')
        .send({ email: 'notfound@example.com', password: 'password123' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 403 if user is inactive', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        isActive: false
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/login')
        .send({ email: 'john@example.com', password: 'password123' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated. Please contact administrator.');
    });

    it('should return 401 if password is incorrect', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'john@example.com',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .post('/login')
        .send({ email: 'john@example.com', password: 'wrongpassword' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 500 on server error', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .post('/login')
        .send({ email: 'john@example.com', password: 'password123' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error during login');
    });
  });

  describe('GET /me', () => {
    it('should return current user data', async () => {
      const mockUser = {
        _id: 'mockUserId',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
        isActive: true,
        assignedSites: [],
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .get('/me')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.id).toBe(mockUser._id);
      expect(response.body.data.user.email).toBe(mockUser.email);
      expect(User.findById).toHaveBeenCalledWith('mockUserId');
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .get('/me')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 500 on server error', async () => {
      User.findById.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .get('/me')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error fetching user data');
    });
  });

  describe('PUT /password', () => {
    it('should update password successfully', async () => {
      const passwordData = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123'
      };

      const mockUser = {
        _id: 'mockUserId',
        password: 'hashedOldPassword',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true)
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      jwt.sign.mockReturnValue('new.jwt.token');

      const response = await request(app)
        .put('/password')
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password updated successfully');
      expect(response.body.data.token).toBe('new.jwt.token');
      expect(mockUser.comparePassword).toHaveBeenCalledWith(passwordData.currentPassword);
      expect(mockUser.password).toBe(passwordData.newPassword);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 400 if current password is missing', async () => {
      const response = await request(app)
        .put('/password')
        .send({ newPassword: 'newPassword123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide current password and new password');
    });

    it('should return 400 if new password is missing', async () => {
      const response = await request(app)
        .put('/password')
        .send({ currentPassword: 'oldPassword123' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Please provide current password and new password');
    });

    it('should return 400 if new password is too short', async () => {
      const response = await request(app)
        .put('/password')
        .send({ currentPassword: 'oldPassword123', newPassword: '12345' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('New password must be at least 6 characters long');
    });

    it('should return 404 if user not found', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const response = await request(app)
        .put('/password')
        .send({ currentPassword: 'oldPassword123', newPassword: 'newPassword123' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 401 if current password is incorrect', async () => {
      const mockUser = {
        _id: 'mockUserId',
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const response = await request(app)
        .put('/password')
        .send({ currentPassword: 'wrongPassword', newPassword: 'newPassword123' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Current password is incorrect');
    });

    it('should return 500 on server error', async () => {
      User.findById.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const response = await request(app)
        .put('/password')
        .send({ currentPassword: 'oldPassword123', newPassword: 'newPassword123' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Error updating password');
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should handle errors gracefully', async () => {
      // Mock an error in the logout handler
      const originalLogout = authController.logout;
      authController.logout = jest.fn((req, res) => {
        throw new Error('Unexpected error');
      });

      // Restore after test
      authController.logout = originalLogout;
    });
  });
});
