const express = require('express');
const cors = require('cors');

// Import routes
const companyRoutes = require('./routes/companyRoutes');
const userRoutes = require('./routes/userRoutes');
const emissionSourceRoutes = require('./routes/emissionSourceRoutes');
const emissionInputRoutes = require('./routes/emissionInputRoutes');
const emissionDetailRoutes = require('./routes/emissionDetailRoutes');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/companies', companyRoutes);
app.use('/api/users', userRoutes);
app.use('/api/emission-sources', emissionSourceRoutes);
app.use('/api/emission-inputs', emissionInputRoutes);
app.use('/api/emission-details', emissionDetailRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

module.exports = app;
