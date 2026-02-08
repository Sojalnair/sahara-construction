# Requirements Document

## Introduction

The Construction Management System is a comprehensive web application designed for small and medium construction business owners to manage their operations efficiently. The system provides modules for employee management, attendance tracking, site management, materials inventory, expense tracking, invoicing, and reporting. The application must be professional, mobile-friendly, secure, and suitable for real-world commercial use.

## Glossary

- **System**: The Construction Management Web Application
- **Admin**: User with owner-level access to all system features
- **Supervisor**: User with site-level access to manage assigned sites
- **Accountant**: User with financial access to manage expenses and invoices
- **Employee**: A worker tracked in the system (may or may not have login access)
- **Site**: A construction project location
- **Attendance_Record**: Daily record of employee presence status
- **Material**: Construction material tracked in inventory
- **Expense**: A financial transaction recorded in the system
- **Invoice**: A billing document generated for clients
- **Advance_Payment**: Salary paid to employee before regular payment cycle
- **Stock**: Current quantity of a material in inventory
- **GST**: Goods and Services Tax applied to invoices

## Requirements

### Requirement 1: User Authentication and Authorization

**User Story:** As a business owner, I want secure role-based access control, so that different users can access only the features appropriate to their role.

#### Acceptance Criteria

1. WHEN a user attempts to log in with valid credentials, THE System SHALL authenticate the user and grant access based on their assigned role
2. WHEN a user attempts to access a feature without proper role permissions, THE System SHALL deny access and display an appropriate error message
3. THE System SHALL support three distinct roles: Admin, Supervisor, and Accountant
4. WHEN an Admin user logs in, THE System SHALL grant access to all system features
5. WHEN a Supervisor user logs in, THE System SHALL grant access only to sites assigned to that supervisor
6. WHEN an Accountant user logs in, THE System SHALL grant access to expense tracking, invoicing, and financial reports
7. WHEN a user session expires, THE System SHALL require re-authentication before allowing further access
8. THE System SHALL encrypt user passwords using industry-standard hashing algorithms

### Requirement 2: Employee Management

**User Story:** As an admin, I want to manage employee records, so that I can track workforce information and assignments.

#### Acceptance Criteria

1. WHEN an admin creates a new employee record, THE System SHALL store name, phone number, role, salary type (daily or monthly), and salary amount
2. WHEN an admin updates an employee record, THE System SHALL persist the changes and maintain data integrity
3. WHEN an admin deletes an employee record, THE System SHALL remove the employee and handle associated data appropriately
4. WHEN an admin views the employee list, THE System SHALL display all employees with their key information
5. THE System SHALL support two salary types: daily wage and monthly salary
6. WHEN an admin assigns an employee to a site, THE System SHALL create the assignment and make it available for attendance tracking
7. THE System SHALL validate that phone numbers are in a valid format before saving
8. THE System SHALL ensure employee names are non-empty strings

### Requirement 3: Advance Payment Management

**User Story:** As an admin, I want to track advance payments to employees, so that I can manage cash flow and maintain accurate payment records.

#### Acceptance Criteria

1. WHEN an admin records an advance payment for an employee, THE System SHALL store the amount, date, and employee reference
2. WHEN an admin views an employee's payment history, THE System SHALL display all advance payments with dates and amounts
3. WHEN calculating net salary, THE System SHALL deduct total advance payments from the gross salary
4. THE System SHALL validate that advance payment amounts are positive numbers
5. WHEN an advance payment is recorded, THE System SHALL update the employee's total advance balance immediately

### Requirement 4: Attendance Management

**User Story:** As a supervisor, I want to mark daily attendance for employees at my sites, so that wages can be calculated accurately.

#### Acceptance Criteria

1. WHEN a supervisor marks attendance for an employee, THE System SHALL record the status as Present, Absent, or Half-day
2. WHEN attendance is marked as Present for a daily wage employee, THE System SHALL calculate the wage as the full daily rate
3. WHEN attendance is marked as Half-day for a daily wage employee, THE System SHALL calculate the wage as 50% of the daily rate
4. WHEN attendance is marked as Absent, THE System SHALL calculate the wage as zero
5. THE System SHALL associate each attendance record with a specific site and date
6. WHEN a supervisor views attendance for a site, THE System SHALL display records filtered by that site
7. WHEN generating monthly attendance reports, THE System SHALL aggregate all attendance records for the specified month
8. THE System SHALL prevent duplicate attendance entries for the same employee, site, and date
9. WHEN the daily reminder time arrives, THE System SHALL send notifications to supervisors who have not marked attendance

### Requirement 5: Site Management

**User Story:** As an admin, I want to create and manage construction sites, so that I can organize work by location and track site-specific information.

#### Acceptance Criteria

