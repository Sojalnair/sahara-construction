// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');
const fc = require('fast-check');
const User = require('./User');
const { connectDB, closeDB } = require('../config/db');

describe('User Model Property-Based Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    // Clean up the User collection before each test
    await User.deleteMany({});
  });

  describe('Property 4: Passwords are hashed in storage', () => {
    /**
     * **Validates: Requirements 1.8**
     * 
     * This property test verifies that passwords are never stored in plain text.
     * For any valid password string, when a user is created:
     * 1. The stored password must be different from the plain text password
     * 2. The stored password must be a valid bcrypt hash
     * 3. The comparePassword method must return true for the original password
     * 4. The comparePassword method must return false for different passwords
     */
    it('should always hash passwords before storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary password strings (6-100 characters)
          fc.string({ minLength: 6, maxLength: 100 }),
          // Generate arbitrary user data
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 }),
            email: fc.emailAddress(),
            role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
          }),
          async (password, userData) => {
            // Create a user with the generated password
            const user = await User.create({
              ...userData,
              password: password
            });

            // Fetch the user from database with password field
            const savedUser = await User.findById(user._id).select('+password');

            // Property 1: Password must be hashed (not equal to plain text)
            expect(savedUser.password).not.toBe(password);

            // Property 2: Hashed password must be a valid bcrypt hash
            // bcrypt hashes start with $2a$, $2b$, or $2y$ and are 60 characters long
            expect(savedUser.password).toMatch(/^\$2[aby]\$\d{2}\$.{53}$/);
            expect(savedUser.password.length).toBe(60);

            // Property 3: comparePassword must return true for correct password
            const isCorrectPassword = await savedUser.comparePassword(password);
            expect(isCorrectPassword).toBe(true);

            // Property 4: comparePassword must return false for incorrect password
            const wrongPassword = password + 'wrong';
            const isWrongPassword = await savedUser.comparePassword(wrongPassword);
            expect(isWrongPassword).toBe(false);

            // Clean up
            await User.deleteOne({ _id: user._id });
          }
        ),
        {
          numRuns: 20, // Run 20 test cases with different random inputs
          timeout: 30000 // 30 second timeout for async operations
        }
      );
    });

    it('should hash different passwords to different hashes', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different passwords
          fc.tuple(
            fc.string({ minLength: 6, maxLength: 100 }),
            fc.string({ minLength: 6, maxLength: 100 })
          ).filter(([p1, p2]) => p1 !== p2), // Ensure passwords are different
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 }),
            role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
          }),
          async ([password1, password2], userData) => {
            // Create first user
            const user1 = await User.create({
              ...userData,
              email: `user1-${Date.now()}-${Math.random()}@example.com`,
              password: password1
            });

            // Create second user
            const user2 = await User.create({
              ...userData,
              email: `user2-${Date.now()}-${Math.random()}@example.com`,
              password: password2
            });

            // Fetch users with passwords
            const savedUser1 = await User.findById(user1._id).select('+password');
            const savedUser2 = await User.findById(user2._id).select('+password');

            // Different passwords should produce different hashes
            expect(savedUser1.password).not.toBe(savedUser2.password);

            // Each user should only match their own password
            expect(await savedUser1.comparePassword(password1)).toBe(true);
            expect(await savedUser1.comparePassword(password2)).toBe(false);
            expect(await savedUser2.comparePassword(password2)).toBe(true);
            expect(await savedUser2.comparePassword(password1)).toBe(false);

            // Clean up
            await User.deleteMany({ _id: { $in: [user1._id, user2._id] } });
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });

    it('should re-hash password when password field is updated', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate original and new passwords
          fc.tuple(
            fc.string({ minLength: 6, maxLength: 100 }),
            fc.string({ minLength: 6, maxLength: 100 })
          ).filter(([p1, p2]) => p1 !== p2), // Ensure passwords are different
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 }),
            email: fc.emailAddress(),
            role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
          }),
          async ([originalPassword, newPassword], userData) => {
            // Create user with original password
            const user = await User.create({
              ...userData,
              password: originalPassword
            });

            // Get the original hashed password
            const userWithPassword = await User.findById(user._id).select('+password');
            const originalHash = userWithPassword.password;

            // Update password
            userWithPassword.password = newPassword;
            await userWithPassword.save();

            // Fetch updated user
            const updatedUser = await User.findById(user._id).select('+password');

            // New password should be hashed
            expect(updatedUser.password).not.toBe(newPassword);

            // New hash should be different from original hash
            expect(updatedUser.password).not.toBe(originalHash);

            // Should match new password, not original
            expect(await updatedUser.comparePassword(newPassword)).toBe(true);
            expect(await updatedUser.comparePassword(originalPassword)).toBe(false);

            // Clean up
            await User.deleteOne({ _id: user._id });
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });

    it('should not re-hash password when other fields are updated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 6, maxLength: 100 }),
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 }),
            email: fc.emailAddress(),
            role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
          }),
          fc.string({ minLength: 2, maxLength: 100 }), // New name
          async (password, userData, newName) => {
            // Create user
            const user = await User.create({
              ...userData,
              password: password
            });

            // Get the hashed password
            const userWithPassword = await User.findById(user._id).select('+password');
            const originalHash = userWithPassword.password;

            // Update only the name (not password)
            userWithPassword.name = newName;
            await userWithPassword.save();

            // Fetch updated user
            const updatedUser = await User.findById(user._id).select('+password');

            // Password hash should remain unchanged
            expect(updatedUser.password).toBe(originalHash);

            // Should still match original password
            expect(await updatedUser.comparePassword(password)).toBe(true);

            // Clean up
            await User.deleteOne({ _id: user._id });
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });
  });
});
