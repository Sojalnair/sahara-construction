// Mock dependencies BEFORE importing the middleware
jest.mock('../models/User');
jest.mock('jsonwebtoken');
jest.mock('../config/env', () => ({
  getConfig: jest.fn(() => ({
    jwtSecret: 'test-secret',
    jwtExpire: '7d'
  }))
}));

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, checkRole, checkSiteAccess } = require('./auth');

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock request, response, and next
    req = {
      headers: {},
      params: {},
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  describe('authenticate', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
        isActive: true
      };

      req.headers.authorization = 'Bearer valid.jwt.token';
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authenticate(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid.jwt.token', 'test-secret');
      expect(User.findById).toHaveBeenCalledWith('user123');
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 401 if no authorization header', async () => {
      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic sometoken';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is empty', async () => {
      req.headers.authorization = 'Bearer ';

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is expired', async () => {
      req.headers.authorization = 'Bearer expired.jwt.token';
      
      const expiredError = new Error('jwt expired');
      expiredError.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw expiredError;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has expired. Please log in again.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid.jwt.token';
      
      const invalidError = new Error('invalid token');
      invalidError.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw invalidError;
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid token. Authorization denied.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user not found', async () => {
      req.headers.authorization = 'Bearer valid.jwt.token';
      jwt.verify.mockReturnValue({ id: 'nonexistent' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found. Authorization denied.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user is inactive', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin',
        isActive: false
      };

      req.headers.authorization = 'Bearer valid.jwt.token';
      jwt.verify.mockReturnValue({ id: 'user123' });
      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', async () => {
      req.headers.authorization = 'Bearer valid.jwt.token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication failed',
        error: 'Unexpected error'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('checkRole', () => {
    it('should allow access if user has required role', () => {
      req.user = {
        _id: 'user123',
        role: 'Admin'
      };

      const middleware = checkRole('Admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access if user has one of multiple allowed roles', () => {
      req.user = {
        _id: 'user123',
        role: 'Supervisor'
      };

      const middleware = checkRole('Admin', 'Supervisor');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access if user does not have required role', () => {
      req.user = {
        _id: 'user123',
        role: 'Supervisor'
      };

      const middleware = checkRole('Admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required role: Admin. Your role: Supervisor'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      // req.user is not set

      const middleware = checkRole('Admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please log in.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle multiple roles in error message', () => {
      req.user = {
        _id: 'user123',
        role: 'Accountant'
      };

      const middleware = checkRole('Admin', 'Supervisor');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required role: Admin or Supervisor. Your role: Accountant'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', () => {
      req.user = {
        _id: 'user123',
        role: 'Admin'
      };

      // Force an error by making next throw
      next.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const middleware = checkRole('Admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authorization check failed',
        error: 'Unexpected error'
      });
    });
  });

  describe('checkSiteAccess', () => {
    it('should allow Admin access to any site', async () => {
      req.user = {
        _id: 'user123',
        role: 'Admin',
        assignedSites: []
      };
      req.params.siteId = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow Accountant access to any site', async () => {
      req.user = {
        _id: 'user123',
        role: 'Accountant',
        assignedSites: []
      };
      req.params.siteId = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow Supervisor access to assigned site', async () => {
      req.user = {
        _id: 'user123',
        role: 'Supervisor',
        assignedSites: ['site123', 'site456']
      };
      req.params.siteId = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny Supervisor access to unassigned site', async () => {
      req.user = {
        _id: 'user123',
        role: 'Supervisor',
        assignedSites: ['site456']
      };
      req.params.siteId = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. You are not assigned to this site.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should get site ID from request body if not in params', async () => {
      req.user = {
        _id: 'user123',
        role: 'Supervisor',
        assignedSites: ['site123']
      };
      req.body.site = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should get site ID from body.siteId if not in params or body.site', async () => {
      req.user = {
        _id: 'user123',
        role: 'Supervisor',
        assignedSites: ['site123']
      };
      req.body.siteId = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should use custom site parameter name', async () => {
      req.user = {
        _id: 'user123',
        role: 'Supervisor',
        assignedSites: ['site123']
      };
      req.params.customSiteId = 'site123';

      const middleware = checkSiteAccess('customSiteId');
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 if site ID is missing', async () => {
      req.user = {
        _id: 'user123',
        role: 'Supervisor',
        assignedSites: ['site123']
      };
      // No siteId in params or body

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Site ID is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      // req.user is not set
      req.params.siteId = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required. Please log in.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for unrecognized role', async () => {
      req.user = {
        _id: 'user123',
        role: 'UnknownRole',
        assignedSites: []
      };
      req.params.siteId = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid role.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 500 on unexpected error', async () => {
      req.user = {
        _id: 'user123',
        role: 'Admin',
        assignedSites: []
      };
      req.params.siteId = 'site123';

      // Force an error by making next throw
      next.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Site access check failed',
        error: 'Unexpected error'
      });
    });

    it('should handle ObjectId comparison correctly', async () => {
      // Simulate MongoDB ObjectId behavior
      const mockObjectId = {
        toString: () => 'site123'
      };

      req.user = {
        _id: 'user123',
        role: 'Supervisor',
        assignedSites: [mockObjectId]
      };
      req.params.siteId = 'site123';

      const middleware = checkSiteAccess();
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});
