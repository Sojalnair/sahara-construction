const express = require('express');
const cors = require('cors');
const { validateEnv, getConfig } = require('./config/env');
const { connectDB } = require('./config/db');
const { configureCloudinary } = require('./config/cloudinary');

/**
 * Initialize Express application
 */
const app = express();

/**
 * Validate environment variables before starting
 */
try {
  validateEnv();
} catch (error) {
  console.error(`Environment validation failed: ${error.message}`);
  process.exit(1);
}

const config = getConfig();

/**
 * Middleware
 */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check endpoint with database status
 */
app.get('/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus,
    uptime: process.uptime()
  });
});

/**
 * API Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus,
    uptime: process.uptime(),
    message: 'Construction Management API is running'
  });
});

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Construction Management System API',
    version: '1.0.0',
    status: 'running'
  });
});

/**
 * API Routes
 */
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const webauthnRoutes = require('./routes/webauthnRoutes');
app.use('/api/auth/webauthn', webauthnRoutes);

const employeeRoutes = require('./routes/employeeRoutes');
app.use('/api/employees', employeeRoutes);

const siteRoutes = require('./routes/siteRoutes');
app.use('/api/sites', siteRoutes);

const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', attendanceRoutes);

const materialRoutes = require('./routes/materialRoutes');
app.use('/api/materials', materialRoutes);

const expenseRoutes = require('./routes/expenseRoutes');
app.use('/api/expenses', expenseRoutes);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(config.isDevelopment && { stack: err.stack })
  });
});

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Configure Cloudinary
    configureCloudinary();

    // Start listening
    const PORT = config.port;
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        console.log('HTTP server closed');
        
        try {
          const { closeDB } = require('./config/db');
          await closeDB();
          console.log('Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

// Start server if not in test mode
if (config.nodeEnv !== 'test') {
  startServer();
}

module.exports = app;
