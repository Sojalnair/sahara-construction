const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { connectDB, closeDB } = require('../config/db');

describe('Employee Controller Integration Tests', () => {
  let adminToken;
  let supervisorToken;
  let adminUser;
  let supervisorUser;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    // Clear collections
    await Employee.deleteMany({});
    await User.deleteMany({});

    // Create admin user
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'password123',
      role: 'Admin'
    });

    // Create supervisor user
    supervisorUser = await User.create({
      name: 'Supervisor User',
      email: 'supervisor@test.com',
      password: 'password123',
      role: 'Supervisor'
    });

    // Login to get tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminLogin.body.data.token;

    const supervisorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'supervisor@test.com', password: 'password123' });
    supervisorToken = supervisorLogin.body.data.token;
  });

  describe('POST /api/employees - Create Employee', () => {
    it('should create a new employee with valid data (Admin)', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(employeeData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.name).toBe('John Doe');
      expect(response.body.data.employee.phone).toBe('9876543210');
      expect(response.body.data.employee.salaryType).toBe('daily');
      expect(response.body.data.employee.salaryAmount).toBe(500);
    });

    it('should reject employee creation without authentication', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      const response = await request(app)
        .post('/api/employees')
        .send(employeeData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject employee creation by non-admin user', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(employeeData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject employee with invalid phone number', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '123456',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(employeeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject employee with empty name', async () => {
      const employeeData = {
        name: '',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(employeeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject employee with invalid salary type', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'hourly',
        salaryAmount: 500
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(employeeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject employee with negative salary amount', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: -100
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(employeeData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/employees - Get All Employees', () => {
    beforeEach(async () => {
      // Create test employees
      await Employee.create([
        {
          name: 'Employee 1',
          phone: '9876543210',
          role: 'Mason',
          salaryType: 'daily',
          salaryAmount: 500
        },
        {
          name: 'Employee 2',
          phone: '9876543211',
          role: 'Carpenter',
          salaryType: 'monthly',
          salaryAmount: 15000
        },
        {
          name: 'Employee 3',
          phone: '9876543212',
          role: 'Helper',
          salaryType: 'daily',
          salaryAmount: 300,
          isActive: false
        }
      ]);
    });

    it('should get all employees with pagination', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employees).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });

    it('should filter employees by salary type', async () => {
      const response = await request(app)
        .get('/api/employees?salaryType=daily')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employees).toHaveLength(2);
      expect(response.body.data.employees.every(e => e.salaryType === 'daily')).toBe(true);
    });

    it('should filter employees by active status', async () => {
      const response = await request(app)
        .get('/api/employees?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employees).toHaveLength(2);
      expect(response.body.data.employees.every(e => e.isActive === true)).toBe(true);
    });

    it('should search employees by name', async () => {
      const response = await request(app)
        .get('/api/employees?search=Employee 1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employees).toHaveLength(1);
      expect(response.body.data.employees[0].name).toBe('Employee 1');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/employees?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employees).toHaveLength(2);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });

    it('should allow supervisor to view employees', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/employees/:id - Get Employee By ID', () => {
    let employee;

    beforeEach(async () => {
      employee = await Employee.create({
        name: 'Test Employee',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });
    });

    it('should get employee by ID', async () => {
      const response = await request(app)
        .get(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.name).toBe('Test Employee');
      expect(response.body.data.employee._id).toBe(employee._id.toString());
    });

    it('should return 404 for non-existent employee', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/employees/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/employees/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/employees/:id - Update Employee', () => {
    let employee;

    beforeEach(async () => {
      employee = await Employee.create({
        name: 'Test Employee',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });
    });

    it('should update employee with valid data (Admin)', async () => {
      const updateData = {
        name: 'Updated Name',
        salaryAmount: 600
      };

      const response = await request(app)
        .put(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.name).toBe('Updated Name');
      expect(response.body.data.employee.salaryAmount).toBe(600);
    });

    it('should reject update by non-admin user', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent employee', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const updateData = {
        name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/api/employees/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should reject update with invalid phone number', async () => {
      const updateData = {
        phone: '123456'
      };

      const response = await request(app)
        .put(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/employees/:id - Delete Employee (Soft Delete)', () => {
    let employee;

    beforeEach(async () => {
      employee = await Employee.create({
        name: 'Test Employee',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });
    });

    it('should soft delete employee (Admin)', async () => {
      const response = await request(app)
        .delete(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.employee.isActive).toBe(false);

      // Verify employee still exists in database but is inactive
      const deletedEmployee = await Employee.findById(employee._id);
      expect(deletedEmployee).toBeTruthy();
      expect(deletedEmployee.isActive).toBe(false);
    });

    it('should reject delete by non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent employee', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .delete(`/api/employees/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
