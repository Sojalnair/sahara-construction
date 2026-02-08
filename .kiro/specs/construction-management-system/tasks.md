# Implementation Plan: Construction Management System

## Overview

This implementation plan breaks down the Construction Management System into discrete, actionable coding tasks. The system is built using Node.js/Express backend with MongoDB, and React frontend with TailwindCSS. Tasks are organized to build incrementally, with testing integrated throughout to catch errors early.

## Tasks

- [ ] 1. Set up core backend infrastructure and authentication
  - [x] 1.1 Configure database connection and environment variables
    - Set up MongoDB connection with Mongoose
    - Configure environment variables for JWT, Cloudinary, database URI
    - Implement connection error handling and retry logic
    - _Requirements: 1.1, 1.7_

  - [x] 1.2 Implement User model with password hashing
    - Create User schema with validation
    - Implement password hashing using bcryptjs
    - Add pre-save hook for password hashing
    - Create indexes for email and role fields
    - _Requirements: 1.1, 1.8_

  - [x] 1.3 Write property test for password hashing
    - **Property 4: Passwords are hashed in storage**
    - **Validates: Requirements 1.8**

  - [x] 1.4 Implement authentication controller and JWT generation
    - Create register endpoint (admin only)
    - Create login endpoint with credential validation
    - Implement JWT token generation and signing
    - Create getCurrentUser endpoint
    - Implement password update functionality
    - _Requirements: 1.1, 1.7_

  - [x] 1.5 Write property test for valid login credentials
    - **Property 1: Valid login credentials return authentication token**
    - **Validates: Requirements 1.1**

  - [x] 1.6 Implement authentication and authorization middleware
    - Create JWT verification middleware
    - Create role-based authorization middleware (checkRole)
    - Implement route protection logic
    - _Requirements: 1.2, 1.4, 1.5, 1.6_

  - [ ] 1.7 Write property test for role-based access control
    - **Property 2: Invalid role access is denied**
    - **Validates: Requirements 1.2**

  - [ ] 1.8 Write property test for supervisor site access restriction
    - **Property 3: Supervisor site access is restricted**
    - **Validates: Requirements 1.5**

  - [ ] 1.9 Set up authentication routes
    - Wire authentication controller to routes
    - Apply rate limiting to auth endpoints
    - Add input validation middleware
    - _Requirements: 1.1, 1.2_

