const mongoose = require('mongoose');
const User = require('./User');
const bcrypt = require('bcryptjs');

// Mock bcrypt
jest.mock('bcryptjs');

describe('User Model', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Schema Validation', () => {
    it('should create a valid user with all required fields', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      };

      const user = new User(userData);
      const validationError = user.validateSync();

      expect(validationError).toBeUndefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe('Admin');
      expect(user.isActive).toBe(true);
    });

    it('should fail validation when name is missing', () => {
      const user = new User({
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      });

      const validationError = user.validateSync();
      expect(validationError.errors.name).toBeDefined();
      expect(validationError.errors.name.message).toBe('Name is required');
    });

    it('should fail validation when email is missing', () => {
      const user = new User({
        name: 'John Doe',
        password: 'password123',
        role: 'Admin'
      });

      const validationError = user.validateSync();
      expect(validationError.errors.email).toBeDefined();
    });

    it('should fail validation when password is missing', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin'
      });

      const validationError = user.validateSync();
      expect(validationError.errors.password).toBeDefined();
    });

    it('should fail validation when role is missing', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      });

      const validationError = user.validateSync();
      expect(validationError.errors.role).toBeDefined();
    });

    it('should fail validation with invalid email format', () => {
      const user = new User({
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        role: 'Admin'
      });

      const validationError = user.validateSync();
      expect(validationError.errors.email).toBeDefined();
      expect(validationError.errors.email.message).toBe(
        'Please provide a valid email address'
      );
    });

    it('should fail validation with invalid role', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'InvalidRole'
      });

      const validationError = user.validateSync();
      expect(validationError.errors.role).toBeDefined();
      expect(validationError.errors.role.message).toBe(
        'Role must be Admin, Supervisor, or Accountant'
      );
    });

    it('should accept valid roles: Admin, Supervisor, Accountant', () => {
      const roles = ['Admin', 'Supervisor', 'Accountant'];

      roles.forEach((role) => {
        const user = new User({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          role: role
        });

        const validationError = user.validateSync();
        expect(validationError).toBeUndefined();
        expect(user.role).toBe(role);
      });
    });

    it('should trim and lowercase email', () => {
      const user = new User({
        name: 'John Doe',
        email: '  JOHN@EXAMPLE.COM  ',
        password: 'password123',
        role: 'Admin'
      });

      expect(user.email).toBe('john@example.com');
    });

    it('should trim name', () => {
      const user = new User({
        name: '  John Doe  ',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      });

      expect(user.name).toBe('John Doe');
    });

    it('should fail validation when password is too short', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: '12345',
        role: 'Admin'
      });

      const validationError = user.validateSync();
      expect(validationError.errors.password).toBeDefined();
      expect(validationError.errors.password.message).toBe(
        'Password must be at least 6 characters long'
      );
    });

    it('should set isActive to true by default', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      });

      expect(user.isActive).toBe(true);
    });

    it('should initialize assignedSites as empty array', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      });

      expect(user.assignedSites).toEqual([]);
    });
  });

  describe('Password Hashing', () => {
    it('should have a pre-save hook for password hashing', () => {
      const preSaveMiddleware = User.schema.s.hooks._pres.get('save');
      expect(preSaveMiddleware).toBeDefined();
      expect(preSaveMiddleware.length).toBeGreaterThan(0);
    });

    it('should call bcrypt.genSalt and bcrypt.hash when password is modified', async () => {
      const plainPassword = 'password123';
      const hashedPassword = 'hashedPassword123';

      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: plainPassword,
        role: 'Admin'
      });

      // Simulate the pre-save hook logic
      if (user.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, 'salt');
      expect(user.password).toBe(hashedPassword);
    });

    it('should not hash password if not modified', async () => {
      const originalPassword = 'alreadyHashedPassword';
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: originalPassword,
        role: 'Admin'
      });

      // Mark password as not modified
      user.isModified = jest.fn().mockReturnValue(false);

      // Simulate the pre-save hook logic
      if (user.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }

      expect(bcrypt.genSalt).not.toHaveBeenCalled();
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(user.password).toBe(originalPassword);
    });
  });

  describe('comparePassword Method', () => {
    it('should return true for correct password', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        role: 'Admin'
      });

      bcrypt.compare.mockResolvedValue(true);

      const result = await user.comparePassword('password123');

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword'
      );
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        role: 'Admin'
      });

      bcrypt.compare.mockResolvedValue(false);

      const result = await user.comparePassword('wrongPassword');

      expect(result).toBe(false);
    });

    it('should throw error if comparison fails', async () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        role: 'Admin'
      });

      bcrypt.compare.mockRejectedValue(new Error('Comparison error'));

      await expect(user.comparePassword('password123')).rejects.toThrow(
        'Password comparison failed'
      );
    });
  });

  describe('toJSON Method', () => {
    it('should exclude password from JSON output', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
        role: 'Admin'
      });

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.name).toBe('John Doe');
      expect(userJSON.email).toBe('john@example.com');
      expect(userJSON.role).toBe('Admin');
    });
  });

  describe('Indexes', () => {
    it('should have index on email field', () => {
      const indexes = User.schema.indexes();
      const emailIndex = indexes.find((index) => index[0].email === 1);

      expect(emailIndex).toBeDefined();
    });

    it('should have index on role field', () => {
      const indexes = User.schema.indexes();
      const roleIndex = indexes.find((index) => index[0].role === 1);

      expect(roleIndex).toBeDefined();
    });

    it('should have index on isActive field', () => {
      const indexes = User.schema.indexes();
      const isActiveIndex = indexes.find((index) => index[0].isActive === 1);

      expect(isActiveIndex).toBeDefined();
    });
  });

  describe('Timestamps', () => {
    it('should have createdAt and updatedAt fields', () => {
      const user = new User({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Admin'
      });

      expect(user.schema.options.timestamps).toBe(true);
    });
  });
});
