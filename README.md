# Construction Management System

A comprehensive web application for managing construction business operations including employee management, attendance tracking, site management, materials inventory, expense tracking, and invoicing.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Storage**: Cloudinary
- **Testing**: Jest

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT (minimum 32 characters)
   - `CLOUDINARY_*`: Your Cloudinary credentials (optional for image uploads)

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Running Tests

Run all unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run integration tests (requires MongoDB):
```bash
npm test -- config/db.integration.test.js
```

Skip integration tests:
```bash
SKIP_INTEGRATION_TESTS=true npm test
```

## Features

- **User Authentication & Authorization**: Role-based access control (Admin, Supervisor, Accountant)
- **Employee Management**: Track employee records, assignments, and payments
- **Attendance Tracking**: Daily attendance with wage calculations
- **Site Management**: Manage construction sites and assignments
- **Materials Management**: Track inventory and usage
- **Expense Tracking**: Record and categorize expenses
- **Invoice Management**: Create and manage client invoices
- **Reporting**: Generate PDF reports and Excel exports
- **Photo Management**: Upload and view site photos

## Database Connection

The application includes robust database connection handling:
- Automatic retry logic with configurable attempts
- Connection error handling
- Graceful reconnection on disconnection
- Connection state monitoring

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| MONGODB_URI | MongoDB connection string | Yes | - |
| MONGODB_TEST_URI | MongoDB test database URI | No | - |
| JWT_SECRET | Secret key for JWT tokens | Yes | - |
| JWT_EXPIRE | JWT token expiration time | No | 7d |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name | No | - |
| CLOUDINARY_API_KEY | Cloudinary API key | No | - |
| CLOUDINARY_API_SECRET | Cloudinary API secret | No | - |
| PORT | Server port | No | 5000 |
| NODE_ENV | Environment mode | No | development |
| DB_MAX_RETRIES | Max database connection retries | No | 5 |
| DB_RETRY_INTERVAL | Retry interval in ms | No | 5000 |

## API Endpoints

### Health Check
- `GET /health` - Check server health status

### Root
- `GET /` - API information

## Project Structure

```
.
├── config/
│   ├── db.js              # Database configuration
│   ├── env.js             # Environment configuration
│   └── cloudinary.js      # Cloudinary configuration
├── server.js              # Main application entry point
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
└── README.md              # Project documentation
```

## License

ISC