- [ ] 2. Checkpoint - Verify authentication system
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 2. Implement Employee Management module
  - [x] 2.1 Create Employee model with validation
    - Define Employee schema with all fields
    - Add validation for phone numbers, salary types
    - Implement virtual field for net salary calculation
    - Create indexes for phone, currentSite, isActive
    - _Requirements: 2.1, 2.5, 2.7, 2.8_

  - [x] 2.2 Write property tests for employee validation
    - **Property 9: Invalid phone numbers are rejected**
    - **Property 10: Empty employee names are rejected**
    - **Validates: Requirements 2.7, 2.8, 15.2, 15.6**

  - [x] 2.3 Implement employee controller CRUD operations
    - Create createEmployee endpoint
    - Create getEmployees endpoint with filtering and pagination
    - Create getEmployeeById endpoint
    - Create updateEmployee endpoint
    - Create deleteEmployee endpoint (soft delete)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ] 2.4 Write property tests for employee CRUD
    - **Property 5: Employee creation stores all required fields**
    - **Property 6: Employee updates persist correctly**
    - **Property 7: Employee list returns all employees**
    - **Validates: Requirements 2.1, 2.2, 2.4**

  - [ ] 2.5 Implement advance payment functionality
    - Add addAdvancePayment method to Employee model
    - Create endpoint to record advance payments
    - Implement automatic totalAdvance calculation
    - Create getSalarySummary endpoint
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 2.6 Write property tests for advance payments
    - **Property 11: Advance payment round-trip**
    - **Property 12: Net salary calculation**
    - **Property 13: Negative advance amounts are rejected**
    - **Property 14: Total advance balance updates immediately**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [ ] 2.7 Implement employee-site assignment
    - Create assignToSite endpoint
    - Update Employee model with currentSite reference
    - Validate site exists before assignment
    - _Requirements: 2.6_

  - [ ] 2.8 Write property test for employee site assignment
    - **Property 8: Employee site assignment enables attendance**
    - **Validates: Requirements 2.6**

  - [ ] 2.9 Set up employee routes with authorization
    - Wire employee controller to routes
    - Apply admin-only authorization to create/update/delete
    - Add input validation middleware
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Checkpoint - Verify employee management
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement Site Management module
  - [ ] 3.1 Create Site model with validation
    - Define Site schema with all fields
    - Add validation for site name uniqueness, dates
    - Implement totalExpenses calculation logic
    - Create indexes for name, supervisor, status
    - _Requirements: 5.1, 5.2, 5.6, 5.7_

  - [ ] 3.2 Write property tests for site validation
    - **Property 24: Duplicate site names are rejected**
    - **Property 25: Invalid dates are rejected**
    - **Validates: Requirements 5.6, 5.7, 15.4**

  - [ ] 3.3 Implement site controller CRUD operations
    - Create createSite endpoint
    - Create getSites endpoint with filtering
    - Create getSiteById endpoint
    - Create updateSite endpoint
    - Create deleteSite endpoint
    - Create updateSiteStatus endpoint
    - _Requirements: 5.1, 5.3, 5.4, 5.5, 5.8_

  - [ ] 3.4 Write property tests for site CRUD
    - **Property 20: Site creation stores required fields**
    - **Property 23: Site updates persist correctly**
    - **Validates: Requirements 5.1, 5.5**

  - [ ] 3.5 Implement site supervisor assignment
    - Create assignSupervisor endpoint
    - Update User model with assignedSites array
    - Implement access control for supervisors
    - _Requirements: 5.3_

  - [ ] 3.6 Write property test for supervisor assignment
    - **Property 21: Supervisor assignment grants access**
    - **Validates: Requirements 5.3**

  - [ ] 3.7 Implement site expense aggregation
    - Create getSiteExpenses endpoint
    - Implement updateTotalExpenses method
    - Calculate expenses by category
    - _Requirements: 5.4_

  - [ ] 3.8 Write property test for site expense aggregation
    - **Property 22: Site expense aggregation**
    - **Validates: Requirements 5.4, 7.8**

  - [ ] 3.9 Implement site employee management
    - Create getSiteEmployees endpoint
    - Create assignEmployee endpoint
    - Add employee to site's assignedEmployees array
    - _Requirements: 2.6_

  - [ ] 3.10 Implement site milestone management
    - Create addMilestone endpoint
    - Create updateMilestone endpoint
    - Add milestone tracking to Site model
    - _Requirements: 5.1_

  - [ ] 3.11 Set up site routes with authorization
    - Wire site controller to routes
    - Apply role-based authorization
    - Add input validation middleware
    - _Requirements: 5.1, 5.3, 5.5_

- [ ] 4. Checkpoint - Verify site management
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Attendance Management module
  - [ ] 4.1 Create Attendance model with validation
    - Define Attendance schema with all fields
    - Add compound unique index on [employee, date]
    - Implement wage calculation logic
    - Create indexes for site, date, status
    - _Requirements: 4.1, 4.5, 4.8_

  - [ ] 4.2 Write property test for duplicate attendance prevention
    - **Property 19: Duplicate attendance prevention**
    - **Validates: Requirements 4.8, 15.8**

  - [ ] 4.3 Implement attendance controller operations
    - Create markAttendance endpoint
    - Create bulkMarkAttendance endpoint
    - Create getAttendanceByDate endpoint
    - Create getEmployeeAttendance endpoint
    - Create updateAttendance endpoint
    - Create deleteAttendance endpoint
    - _Requirements: 4.1, 4.6, 4.7_

  - [ ] 4.4 Write property tests for attendance recording
    - **Property 15: Attendance status is recorded correctly**
    - **Validates: Requirements 4.1, 4.5**

  - [ ] 4.5 Implement wage calculation logic
    - Create calculateWage method in Attendance model
    - Handle daily wage calculation for present/half-day/absent
    - Handle monthly salary employees
    - Update wageEarned on attendance save
    - _Requirements: 4.2, 4.3, 4.4, 16.1_

  - [ ] 4.6 Write property test for wage calculation
    - **Property 16: Wage calculation based on attendance**
    - **Validates: Requirements 4.2, 4.3, 4.4, 16.1**

  - [ ] 4.7 Implement attendance filtering and aggregation
    - Create getAttendanceBySite endpoint
    - Create getMonthlyAttendanceSummary endpoint
    - Implement date range filtering
    - _Requirements: 4.6, 4.7_

  - [ ] 4.8 Write property tests for attendance filtering
    - **Property 17: Site-based attendance filtering**
    - **Property 18: Monthly attendance aggregation**
    - **Validates: Requirements 4.6, 4.7, 7.4, 7.5**

  - [ ] 4.9 Implement attendance verification
    - Create verifyAttendance endpoint
    - Add isVerified flag and verifiedBy reference
    - _Requirements: 4.1_

  - [ ] 4.10 Set up attendance routes with authorization
    - Wire attendance controller to routes
    - Apply supervisor/admin authorization
    - Add input validation middleware
    - _Requirements: 4.1, 4.6_

