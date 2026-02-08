// Load environment variables first
require('dotenv').config();

const fc = require('fast-check');
const User = require('../models/User');
const { connectDB, closeDB } = require('../config/db');
const { login, generateToken } = require('./authController');

describe('Authentication Controller Property-Based Tests', () => {
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

  describe('Property 1: Valid login credentials return authentication token', () => {
    /**
     * **Validates: Requirements 1.1**
     * 
     * This property test verifies that valid login credentials always return an authentication token.
     * For any valid user with correct credentials:
     * 1. Login should succeed with status 200
     * 2. Response should include success: true
     * 3. Response should include a valid JWT token
     * 4. Token should be a string with 3 parts (header.payload.signature)
     * 5. Response should include user data without password
     * 6. User's lastLogin should be updated
     */
    it('should always return authentication token for valid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate arbitrary valid user data
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 })
              .filter(s => s.trim().length >= 2), // Ensure name is valid after trimming
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 100 })
              .filter(s => s.trim().length >= 6), // Ensure password is valid after trimming
            role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
          }),
          async (userData) => {
            // Create a user in the database
            const user = await User.create({
              name: userData.name,
              email: userData.email,
              password: userData.password,
              role: userData.role
            });

            // Mock request and response objects
            const req = {
              body: {
                email: userData.email,
                password: userData.password
              }
            };

            let responseData = null;
            let statusCode = null;

            const res = {
              status: function(code) {
                statusCode = code;
                return this;
              },
              json: function(data) {
                responseData = data;
                return this;
              }
            };

            // Call the login controller
            await login(req, res);

            // Property 1: Login should succeed with status 200
            expect(statusCode).toBe(200);

            // Property 2: Response should include success: true
            expect(responseData.success).toBe(true);
            expect(responseData.message).toBe('Login successful');

            // Property 3: Response should include a valid JWT token
            expect(responseData.data.token).toBeDefined();
            expect(typeof responseData.data.token).toBe('string');

            // Property 4: Token should have 3 parts (JWT format)
            const tokenParts = responseData.data.token.split('.');
            expect(tokenParts).toHaveLength(3);

            // Property 5: Response should include user data without password
            expect(responseData.data.user).toBeDefined();
            expect(responseData.data.user.id).toBeDefined();
            expect(responseData.data.user.email).toBe(userData.email);
            expect(responseData.data.user.name).toBe(userData.name);
            expect(responseData.data.user.role).toBe(userData.role);
            expect(responseData.data.user.isActive).toBe(true);
            expect(responseData.data.user.password).toBeUndefined();

            // Property 6: User's lastLogin should be updated
            const updatedUser = await User.findById(user._id);
            expect(updatedUser.lastLogin).toBeDefined();
            expect(updatedUser.lastLogin).toBeInstanceOf(Date);

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

    it('should generate unique tokens for different users', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate two different users
          fc.tuple(
            fc.record({
              name: fc.string({ minLength: 2, maxLength: 100 })
                .filter(s => s.trim().length >= 2),
              email: fc.emailAddress(),
              password: fc.string({ minLength: 6, maxLength: 100 })
                .filter(s => s.trim().length >= 6),
              role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
            }),
            fc.record({
              name: fc.string({ minLength: 2, maxLength: 100 })
                .filter(s => s.trim().length >= 2),
              email: fc.emailAddress(),
              password: fc.string({ minLength: 6, maxLength: 100 })
                .filter(s => s.trim().length >= 6),
              role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
            })
          ).filter(([u1, u2]) => u1.email !== u2.email), // Ensure different emails
          async ([user1Data, user2Data]) => {
            // Create two users
            const user1 = await User.create(user1Data);
            const user2 = await User.create(user2Data);

            // Login user 1
            const req1 = {
              body: {
                email: user1Data.email,
                password: user1Data.password
              }
            };

            let response1Data = null;
            const res1 = {
              status: function(code) { return this; },
              json: function(data) {
                response1Data = data;
                return this;
              }
            };

            await login(req1, res1);

            // Login user 2
            const req2 = {
              body: {
                email: user2Data.email,
                password: user2Data.password
              }
            };

            let response2Data = null;
            const res2 = {
              status: function(code) { return this; },
              json: function(data) {
                response2Data = data;
                return this;
              }
            };

            await login(req2, res2);

            // Both should succeed
            expect(response1Data.success).toBe(true);
            expect(response2Data.success).toBe(true);

            // Tokens should be different
            expect(response1Data.data.token).not.toBe(response2Data.data.token);

            // Each token should correspond to the correct user
            expect(response1Data.data.user.email).toBe(user1Data.email);
            expect(response2Data.data.user.email).toBe(user2Data.email);

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

    it('should reject invalid credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate user data and a different password
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 })
              .filter(s => s.trim().length >= 2),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 100 })
              .filter(s => s.trim().length >= 6),
            role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
          }),
          fc.string({ minLength: 6, maxLength: 100 })
            .filter(s => s.trim().length >= 6), // Wrong password
          async (userData, wrongPassword) => {
            // Skip if wrong password happens to match
            if (wrongPassword === userData.password) {
              return;
            }

            // Create a user
            const user = await User.create(userData);

            // Try to login with wrong password
            const req = {
              body: {
                email: userData.email,
                password: wrongPassword
              }
            };

            let responseData = null;
            let statusCode = null;

            const res = {
              status: function(code) {
                statusCode = code;
                return this;
              },
              json: function(data) {
                responseData = data;
                return this;
              }
            };

            await login(req, res);

            // Should fail with 401
            expect(statusCode).toBe(401);
            expect(responseData.success).toBe(false);
            expect(responseData.message).toBe('Invalid credentials');
            expect(responseData.data).toBeUndefined();

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

    it('should reject login for inactive users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 2, maxLength: 100 })
              .filter(s => s.trim().length >= 2),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 6, maxLength: 100 })
              .filter(s => s.trim().length >= 6),
            role: fc.constantFrom('Admin', 'Supervisor', 'Accountant')
          }),
          async (userData) => {
            // Create an inactive user
            const user = await User.create({
              ...userData,
              isActive: false
            });

            // Try to login
            const req = {
              body: {
                email: userData.email,
                password: userData.password
              }
            };

            let responseData = null;
            let statusCode = null;

            const res = {
              status: function(code) {
                statusCode = code;
                return this;
              },
              json: function(data) {
                responseData = data;
                return this;
              }
            };

            await login(req, res);

            // Should fail with 403
            expect(statusCode).toBe(403);
            expect(responseData.success).toBe(false);
            expect(responseData.message).toBe('Account is deactivated. Please contact administrator.');
            expect(responseData.data).toBeUndefined();

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

    it('should reject login with missing credentials', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 100 }),
          fc.boolean(), // Randomly choose which field to omit
          async (email, password, omitEmail) => {
            const req = {
              body: omitEmail ? { password } : { email }
            };

            let responseData = null;
            let statusCode = null;

            const res = {
              status: function(code) {
                statusCode = code;
                return this;
              },
              json: function(data) {
                responseData = data;
                return this;
              }
            };

            await login(req, res);

            // Should fail with 400
            expect(statusCode).toBe(400);
            expect(responseData.success).toBe(false);
            expect(responseData.message).toBe('Please provide email and password');
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });

    it('should reject login for non-existent users', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 6, maxLength: 100 }),
          async (email, password) => {
            // Ensure no user exists with this email
            await User.deleteMany({ email });

            const req = {
              body: { email, password }
            };

            let responseData = null;
            let statusCode = null;

            const res = {
              status: function(code) {
                statusCode = code;
                return this;
              },
              json: function(data) {
                responseData = data;
                return this;
              }
            };

            await login(req, res);

            // Should fail with 401
            expect(statusCode).toBe(401);
            expect(responseData.success).toBe(false);
            expect(responseData.message).toBe('Invalid credentials');
            expect(responseData.data).toBeUndefined();
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });
  });

  describe('Token Generation Properties', () => {
    it('should generate valid JWT tokens for any user ID', async () => {
      await fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (userId) => {
            const token = generateToken(userId);

            // Token should be a string
            expect(typeof token).toBe('string');

            // Token should have 3 parts (JWT format)
            const parts = token.split('.');
            expect(parts).toHaveLength(3);

            // Each part should be non-empty
            expect(parts[0].length).toBeGreaterThan(0);
            expect(parts[1].length).toBeGreaterThan(0);
            expect(parts[2].length).toBeGreaterThan(0);
          }
        ),
        {
          numRuns: 50
        }
      );
    });

    it('should generate different tokens for different user IDs', async () => {
      await fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 100 }),
            fc.string({ minLength: 1, maxLength: 100 })
          ).filter(([id1, id2]) => id1 !== id2),
          ([userId1, userId2]) => {
            const token1 = generateToken(userId1);
            const token2 = generateToken(userId2);

            // Tokens should be different
            expect(token1).not.toBe(token2);
          }
        ),
        {
          numRuns: 20
        }
      );
    });
  });
});
