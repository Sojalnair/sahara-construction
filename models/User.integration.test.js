const mongoose = require('mongoose');
const User = require('./User');
const { connectDB, disconnectDB } = require('../config/db');

describe('User Model Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    // Clean up the User collection before each test
    await User.deleteMany({});
  });

  describe('Password Hashing Integration', () => {
    it('should hash password when creating a new user', async () => {
      const plainPassword = 'password123';
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: plainPassword,
        role: 'Admin'
      };

      const user = await User.create(userData);

      // Password should be hashed (not equal to plain password)
      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toBeDefined();
      expect(user.password.length).toBeGreaterThan(plainPassword.length);

      // Should be able to compare password
      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);

      // Wrong password should not match
      const isWrongMatch = await user.comparePassword('wrongPassword');
      expect(isWrongMatch).toBe(false);
    });

    it('should hash password when updating password field', async () => {
      const user = await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'oldPassword123',
        role: 'Supervisor'
      });

      const oldHashedPassword = user.password;

      // Update password
      user.password = 'newPassword456';
      await user.save();

      // Password should be re-hashed
      expect(user.password).not.toBe('newPassword456');
      expect(user.password).not.toBe(oldHashedPassword);

      // Should be able to compare with new password
      const isMatch = await user.comparePassword('newPassword456');
      expect(isMatch).toBe(true);

      // Old password should not match
      const isOldMatch = await user.comparePassword('oldPassword123');
      expect(isOldMatch).toBe(false);
    });

    it('should not re-hash password when updating other fields', async () => {
      const user = await User.create({
        name: 'Bob Smith',
        email: 'bob@example.com',
        password: 'password123',
        role: 'Accountant'
      });

      const hashedPassword = user.password;

      // Update name only
      user.name = 'Robert Smith';
      await user.save();

      // Password should remain the same
      expect(user.password).toBe(hashedPassword);

      // Should still be able to compare with original password
      const isMatch = await user.comparePassword('password123');
      expect(isMatch).toBe(true);
    });
  });

  describe('Email Uniqueness', () => {
    it('should enforce unique email constraint', async () => {
      await User.create({
        name: 'User One',
        email: 'duplicate@example.com',
        password: 'password123',
        role: 'Admin'
      });

      // Attempt to create another user with the same email
      await expect(
        User.create({
          name: 'User Two',
          email: 'duplicate@example.com',
          password: 'password456',
          role: 'Supervisor'
        })
      ).rejects.toThrow();
    });
  });

  describe('Indexes', () => {
    it('should have created indexes on email and role', async () => {
      const indexes = await User.collection.getIndexes();

      // Check for email index
      expect(indexes).toHaveProperty('email_1');

      // Check for role index
      expect(indexes).toHaveProperty('role_1');

      // Check for isActive index
      expect(indexes).toHaveProperty('isActive_1');
    });
  });

  describe('Password Selection', () => {
    it('should not include password in query results by default', async () => {
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Admin'
      });

      const user = await User.findOne({ email: 'test@example.com' });

      expect(user.password).toBeUndefined();
    });

    it('should include password when explicitly selected', async () => {
      await User.create({
        name: 'Test User',
        email: 'test2@example.com',
        password: 'password123',
        role: 'Admin'
      });

      const user = await User.findOne({ email: 'test2@example.com' }).select(
        '+password'
      );

      expect(user.password).toBeDefined();
      expect(user.password).not.toBe('password123'); // Should be hashed
    });
  });

  describe('Role Validation', () => {
    it('should accept valid roles', async () => {
      const roles = ['Admin', 'Supervisor', 'Accountant'];

      for (const role of roles) {
        const user = await User.create({
          name: `${role} User`,
          email: `${role.toLowerCase()}@example.com`,
          password: 'password123',
          role: role
        });

        expect(user.role).toBe(role);
      }
    });

    it('should reject invalid roles', async () => {
      await expect(
        User.create({
          name: 'Invalid User',
          email: 'invalid@example.com',
          password: 'password123',
          role: 'InvalidRole'
        })
      ).rejects.toThrow();
    });
  });

  describe('Assigned Sites', () => {
    it('should initialize assignedSites as empty array', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'sites@example.com',
        password: 'password123',
        role: 'Supervisor'
      });

      expect(user.assignedSites).toEqual([]);
      expect(Array.isArray(user.assignedSites)).toBe(true);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'timestamps@example.com',
        password: 'password123',
        role: 'Admin'
      });

      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'update@example.com',
        password: 'password123',
        role: 'Admin'
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      user.name = 'Updated Name';
      await user.save();

      expect(user.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});
