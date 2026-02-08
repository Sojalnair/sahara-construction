const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, checkRole, checkSiteAccess } = require('./auth');
const { getConfig } = require('../config/env');

const config = getConfig();

// Create Express app for testing
const app = express();
app.use(express.json());

// Test routes
app.get('/protected', authenticate, (req, res) => {
  res.json({ success: true, user: req.user });
});

app.get('/admin-only', authenticate, checkRole('Admin'), (req, res) => {
  res.json({ success: true, message: 'Admin access granted' });
});

app.get('/admin-or-supervisor', authenticate, checkRole('Admin', 'Supervisor'), (req, res) => {
  res.json({ success: true, message: 'Access granted' });
});

app.get('/site/:siteId', authenticate, checkSiteAccess(), (req, res) => {
  res.json({ success: true, message: 'Site access granted' });
});

app.post('/site-action', authenticate, checkSiteAccess(), (req, res) => {
  res.json({ success: true, message: 'Site action completed' });
});

describe('Authentication Middleware Integration Tests', () => {
  let adminUser, supervisorUser, accountantUser;
  let adminToken, supervisorToken, accountantToken;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/construction-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear users before each test
    await User.deleteMany({});

    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'Admin',
      isActive: true
    });

    supervisorUser = await User.create({
      name: 'Supervisor User',
      email: 'supervisor@test.com',
      password: 'password123',
      role: 'Supervisor',
      isActive: true,
      assignedSites: [new mongoose.Types.ObjectId('507f1f77bcf86cd799439011')]
    });

    accountantUser = await User.create({
      name: 'Accountant User',
      email: 'accountant@test.com',
      password: 'password123',
      role: 'Accountant',
      isActive: true
    });

    // Generate tokens
    adminToken = jwt.sign({ id: adminUser._id }, config.jwtSecret, { expiresIn: '1h' });
    supervisorToken = jwt.sign({ id: supervisorUser._id }, config.jwtSecret, { expiresIn: '1h' });
    accountantToken = jwt.sign({ id: accountantUser._id }, config.jwtSecret, { expiresIn: '1h' });
  });

  describe('authenticate middleware', () => {
    it('should allow access with valid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('admin@test.com');
    });

    it('should deny access without token', async () => {
      const response = await request(app)
        .get('/protected')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token provided');
    });

    it('should deny access with invalid token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid token');
    });

    it('should deny access with expired token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { id: adminUser._id },
        config.jwtSecret,
        { expiresIn: '0s' }
      );

      // Wait a moment to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should deny access for inactive user', async () => {
      // Deactivate user
      adminUser.isActive = false;
      await adminUser.save();

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('checkRole middleware', () => {
    it('should allow Admin access to admin-only route', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Admin access granted');
    });

    it('should deny Supervisor access to admin-only route', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
      expect(response.body.message).toContain('Admin');
    });

    it('should deny Accountant access to admin-only route', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${accountantToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access denied');
    });

    it('should allow Admin access to multi-role route', async () => {
      const response = await request(app)
        .get('/admin-or-supervisor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow Supervisor access to multi-role route', async () => {
      const response = await request(app)
        .get('/admin-or-supervisor')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny Accountant access to multi-role route', async () => {
      const response = await request(app)
        .get('/admin-or-supervisor')
        .set('Authorization', `Bearer ${accountantToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('checkSiteAccess middleware', () => {
    const assignedSiteId = '507f1f77bcf86cd799439011';
    const unassignedSiteId = '507f1f77bcf86cd799439022';

    it('should allow Admin access to any site', async () => {
      const response = await request(app)
        .get(`/site/${unassignedSiteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow Accountant access to any site', async () => {
      const response = await request(app)
        .get(`/site/${unassignedSiteId}`)
        .set('Authorization', `Bearer ${accountantToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should allow Supervisor access to assigned site', async () => {
      const response = await request(app)
        .get(`/site/${assignedSiteId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny Supervisor access to unassigned site', async () => {
      const response = await request(app)
        .get(`/site/${unassignedSiteId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not assigned to this site');
    });

    it('should check site ID from request body', async () => {
      const response = await request(app)
        .post('/site-action')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ site: assignedSiteId })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should deny access when site ID is missing', async () => {
      const response = await request(app)
        .post('/site-action')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Site ID is required');
    });
  });

  describe('middleware chaining', () => {
    it('should properly chain authenticate and checkRole', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should properly chain authenticate and checkSiteAccess', async () => {
      const response = await request(app)
        .get('/site/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should fail at authenticate if no token provided', async () => {
      const response = await request(app)
        .get('/admin-only')
        .expect(401);

      expect(response.body.message).toContain('No token provided');
    });

    it('should fail at checkRole if wrong role', async () => {
      const response = await request(app)
        .get('/admin-only')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(403);

      expect(response.body.message).toContain('Access denied');
    });
  });
});
