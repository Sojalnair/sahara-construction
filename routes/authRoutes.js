const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getCurrentUser,
  updatePassword,
  logout
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/auth/setup
 * @desc    Create first admin user (only works if no users exist)
 * @access  Public (one-time only)
 */
router.post(
  '/setup',
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],
  validate,
  async (req, res) => {
    try {
      const User = require('../models/User');
      const userCount = await User.countDocuments();
      
      if (userCount > 0) {
        return res.status(403).json({
          success: false,
          message: 'Setup already completed. Use /register endpoint with admin credentials.'
        });
      }

      // Create first admin user
      const user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: 'Admin'
      });

      const jwt = require('jsonwebtoken');
      const { getConfig } = require('../config/env');
      const config = getConfig();
      
      const token = jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: config.jwtExpire });

      res.status(201).json({
        success: true,
        message: 'First admin user created successfully',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

/**
 * @route   POST /api/auth/employee-login
 * @desc    Login employee with phone number (no password)
 * @access  Public
 */
router.post(
  '/employee-login',
  [
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[0-9]{10}$/)
      .withMessage('Phone number must be 10 digits')
  ],
  validate,
  async (req, res) => {
    try {
      const Employee = require('../models/Employee');
      const { phone } = req.body;

      // Find employee by phone
      const employee = await Employee.findOne({ phone, isActive: true })
        .populate('currentSite', 'name location status');

      if (!employee) {
        return res.status(401).json({
          success: false,
          message: 'Employee not found or inactive'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Employee login successful',
        data: {
          employee: {
            _id: employee._id,
            name: employee.name,
            phone: employee.phone,
            role: employee.role,
            salaryType: employee.salaryType,
            salaryAmount: employee.salaryAmount,
            currentSite: employee.currentSite,
            isActive: employee.isActive
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Employee login failed',
        error: error.message
      });
    }
  }
);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (Admin only)
 * @access  Private (Admin)
 */
router.post(
  '/register',
  authenticate,
  checkRole('Admin'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .notEmpty()
      .withMessage('Role is required')
      .isIn(['Admin', 'Supervisor', 'Accountant'])
      .withMessage('Role must be Admin, Supervisor, or Accountant')
  ],
  validate,
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with credentials
 * @access  Public
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  validate,
  login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   PUT /api/auth/password
 * @desc    Update user password
 * @access  Private
 */
router.put(
  '/password',
  authenticate,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters long')
  ],
  validate,
  updatePassword
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

module.exports = router;
