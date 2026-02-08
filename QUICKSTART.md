# Construction Management System - Quick Start Guide

## What's Been Built

### Backend (Complete)
✅ Authentication system with JWT
✅ User management (Admin, Supervisor, Accountant roles)
✅ Employee management (CRUD operations)
✅ Site management
✅ Attendance tracking
✅ Materials inventory
✅ Expense tracking
✅ All REST API endpoints working

### Frontend (New!)
✅ React application with Vite
✅ Login/Authentication
✅ Dashboard with statistics
✅ Employee management UI
✅ Site management UI
✅ Expense tracking UI
✅ Responsive design

## How to Run

### 1. Start MongoDB
Make sure MongoDB is running on `localhost:27017`

### 2. Start Backend Server
```bash
# In the root directory
npm start
```
Backend will run on: http://localhost:5000

### 3. Start Frontend
```bash
# In a new terminal
cd client
npm run dev
```
Frontend will run on: http://localhost:3000

### 4. Create Admin User
First, you need to create an admin user. Use this curl command or Postman:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@test.com",
    "password": "password123",
    "role": "Admin"
  }'
```

**Note:** The register endpoint is normally protected (Admin only), but for the first user, you can temporarily comment out the auth middleware in `routes/authRoutes.js`.

### 5. Login to Frontend
Open http://localhost:3000 in your browser

**Login Credentials:**
- Email: admin@test.com
- Password: password123

## Features You Can Test

### Dashboard
- View total employees, sites, attendance records, and expenses
- Real-time statistics

### Employees
- Add new employees with name, phone, role, salary type (daily/monthly), and amount
- View all employees in a table
- Delete employees
- Phone validation (Indian 10-digit format starting with 6-9)

### Sites
- Create new construction sites
- Set location, start date, and status (Active/On-Hold/Completed)
- View all sites in a grid layout
- Track expenses per site

### Expenses
- Record expenses by site
- Categories: Labour, Materials, Transport, Miscellaneous
- Track payment status (Paid/Pending)
- View expense history with totals

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register user (Admin only)
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/password` - Update password

### Employees
- POST `/api/employees` - Create employee
- GET `/api/employees` - Get all employees
- GET `/api/employees/:id` - Get employee by ID
- PUT `/api/employees/:id` - Update employee
- DELETE `/api/employees/:id` - Delete employee
- POST `/api/employees/:id/advance` - Add advance payment

### Sites
- POST `/api/sites` - Create site
- GET `/api/sites` - Get all sites
- GET `/api/sites/:id` - Get site by ID
- PUT `/api/sites/:id` - Update site
- DELETE `/api/sites/:id` - Delete site
- POST `/api/sites/:id/assign-supervisor` - Assign supervisor

### Attendance
- POST `/api/attendance` - Mark attendance
- GET `/api/attendance` - Get attendance records
- PUT `/api/attendance/:id` - Update attendance
- DELETE `/api/attendance/:id` - Delete attendance

### Materials
- POST `/api/materials` - Add material
- GET `/api/materials` - Get materials
- GET `/api/materials/:id` - Get material by ID
- PUT `/api/materials/:id` - Update material
- DELETE `/api/materials/:id` - Delete material

### Expenses
- POST `/api/expenses` - Create expense
- GET `/api/expenses` - Get expenses
- GET `/api/expenses/:id` - Get expense by ID
- PUT `/api/expenses/:id` - Update expense
- DELETE `/api/expenses/:id` - Delete expense

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs for password hashing
- Express Validator

### Frontend
- React 19
- Vite
- React Router DOM
- Axios
- Modern CSS with Grid/Flexbox

## Project Structure

```
construction-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.jsx        # Main app component
│   │   ├── App.css        # Styles
│   │   └── main.jsx       # Entry point
│   └── package.json
├── config/                # Configuration
│   ├── db.js             # Database connection
│   ├── env.js            # Environment variables
│   └── cloudinary.js     # Cloudinary config
├── controllers/          # Route controllers
│   ├── authController.js
│   ├── employeeController.js
│   ├── siteController.js
│   ├── attendanceController.js
│   ├── materialController.js
│   └── expenseController.js
├── middleware/           # Custom middleware
│   ├── auth.js          # Authentication & authorization
│   └── validate.js      # Validation middleware
├── models/              # Mongoose models
│   ├── User.js
│   ├── Employee.js
│   ├── Site.js
│   ├── Attendance.js
│   ├── Material.js
│   └── Expense.js
├── routes/              # API routes
│   ├── authRoutes.js
│   ├── employeeRoutes.js
│   ├── siteRoutes.js
│   ├── attendanceRoutes.js
│   ├── materialRoutes.js
│   └── expenseRoutes.js
├── server.js            # Express server
├── .env                 # Environment variables
└── package.json
```

## Environment Variables

Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/construction-management
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Next Steps

1. **Add More Features:**
   - Attendance marking UI
   - Materials management UI
   - Reports and analytics
   - Photo upload for sites
   - Invoice generation

2. **Enhance Security:**
   - Rate limiting
   - Input sanitization
   - HTTPS in production

3. **Deploy:**
   - Backend: Heroku, Railway, or DigitalOcean
   - Frontend: Vercel, Netlify, or Cloudflare Pages
   - Database: MongoDB Atlas

## Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists with correct values
- Run `npm install` to ensure dependencies are installed

### Frontend won't start
- Run `npm install` in the `client` directory
- Check if port 3000 is available
- Verify backend is running on port 5000

### Can't login
- Make sure you created an admin user first
- Check browser console for errors
- Verify backend API is accessible at http://localhost:5000

### CORS errors
- Backend already has CORS enabled
- If issues persist, check browser console for specific error

## Support

For issues or questions, check:
- Backend logs in terminal
- Frontend console in browser DevTools
- MongoDB connection status
- Network tab in browser DevTools for API calls

Enjoy building with the Construction Management System! 🏗️
