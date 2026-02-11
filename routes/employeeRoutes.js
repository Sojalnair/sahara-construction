const express = require('express');
const { body, query } = require('express-validator');
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  updateEmployeeSalary
} = require('../controllers/employeeController');
const validate = require('../middleware/validate');
const { authenticate, checkRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/employees
 * @desc    Create a new employee
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticate,
  checkRole('Admin'),
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Employee name is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Employee name must be between 1 and 100 characters'),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be exactly 10 digits')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must contain only digits'),
    body('role')
      .trim()
      .notEmpty()
      .withMessage('Employee role is required')
      .isLength({ max: 50 })
      .withMessage('Role cannot exceed 50 characters'),
    body('salaryType')
      .notEmpty()
      .withMessage('Salary type is required')
      .isIn(['daily', 'monthly'])
      .withMessage('Salary type must be either daily or monthly'),
    body('salaryAmount')
      .notEmpty()
      .withMessage('Salary amount is required')
      .isFloat({ min: 0 })
      .withMessage('Salary amount must be a positive number'),
    body('currentSite')
      .optional()
      .isMongoId()
      .withMessage('Invalid site ID format'),
    body('joiningDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
  ],
  validate,
  createEmployee
);

/**
 * @route   GET /api/employees
 * @desc    Get all employees with filtering and pagination
 * @access  Private (Admin, Supervisor, Accountant)
 */
router.get(
  '/',
  authenticate,
  checkRole('Admin', 'Supervisor', 'Accountant'),
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 10000 })
      .withMessage('Limit must be between 1 and 10000'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean'),
    query('salaryType')
      .optional()
      .isIn(['daily', 'monthly'])
      .withMessage('Salary type must be either daily or monthly'),
    query('currentSite')
      .optional()
      .isMongoId()
      .withMessage('Invalid site ID format')
  ],
  validate,
  getEmployees
);

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private (Admin, Supervisor, Accountant)
 */
router.get(
  '/:id',
  authenticate,
  checkRole('Admin', 'Supervisor', 'Accountant'),
  getEmployeeById
);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticate,
  checkRole('Admin'),
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage('Employee name must be between 1 and 100 characters'),
    body('phone')
      .optional()
      .trim()
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number must be exactly 10 digits')
      .matches(/^\d{10}$/)
      .withMessage('Phone number must contain only digits'),
    body('role')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Role cannot exceed 50 characters'),
    body('salaryType')
      .optional()
      .isIn(['daily', 'monthly'])
      .withMessage('Salary type must be either daily or monthly'),
    body('salaryAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Salary amount must be a positive number'),
    body('currentSite')
      .optional()
      .custom((value) => value === null || value === '' || /^[0-9a-fA-F]{24}$/.test(value))
      .withMessage('Invalid site ID format'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  validate,
  updateEmployee
);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee (soft delete)
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authenticate,
  checkRole('Admin'),
  deleteEmployee
);

/**
 * @route   PUT /api/employees/:id/salary
 * @desc    Update employee salary with history tracking
 * @access  Private (Admin)
 */
router.put(
  '/:id/salary',
  authenticate,
  checkRole('Admin'),
  [
    body('newAmount')
      .notEmpty()
      .withMessage('New salary amount is required')
      .isFloat({ min: 0 })
      .withMessage('Salary amount must be a positive number'),
    body('effectiveDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Reason cannot exceed 200 characters')
  ],
  validate,
  updateEmployeeSalary
);

/**
 * @route   GET /api/employees/public/active
 * @desc    Get active employees for public use (dropdowns)
 * @access  Public
 */
router.get('/public/active', async (req, res) => {
  try {
    const Employee = require('../models/Employee');
    const employees = await Employee.find({ isActive: true })
      .select('name phone role _id')
      .sort({ name: 1 })
      .limit(1000);

    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    console.error('Error fetching public employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/employees/public/all
 * @desc    Get all employees for public use (employee list display)
 * @access  Public
 */
router.get('/public/all', async (req, res) => {
  try {
    const Employee = require('../models/Employee');
    const employees = await Employee.find({})
      .select('name phone role salaryType salaryAmount isActive totalAdvance createdAt _id')
      .populate('currentSite', 'name location status')
      .sort({ createdAt: -1 })
      .limit(1000);

    res.status(200).json({
      success: true,
      data: { employees }
    });
  } catch (error) {
    console.error('Error fetching all public employees:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
});

module.exports = router;
