const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getConfig } = require('../config/env');

const config = getConfig();

/**
 * Middleware to verify JWT token and authenticate user
 * Extracts token from Authorization header, verifies it, and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Authorization denied.'
        });
      }
      throw error;
    }

    // Find user by ID from token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Authorization denied.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Middleware factory to check if user has required role(s)
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 * @returns {Function} Express middleware function
 */
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure user is authenticated (should be set by authenticate middleware)
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed',
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if supervisor has access to a specific site
 * For supervisors, verifies they are assigned to the site in the request
 * Admins and Accountants bypass this check
 * @param {string} siteParamName - Name of the route parameter containing site ID (default: 'siteId')
 * @returns {Function} Express middleware function
 */
const checkSiteAccess = (siteParamName = 'siteId') => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required. Please log in.'
        });
      }

      // Admin and Accountant have access to all sites
      if (req.user.role === 'Admin' || req.user.role === 'Accountant') {
        return next();
      }

      // For Supervisors, check site assignment
      if (req.user.role === 'Supervisor') {
        // Get site ID from route params or request body
        const siteId = req.params[siteParamName] || req.body.site || req.body.siteId;

        if (!siteId) {
          return res.status(400).json({
            success: false,
            message: 'Site ID is required'
          });
        }

        // Check if supervisor is assigned to this site
        const isAssigned = req.user.assignedSites.some(
          assignedSite => assignedSite.toString() === siteId.toString()
        );

        if (!isAssigned) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You are not assigned to this site.'
          });
        }

        return next();
      }

      // If role is not recognized, deny access
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid role.'
      });
    } catch (error) {
      console.error('Site access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Site access check failed',
        error: error.message
      });
    }
  };
};

module.exports = {
  authenticate,
  checkRole,
  checkSiteAccess
};
