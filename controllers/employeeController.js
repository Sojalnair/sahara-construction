const Employee = require('../models/Employee');

/**
 * Create a new employee
 * @route POST /api/employees
 * @access Private (Admin only)
 */
const createEmployee = async (req, res) => {
  try {
    const { name, phone, role, salaryType, salaryAmount, currentSite, joiningDate } = req.body;

    // Create new employee
    const employee = await Employee.create({
      name,
      phone,
      role,
      salaryType,
      salaryAmount,
      currentSite: currentSite || null,
      joiningDate: joiningDate || Date.now()
    });

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    // Handle duplicate phone number
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this phone number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating employee',
      error: error.message
    });
  }
};

/**
 * Get all employees with filtering and pagination
 * @route GET /api/employees
 * @access Private (Admin, Supervisor, Accountant)
 */
const getEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      salaryType,
      currentSite,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (salaryType) {
      filter.salaryType = salaryType;
    }

    if (currentSite) {
      filter.currentSite = currentSite;
    }

    // Add search functionality for name and phone
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const employees = await Employee.find(filter)
      .populate('currentSite', 'name location status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Employee.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching employees',
      error: error.message
    });
  }
};

/**
 * Get employee by ID
 * @route GET /api/employees/:id
 * @access Private (Admin, Supervisor, Accountant)
 */
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('currentSite', 'name location status');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { employee }
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching employee',
      error: error.message
    });
  }
};

/**
 * Update employee
 * @route PUT /api/employees/:id
 * @access Private (Admin only)
 */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, role, salaryType, salaryAmount, currentSite, isActive } = req.body;

    // Find employee
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Update fields if provided
    if (name !== undefined) employee.name = name;
    if (phone !== undefined) employee.phone = phone;
    if (role !== undefined) employee.role = role;
    if (salaryType !== undefined) employee.salaryType = salaryType;
    if (salaryAmount !== undefined) employee.salaryAmount = salaryAmount;
    if (currentSite !== undefined) employee.currentSite = currentSite || null;
    if (isActive !== undefined) employee.isActive = isActive;

    // Save updated employee
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    // Handle duplicate phone number
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this phone number already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating employee',
      error: error.message
    });
  }
};

/**
 * Delete employee (soft delete)
 * @route DELETE /api/employees/:id
 * @access Private (Admin only)
 */
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Find employee
    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Soft delete by setting isActive to false
    employee.isActive = false;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee deleted successfully',
      data: { employee }
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid employee ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting employee',
      error: error.message
    });
  }
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee
};