1. WHEN an admin creates a new site, THE System SHALL store the site name, location, start date, and status
2. THE System SHALL support site statuses including Active, Completed, and On-Hold
3. WHEN an admin assigns a supervisor to a site, THE System SHALL create the assignment and grant the supervisor access to that site
4. WHEN viewing a site's details, THE System SHALL display total expenses incurred at that site
5. WHEN an admin updates a site's information, THE System SHALL persist the changes immediately
6. THE System SHALL validate that site names are unique within the system
7. THE System SHALL validate that start dates are valid date values
8. WHEN an admin deletes a site, THE System SHALL handle associated data (employees, materials, expenses) appropriately

### Requirement 6: Materials Management

**User Story:** As an admin, I want to track construction materials inventory, so that I can monitor stock levels and material costs.

#### Acceptance Criteria

1. WHEN an admin adds a new material, THE System SHALL store the material name, quantity, cost per unit, and supplier details
2. WHEN an admin assigns material to a site, THE System SHALL deduct the assigned quantity from available stock
3. WHEN material stock falls below a defined threshold, THE System SHALL generate a low stock alert
4. WHEN viewing material details, THE System SHALL display current stock quantity and usage history
5. THE System SHALL validate that material quantities are non-negative numbers
6. THE System SHALL validate that cost per unit is a positive number
7. WHEN material is used at a site, THE System SHALL record the usage with date, quantity, and site reference
8. THE System SHALL calculate total material cost by multiplying quantity by cost per unit

### Requirement 7: Expense Tracking

**User Story:** As an accountant, I want to record and categorize expenses, so that I can track project costs accurately.

#### Acceptance Criteria

1. WHEN an accountant records an expense, THE System SHALL store the amount, date, category, site reference, and description
2. THE System SHALL support expense categories: Labour, Materials, Transport, and Miscellaneous
3. WHEN filtering expenses by date range, THE System SHALL return only expenses within that range
4. WHEN filtering expenses by site, THE System SHALL return only expenses associated with that site
5. WHEN generating monthly expense reports, THE System SHALL aggregate all expenses for the specified month
6. THE System SHALL validate that expense amounts are positive numbers
7. THE System SHALL require a valid site reference for each expense
8. WHEN calculating site total expenses, THE System SHALL sum all expenses associated with that site

### Requirement 8: Invoice Management

**User Story:** As an accountant, I want to create and manage client invoices, so that I can bill clients and track payments.

#### Acceptance Criteria

1. WHEN an accountant creates an invoice, THE System SHALL store client details, invoice date, due date, and line items
2. WHEN adding line items to an invoice, THE System SHALL store description, quantity, rate, and calculate the amount automatically
3. WHERE GST is applicable, THE System SHALL calculate GST amount based on the configured tax rate
4. THE System SHALL calculate invoice subtotal by summing all line item amounts
5. THE System SHALL calculate invoice total by adding subtotal and GST amount
6. THE System SHALL support payment statuses: Paid, Partial, and Pending
7. WHEN an accountant uploads a signed invoice file, THE System SHALL store the file reference with the invoice
8. WHEN recording a payment against an invoice, THE System SHALL store the payment amount, date, and method
9. WHEN viewing payment history for an invoice, THE System SHALL display all recorded payments with dates and amounts
10. THE System SHALL validate that invoice dates are valid date values
11. THE System SHALL validate that line item quantities and rates are positive numbers

### Requirement 9: WhatsApp Invoice Sharing

**User Story:** As an accountant, I want to share invoices via WhatsApp, so that I can quickly send billing information to clients.

#### Acceptance Criteria

1. WHEN an accountant requests to share an invoice via WhatsApp, THE System SHALL generate a shareable link to the invoice
2. WHEN the shareable link is accessed, THE System SHALL display the invoice details in a readable format
3. THE System SHALL format a WhatsApp message template with invoice details and the shareable link
4. WHEN the WhatsApp share button is clicked, THE System SHALL open WhatsApp with the pre-formatted message

### Requirement 10: Excel Export Functionality

**User Story:** As an admin, I want to export data to Excel format, so that I can perform additional analysis and share reports externally.

#### Acceptance Criteria

1. WHEN an admin requests to export attendance data, THE System SHALL generate an Excel file containing all attendance records with employee names, dates, sites, and statuses
2. WHEN an admin requests to export expense data, THE System SHALL generate an Excel file containing all expenses with dates, categories, amounts, and site references
3. WHEN an admin requests to export material usage data, THE System SHALL generate an Excel file containing material assignments with material names, quantities, costs, and site references
4. WHEN an admin requests to export invoice data, THE System SHALL generate an Excel file containing all invoices with client details, amounts, dates, and payment statuses
5. THE System SHALL format Excel files with appropriate column headers and data types
6. WHEN an export is requested, THE System SHALL generate the file and initiate a download to the user's device

### Requirement 11: PDF Report Generation

**User Story:** As an admin, I want to generate monthly PDF reports, so that I can review business performance and share formal reports with stakeholders.

#### Acceptance Criteria

