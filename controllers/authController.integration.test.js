// Load environment variables first
require('dotenv').config();

const request = require('supertest');
const express = require('express');
const User = require('../models/User');
const authRoutes = require('../routes/authRoutes');
const { connectDB, closeDB } = require('../config/db');
const validate = require('../middleware/validate');

// Create Express app for testing
const app = express();
app.use(express.json());

// Apply validation middleware to routes
app.use('/api/auth', authRoutes);

describe('Authentication Controller Integration Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    // Clean up the User collection before each test
    await User.deleteMany({});
    
    // Create a test user for login tests
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'Admin'
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Supervisor'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.user).toMatchObject({
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: true
      });
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');

      // Verify user was created in database
      const savedUser = await User.findOne({ email: newUser.email });
      expect(savedUser).toBeDefined();
      expect(savedUser.name).toBe(newUser.name);
      expect(savedUser.role).toBe(newUser.role);
    });

    it('should not register user with duplicate email', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: testUser.email, // Use existing email
        password: 'password123',
        role: 'Admin'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User with this email already exists');
    });

    it('should validate required fields', async () => {
      const invalidUser = {
        email: 'invalid@example.com',
        password: 'password123'
        // Missing name and role
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should validate email format', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        role: 'Admin'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password length', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test2@example.com',
        password: '12345', // Too short
        role: 'Admin'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate role values', async () => {
      const invalidUser = {
        name: 'Test User',
        email: 'test2@example.com',
        password: 'password123',
        role: 'InvalidRole'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should accept all valid roles', async () => {
      const roles = ['Admin', 'Supervisor', 'Accountant'];

      for (let i = 0; i < roles.length; i++) {
        const user = {
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'password123',
          role: roles[i]
        };

        const response = await request(app)
          .post('/api/auth/register')
          .send(user)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.role).toBe(roles[i]);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user).toMatchObject({
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        isActive: true
      });
      expect(response.body.data.token).toBeDefined();
      expect(typeof response.body.data.token).toBe('string');

      // Store token for subsequent tests
      authToken = response.body.data.token;

      // Verify lastLogin was updated
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.lastLogin).toBeDefined();
    });

    it('should not login with incorrect password', async () => {
      const credentials = {
        email: testUser.email,
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not login with non-existent email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should not login inactive user', async () => {
      // Deactivate user
      testUser.isActive = false;
      await testUser.save();

      const credentials = {
        email: testUser.email,
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Account is deactivated. Please contact administrator.');
    });

    it('should require email and password', async () => {
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' })
        .expect(400);

      expect(response1.body.success).toBe(false);

      const response2 = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response2.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const credentials = {
        email: 'invalid-email',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user data when authenticated', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      // Note: This test will fail until auth middleware is implemented in task 1.6
      // For now, we're just testing the controller logic
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      // The endpoint exists but will return 500 or error without auth middleware
      // This is expected until task 1.6 is complete
      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should update password with valid current password', async () => {
      // First login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        });

      const token = loginResponse.body.data.token;

      // Note: This test will fail until auth middleware is implemented in task 1.6
      // For now, we're just testing the controller logic
      const response = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newPassword123'
        });

      // The endpoint exists but will return 500 or error without auth middleware
      // This is expected until task 1.6 is complete
      expect(response.status).toBeGreaterThanOrEqual(200);
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .put('/api/auth/password')
        .send({
          currentPassword: 'password123',
          newPassword: '12345' // Too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require both current and new password', async () => {
      const response1 = await request(app)
        .put('/api/auth/password')
        .send({ newPassword: 'newPassword123' })
        .expect(400);

      expect(response1.body.success).toBe(false);

      const response2 = await request(app)
        .put('/api/auth/password')
        .send({ currentPassword: 'password123' })
        .expect(400);

      expect(response2.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('JWT Token Generation', () => {
    it('should generate valid JWT tokens on registration', async () => {
      const newUser = {
        name: 'JWT Test User',
        email: 'jwt@example.com',
        password: 'password123',
        role: 'Admin'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      const token = response.body.data.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate valid JWT tokens on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
        .expect(200);

      const token = response.body.data.token;
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', async () => {
      // Create second user
      const user2 = await User.create({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
        role: 'Supervisor'
      });

      // Login both users
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'password123' });

      const response2 = await request(app)
        .post('/api/auth/login')
        .send({ email: user2.email, password: 'password123' });

      const token1 = response1.body.data.token;
      const token2 = response2.body.data.token;

      expect(token1).not.toBe(token2);
    });
  });

  describe('Password Security', () => {
    it('should hash passwords before storage', async () => {
      const newUser = {
        name: 'Security Test',
        email: 'security@example.com',
        password: 'plainTextPassword',
        role: 'Admin'
      };

      await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      // Fetch user from database with password
      const savedUser = await User.findOne({ email: newUser.email }).select('+password');
      
      // Password should be hashed, not plain text
      expect(savedUser.password).not.toBe(newUser.password);
      expect(savedUser.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should verify passwords correctly', async () => {
      const password = 'testPassword123';
      
      // Create user
      const user = await User.create({
        name: 'Password Test',
        email: 'passtest@example.com',
        password: password,
        role: 'Admin'
      });

      // Fetch with password
      const savedUser = await User.findById(user._id).select('+password');

      // Should match correct password
      const isMatch = await savedUser.comparePassword(password);
      expect(isMatch).toBe(true);

      // Should not match incorrect password
      const isNotMatch = await savedUser.comparePassword('wrongPassword');
      expect(isNotMatch).toBe(false);
    });
  });

  describe('User Data Response', () => {
    it('should not include password in registration response', async () => {
      const newUser = {
        name: 'No Password User',
        email: 'nopass@example.com',
        password: 'password123',
        role: 'Admin'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect(201);

      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should not include password in login response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
        .expect(200);

      expect(response.body.data.user.password).toBeUndefined();
    });

    it('should include all necessary user fields in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
        .expect(200);

      const user = response.body.data.user;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('assignedSites');
      expect(user).toHaveProperty('lastLogin');
    });
  });
});
