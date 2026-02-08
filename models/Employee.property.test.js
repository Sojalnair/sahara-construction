// Load environment variables first
require('dotenv').config();

const mongoose = require('mongoose');
const fc = require('fast-check');
const Employee = require('./Employee');
const { connectDB, closeDB } = require('../config/db');

describe('Employee Model Property-Based Tests', () => {
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

  describe('Property 9: Invalid phone numbers are rejected', () => {
    /**
     * **Validates: Requirements 2.7**
     * 
     * This property test verifies that the system validates phone numbers correctly.
     * Valid Indian phone numbers must:
     * 1. Be exactly 10 digits long
     * 2. Start with digits 6, 7, 8, or 9
     * 
     * Invalid phone numbers should be rejected.
     */
    it('should reject phone numbers that do not match valid format', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid phone numbers
          fc.oneof(
            fc.string({ minLength: 1, maxLength: 9 }), // Too short
            fc.string({ minLength: 11, maxLength: 20 }), // Too long
            fc.string({ minLength: 10, maxLength: 10 }).filter(s => !/^\d{10}$/.test(s)), // Not all digits
            fc.integer({ min: 0, max: 5 }).chain(firstDigit => 
              fc.integer({ min: 0, max: 999999999 }).map(rest => 
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ) // Starts with 0-5
          ),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryType: fc.constantFrom('daily', 'monthly'),
            salaryAmount: fc.integer({ min: 0, max: 100000 })
          }),
          async (invalidPhone, employeeData) => {
            // Attempt to create employee with invalid phone
            await expect(
              Employee.create({
                ...employeeData,
                phone: invalidPhone
              })
            ).rejects.toThrow();
          }
        ),
        {
          numRuns: 15,
          timeout: 30000
        }
      );
    });

    it('should accept valid Indian phone numbers', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid Indian phone numbers (starting with 6-9, followed by 9 digits)
          fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
            fc.integer({ min: 0, max: 999999999 }).map(rest =>
              `${firstDigit}${rest.toString().padStart(9, '0')}`
            )
          ),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryType: fc.constantFrom('daily', 'monthly'),
            salaryAmount: fc.integer({ min: 0, max: 100000 })
          }),
          async (validPhone, employeeData) => {
            // Create employee with valid phone
            const employee = await Employee.create({
              ...employeeData,
              phone: validPhone
            });

            expect(employee.phone).toBe(validPhone);
            expect(employee.phone).toMatch(/^[6-9]\d{9}$/);

            // Clean up
            await Employee.deleteOne({ _id: employee._id });
          }
        ),
        {
          numRuns: 15,
          timeout: 30000
        }
      );
    });
  });

  describe('Property 10: Empty employee names are rejected', () => {
    /**
     * **Validates: Requirements 2.8**
     * 
     * This property test verifies that employee names must be non-empty strings.
     * The system should reject:
     * 1. Missing name field
     * 2. Empty string names
     * 3. Whitespace-only names (after trimming)
     */
    it('should reject empty or whitespace-only names', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate empty or whitespace-only strings
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t'),
            fc.constant('\n')
          ),
          fc.record({
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryType: fc.constantFrom('daily', 'monthly'),
            salaryAmount: fc.integer({ min: 0, max: 100000 })
          }),
          async (emptyName, employeeData) => {
            // Attempt to create employee with empty name
            await expect(
              Employee.create({
                ...employeeData,
                name: emptyName
              })
            ).rejects.toThrow();
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });

    it('should accept non-empty names', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          fc.record({
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryType: fc.constantFrom('daily', 'monthly'),
            salaryAmount: fc.integer({ min: 0, max: 100000 })
          }),
          async (validName, employeeData) => {
            // Create employee with valid name
            const employee = await Employee.create({
              ...employeeData,
              name: validName
            });

            expect(employee.name).toBe(validName.trim());
            expect(employee.name.length).toBeGreaterThan(0);

            // Clean up
            await Employee.deleteOne({ _id: employee._id });
          }
        ),
        {
          numRuns: 15,
          timeout: 30000
        }
      );
    });
  });

  describe('Property: Salary type validation', () => {
    /**
     * **Validates: Requirements 2.5**
     * 
     * This property test verifies that salary type must be either 'daily' or 'monthly'.
     */
    it('should only accept daily or monthly salary types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('daily', 'monthly'),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryAmount: fc.integer({ min: 0, max: 100000 })
          }),
          async (salaryType, employeeData) => {
            // Create employee with valid salary type
            const employee = await Employee.create({
              ...employeeData,
              salaryType
            });

            expect(employee.salaryType).toBe(salaryType);
            expect(['daily', 'monthly']).toContain(employee.salaryType);

            // Clean up
            await Employee.deleteOne({ _id: employee._id });
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });

    it('should reject invalid salary types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => s !== 'daily' && s !== 'monthly'),
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryAmount: fc.integer({ min: 0, max: 100000 })
          }),
          async (invalidSalaryType, employeeData) => {
            // Attempt to create employee with invalid salary type
            await expect(
              Employee.create({
                ...employeeData,
                salaryType: invalidSalaryType
              })
            ).rejects.toThrow();
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });
  });

  describe('Property 11: Advance payment round-trip', () => {
    /**
     * **Validates: Requirements 3.1, 3.2**
     * 
     * This property test verifies that advance payments are correctly stored and retrieved.
     * When an advance payment is added:
     * 1. The payment should be added to the advancePayments array
     * 2. The totalAdvance should be updated correctly
     * 3. The payment details should be preserved
     */
    it('should correctly store and retrieve advance payments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryType: fc.constantFrom('daily', 'monthly'),
            salaryAmount: fc.integer({ min: 1000, max: 100000 })
          }),
          fc.array(
            fc.record({
              amount: fc.integer({ min: 1, max: 10000 }),
              description: fc.string({ maxLength: 200 })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (employeeData, advancePayments) => {
            // Create employee
            const employee = await Employee.create(employeeData);

            // Add advance payments
            for (const payment of advancePayments) {
              await employee.addAdvancePayment(payment.amount, payment.description);
            }

            // Fetch employee from database
            const savedEmployee = await Employee.findById(employee._id);

            // Verify all payments are stored
            expect(savedEmployee.advancePayments).toHaveLength(advancePayments.length);

            // Verify total advance is correct
            const expectedTotal = advancePayments.reduce((sum, p) => sum + p.amount, 0);
            expect(savedEmployee.totalAdvance).toBe(expectedTotal);

            // Verify each payment is stored correctly
            for (let i = 0; i < advancePayments.length; i++) {
              expect(savedEmployee.advancePayments[i].amount).toBe(advancePayments[i].amount);
              expect(savedEmployee.advancePayments[i].description).toBe(advancePayments[i].description);
              expect(savedEmployee.advancePayments[i].date).toBeDefined();
            }

            // Clean up
            await Employee.deleteOne({ _id: employee._id });
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });
  });

  describe('Property 12: Net salary calculation', () => {
    /**
     * **Validates: Requirements 3.3, 16.3**
     * 
     * This property test verifies that net salary is calculated correctly.
     * For monthly employees: netSalary = salaryAmount - totalAdvance (minimum 0)
     * For daily employees: netSalary = salaryAmount (daily rate)
     */
    it('should calculate net salary correctly for monthly employees', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryAmount: fc.integer({ min: 10000, max: 100000 })
          }),
          fc.integer({ min: 0, max: 50000 }),
          async (employeeData, advanceAmount) => {
            // Create monthly employee
            const employee = await Employee.create({
              ...employeeData,
              salaryType: 'monthly'
            });

            // Add advance payment if amount > 0
            if (advanceAmount > 0) {
              await employee.addAdvancePayment(advanceAmount);
            }

            // Fetch employee from database
            const savedEmployee = await Employee.findById(employee._id);

            // Calculate expected net salary
            const expectedNetSalary = Math.max(0, employeeData.salaryAmount - advanceAmount);

            // Verify net salary calculation
            expect(savedEmployee.netSalary).toBe(expectedNetSalary);

            // Clean up
            await Employee.deleteOne({ _id: employee._id });
          }
        ),
        {
          numRuns: 15,
          timeout: 30000
        }
      );
    });

    it('should return daily rate for daily wage employees', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryAmount: fc.integer({ min: 100, max: 2000 })
          }),
          async (employeeData) => {
            // Create daily wage employee
            const employee = await Employee.create({
              ...employeeData,
              salaryType: 'daily'
            });

            // For daily employees, netSalary should equal salaryAmount (daily rate)
            expect(employee.netSalary).toBe(employeeData.salaryAmount);

            // Clean up
            await Employee.deleteOne({ _id: employee._id });
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });
  });

  describe('Property 13: Negative advance amounts are rejected', () => {
    /**
     * **Validates: Requirements 3.4**
     * 
     * This property test verifies that advance payment amounts must be positive.
     */
    it('should reject negative or zero advance amounts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }),
            salaryType: fc.constantFrom('daily', 'monthly'),
            salaryAmount: fc.integer({ min: 1000, max: 100000 })
          }),
          fc.integer({ min: -10000, max: 0 }),
          async (employeeData, invalidAmount) => {
            // Create employee
            const employee = await Employee.create(employeeData);

            // Attempt to add invalid advance payment
            await expect(
              employee.addAdvancePayment(invalidAmount)
            ).rejects.toThrow();

            // Verify totalAdvance remains 0
            const savedEmployee = await Employee.findById(employee._id);
            expect(savedEmployee.totalAdvance).toBe(0);

            // Clean up
            await Employee.deleteOne({ _id: employee._id });
          }
        ),
        {
          numRuns: 10,
          timeout: 30000
        }
      );
    });
  });

  describe('Property 14: Total advance balance updates immediately', () => {
    /**
     * **Validates: Requirements 3.5**
     * 
     * This property test verifies that when an advance payment is recorded,
     * the employee's total advance balance is updated immediately.
     */
    it('should update total advance immediately after recording payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            phone: fc.integer({ min: 6, max: 9 }).chain(firstDigit =>
              fc.integer({ min: 0, max: 999999999 }).map(rest =>
                `${firstDigit}${rest.toString().padStart(9, '0')}`
              )
            ),
            role: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            salaryType: fc.constantFrom('daily', 'monthly'),
            salaryAmount: fc.integer({ min: 1000, max: 100000 })
          }),
          fc.integer({ min: 1, max: 10000 }),
          async (employeeData, advanceAmount) => {
            // Create employee
            const employee = await Employee.create(employeeData);

            // Record initial total advance
            const initialTotal = employee.totalAdvance;

            // Add advance payment
            await employee.addAdvancePayment(advanceAmount);

            // Verify total advance is updated immediately (in memory)
            expect(employee.totalAdvance).toBe(initialTotal + advanceAmount);

            // Fetch from database to verify persistence
            const savedEmployee = await Employee.findById(employee._id);
            expect(savedEmployee.totalAdvance).toBe(initialTotal + advanceAmount);

            // Clean up
            await Employee.deleteOne({ _id: employee._id });
          }
        ),
        {
          numRuns: 15,
          timeout: 30000
        }
      );
    });
  });
});