- [ ] 5. Checkpoint - Verify attendance management
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Materials Management module
  - [ ] 5.1 Create Material model with validation
    - Define Material schema with all fields
    - Add validation for quantities and prices
    - Implement stock calculation logic
    - Create indexes for site, category, isStockLow
    - _Requirements: 6.1, 6.5, 6.6_

  - [ ] 5.2 Write property tests for material validation
    - **Property 30: Negative material quantities are rejected**
    - **Validates: Requirements 6.5**

  - [ ] 5.3 Implement material controller CRUD operations
    - Create addMaterial endpoint
    - Create getMaterials endpoint with filtering
    - Create getMaterialById endpoint
    - Create updateMaterial endpoint
    - Create deleteMaterial endpoint
    - _Requirements: 6.1, 6.4_

  - [ ] 5.4 Write property tests for material CRUD
    - **Property 26: Material creation stores required fields**
    - **Property 31: Total material cost calculation**
    - **Validates: Requirements 6.1, 6.8**

  - [ ] 5.5 Implement material usage tracking
    - Create recordUsage method in Material model
    - Create recordUsage endpoint
    - Update quantityUsed and quantityRemaining
    - Add usage to usageHistory array
    - _Requirements: 6.2, 6.7_

  - [ ] 5.6 Write property tests for material usage
    - **Property 27: Material usage reduces stock**
    - **Property 29: Material usage history is recorded**
    - **Validates: Requirements 6.2, 6.4, 6.7**

  - [ ] 5.7 Implement low stock alert system
    - Create checkStockLevel method
    - Update isStockLow flag when stock falls below threshold
    - Create getLowStockMaterials endpoint
    - _Requirements: 6.3_

  - [ ] 5.8 Write property test for low stock alerts
    - **Property 28: Low stock alert generation**
    - **Validates: Requirements 6.3, 13.5**

  - [ ] 5.9 Implement material filtering
    - Create getMaterialsBySite endpoint
    - Create getMaterialsByCategory endpoint
    - _Requirements: 6.4_

  - [ ] 5.10 Set up material routes with authorization
    - Wire material controller to routes
    - Apply admin/accountant authorization
    - Add input validation middleware
    - _Requirements: 6.1, 6.2_

- [ ] 6. Checkpoint - Verify materials management
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement Expense Tracking module
  - [ ] 6.1 Create Expense model with validation
    - Define Expense schema with all fields
    - Add validation for amounts and categories
    - Implement balance calculation logic
    - Create indexes for site, category, date, paymentStatus
    - _Requirements: 7.1, 7.2, 7.6, 7.7_

  - [ ] 6.2 Write property tests for expense validation
    - **Property 34: Valid site reference required**
    - **Validates: Requirements 7.7**

  - [ ] 6.3 Implement expense controller CRUD operations
    - Create createExpense endpoint
    - Create getExpenses endpoint with filtering
    - Create getExpenseById endpoint
    - Create updateExpense endpoint
    - Create deleteExpense endpoint
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ] 6.4 Write property tests for expense CRUD
    - **Property 32: Expense creation stores required fields**
    - **Property 33: Date range expense filtering**
    - **Validates: Requirements 7.1, 7.3**

  - [ ] 6.5 Implement expense filtering and aggregation
    - Create getExpensesBySite endpoint
    - Create getExpensesByCategory endpoint
    - Create getMonthlyExpenseSummary endpoint
    - _Requirements: 7.4, 7.5, 7.8_

  - [ ] 6.6 Implement expense approval workflow
    - Create approveExpense endpoint
    - Add isApproved flag and approvedBy reference
    - _Requirements: 7.1_

  - [ ] 6.7 Set up expense routes with authorization
    - Wire expense controller to routes
    - Apply accountant/admin authorization
    - Add input validation middleware
    - _Requirements: 7.1, 7.3_

- [ ] 7. Checkpoint - Verify expense tracking
  - Ensure all tests pass, ask the user if questions arise.

