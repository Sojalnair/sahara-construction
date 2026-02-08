// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');
const Employee = require('./Employee');
const { connectDB, closeDB } = require('../config/db');

describe('Employee Model Unit Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    // Clean up the Employee collection before each test
    await Employee.deleteMany({});
  });

  describe('Employee Schema Validation', () => {
    it('should create a valid employee with all required fields', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      const employee = await Employee.create(employeeData);

      expect(employee.name).toBe(employeeData.name);
      expect(employee.phone).toBe(employeeData.phone);
      expect(employee.role).toBe(employeeData.role);
      expect(employee.salaryType).toBe(employeeData.salaryType);
      expect(employee.salaryAmount).toBe(employeeData.salaryAmount);
      expect(employee.isActive).toBe(true);
      expect(employee.totalAdvance).toBe(0);
      expect(employee.advancePayments).toHaveLength(0);
    });

    it('should create a monthly salary employee', async () => {
      const employeeData = {
        name: 'Jane Smith',
        phone: '8765432109',
        role: 'Supervisor',
        salaryType: 'monthly',
        salaryAmount: 25000
      };

      const employee = await Employee.create(employeeData);

      expect(employee.salaryType).toBe('monthly');
      expect(employee.salaryAmount).toBe(25000);
    });

    it('should fail when name is missing', async () => {
      const employeeData = {
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      await expect(Employee.create(employeeData)).rejects.toThrow();
    });

    it('should fail when name is empty string', async () => {
      const employeeData = {
        name: '',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      await expect(Employee.create(employeeData)).rejects.toThrow();
    });

    it('should fail when phone is missing', async () => {
      const employeeData = {
        name: 'John Doe',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      await expect(Employee.create(employeeData)).rejects.toThrow();
    });

    it('should fail with invalid phone number format', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '123456', // Invalid format
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      await expect(Employee.create(employeeData)).rejects.toThrow();
    });

    it('should fail with phone number starting with invalid digit', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '1234567890', // Starts with 1, invalid for Indian numbers
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      };

      await expect(Employee.create(employeeData)).rejects.toThrow();
    });

    it('should accept valid Indian phone numbers', async () => {
      const validPhones = ['6000000000', '7000000000', '8000000000', '9000000000'];

      for (const phone of validPhones) {
        const employee = await Employee.create({
          name: `Employee ${phone}`,
          phone,
          role: 'Worker',
          salaryType: 'daily',
          salaryAmount: 400
        });

        expect(employee.phone).toBe(phone);
      }
    });

    it('should fail when salary type is invalid', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'hourly', // Invalid type
        salaryAmount: 500
      };

      await expect(Employee.create(employeeData)).rejects.toThrow();
    });

    it('should fail when salary amount is negative', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: -500
      };

      await expect(Employee.create(employeeData)).rejects.toThrow();
    });

    it('should allow salary amount of zero', async () => {
      const employeeData = {
        name: 'John Doe',
        phone: '9876543210',
        role: 'Intern',
        salaryType: 'daily',
        salaryAmount: 0
      };

      const employee = await Employee.create(employeeData);
      expect(employee.salaryAmount).toBe(0);
    });
  });

  describe('Employee Advance Payments', () => {
    it('should add advance payment correctly', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });

      await employee.addAdvancePayment(1000, 'Emergency advance');

      expect(employee.totalAdvance).toBe(1000);
      expect(employee.advancePayments).toHaveLength(1);
      expect(employee.advancePayments[0].amount).toBe(1000);
      expect(employee.advancePayments[0].description).toBe('Emergency advance');
    });

    it('should add multiple advance payments', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });

      await employee.addAdvancePayment(1000, 'First advance');
      await employee.addAdvancePayment(500, 'Second advance');

      expect(employee.totalAdvance).toBe(1500);
      expect(employee.advancePayments).toHaveLength(2);
    });

    it('should fail when advance payment is negative', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });

      await expect(employee.addAdvancePayment(-100)).rejects.toThrow();
    });

    it('should fail when advance payment is zero', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });

      await expect(employee.addAdvancePayment(0)).rejects.toThrow();
    });
  });

  describe('Employee Virtual Fields', () => {
    it('should calculate net salary for monthly employee', async () => {
      const employee = await Employee.create({
        name: 'Jane Smith',
        phone: '8765432109',
        role: 'Supervisor',
        salaryType: 'monthly',
        salaryAmount: 25000
      });

      await employee.addAdvancePayment(5000);

      expect(employee.netSalary).toBe(20000);
    });

    it('should return zero net salary when advances exceed monthly salary', async () => {
      const employee = await Employee.create({
        name: 'Jane Smith',
        phone: '8765432109',
        role: 'Supervisor',
        salaryType: 'monthly',
        salaryAmount: 25000
      });

      await employee.addAdvancePayment(30000);

      expect(employee.netSalary).toBe(0);
    });

    it('should return daily rate for daily wage employee', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });

      expect(employee.netSalary).toBe(500);
    });
  });

  describe('Employee Methods', () => {
    it('should return salary summary', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });

      await employee.addAdvancePayment(1000, 'Advance');

      const summary = employee.getSalarySummary();

      expect(summary.name).toBe('John Doe');
      expect(summary.salaryType).toBe('daily');
      expect(summary.salaryAmount).toBe(500);
      expect(summary.totalAdvance).toBe(1000);
      expect(summary.advancePayments).toHaveLength(1);
    });
  });

  describe('Employee Site Assignment', () => {
    it('should allow assigning employee to a site', async () => {
      const siteId = new mongoose.Types.ObjectId();
      
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500,
        currentSite: siteId
      });

      expect(employee.currentSite).toEqual(siteId);
    });

    it('should allow null current site', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });

      expect(employee.currentSite).toBeNull();
    });
  });

  describe('Employee Status', () => {
    it('should default to active status', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500
      });

      expect(employee.isActive).toBe(true);
    });

    it('should allow setting inactive status', async () => {
      const employee = await Employee.create({
        name: 'John Doe',
        phone: '9876543210',
        role: 'Mason',
        salaryType: 'daily',
        salaryAmount: 500,
        isActive: false
      });

      expect(employee.isActive).toBe(false);
    });
  });
});