1. WHEN an admin requests a monthly report, THE System SHALL generate a PDF containing labour costs, material costs, total expenses, and profit/loss calculations
2. THE System SHALL include an attendance summary showing total present days, absent days, and half-days for each employee
3. THE System SHALL calculate total labour cost by summing all attendance-based wages for the month
4. THE System SHALL calculate total material cost by summing all material expenses for the month
5. THE System SHALL calculate profit/loss by subtracting total expenses from total invoice revenue for the month
6. THE System SHALL format the PDF report with professional styling including headers, tables, and summary sections
7. WHEN the PDF is generated, THE System SHALL initiate a download to the user's device

### Requirement 12: Site Photo Management

**User Story:** As a supervisor, I want to upload and view site photos, so that I can document construction progress visually.

#### Acceptance Criteria

1. WHEN a supervisor uploads photos for a site, THE System SHALL store the image files with upload date and uploader information
2. THE System SHALL support multiple photo uploads for a single site
3. WHEN viewing a site's photo gallery, THE System SHALL display all photos in a grid layout with thumbnails
4. WHEN a user clicks on a thumbnail, THE System SHALL display the full-size image
5. THE System SHALL validate that uploaded files are valid image formats (JPEG, PNG, etc.)
6. THE System SHALL store metadata including upload date and the user who uploaded each photo

### Requirement 13: Dashboard Overview

**User Story:** As an admin, I want to view a comprehensive dashboard, so that I can quickly assess the current state of my business.

#### Acceptance Criteria

1. WHEN an admin views the dashboard, THE System SHALL display the total count of employees
2. WHEN an admin views the dashboard, THE System SHALL display the count of active sites
3. WHEN an admin views the dashboard, THE System SHALL display total expenses for the current month
4. WHEN an admin views the dashboard, THE System SHALL display the total amount of pending invoices
5. WHEN materials fall below the low stock threshold, THE System SHALL display low stock alerts on the dashboard
6. WHEN an admin views the dashboard, THE System SHALL display an attendance summary showing today's attendance statistics
7. THE System SHALL update dashboard metrics in real-time as data changes
8. THE System SHALL calculate pending invoice amount by summing all invoices with Pending or Partial payment status

### Requirement 14: Mobile Responsiveness

**User Story:** As a user, I want to access the system on mobile devices, so that I can manage operations from construction sites and remote locations.

#### Acceptance Criteria

1. WHEN a user accesses the system on a mobile device, THE System SHALL display a responsive layout optimized for the screen size
2. WHEN a user interacts with forms on mobile, THE System SHALL provide appropriate input types for mobile keyboards
3. WHEN a user navigates the system on mobile, THE System SHALL provide touch-friendly interface elements with adequate spacing
4. THE System SHALL maintain full functionality across desktop, tablet, and mobile screen sizes
5. WHEN images are displayed on mobile, THE System SHALL scale them appropriately to fit the screen

### Requirement 15: Data Validation and Integrity

**User Story:** As a system administrator, I want robust data validation, so that the system maintains data integrity and prevents errors.

#### Acceptance Criteria

1. WHEN a user submits a form with invalid data, THE System SHALL display clear error messages indicating which fields are invalid
2. THE System SHALL validate that required fields are not empty before saving records
3. THE System SHALL validate that numeric fields contain valid numbers within acceptable ranges
4. THE System SHALL validate that date fields contain valid date values
5. THE System SHALL validate that email addresses match a valid email format
6. THE System SHALL validate that phone numbers match a valid phone number format
7. WHEN a user attempts to delete a record with dependencies, THE System SHALL either prevent deletion or handle cascading deletes appropriately
8. THE System SHALL prevent duplicate entries where uniqueness is required (e.g., attendance for same employee/site/date)

### Requirement 16: Salary Calculation

**User Story:** As an admin, I want automatic salary calculations, so that I can accurately determine employee payments.

#### Acceptance Criteria

1. WHEN calculating salary for a daily wage employee, THE System SHALL multiply the daily rate by the number of days marked Present plus 0.5 times the number of Half-days
2. WHEN calculating salary for a monthly salary employee, THE System SHALL use the fixed monthly amount regardless of attendance
3. WHEN generating a salary report, THE System SHALL deduct total advance payments from the gross salary to calculate net payable amount
4. THE System SHALL display gross salary, total advances, and net payable amount separately in salary reports
5. WHEN attendance records are updated, THE System SHALL recalculate affected salary amounts immediately

### Requirement 17: System Scalability and Performance

**User Story:** As a business owner, I want the system to handle growing data volumes, so that it remains performant as my business expands.

#### Acceptance Criteria

1. WHEN the database contains thousands of records, THE System SHALL maintain response times under 2 seconds for standard queries
2. WHEN multiple users access the system simultaneously, THE System SHALL handle concurrent requests without data corruption
3. THE System SHALL implement pagination for large data sets to maintain performance
4. WHEN generating reports with large data volumes, THE System SHALL process them efficiently without timeout errors
5. THE System SHALL implement database indexing on frequently queried fields to optimize performance
