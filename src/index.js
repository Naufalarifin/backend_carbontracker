const app = require('./app');

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend berjalan di http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🏢 Company API: http://localhost:${PORT}/api/companies`);
  console.log(`👤 User API: http://localhost:${PORT}/api/users`);
  console.log(`⚡ Emission Sources API: http://localhost:${PORT}/api/emission-sources`);
  console.log(`📝 Emission Inputs API: http://localhost:${PORT}/api/emission-inputs`);
  console.log(`📋 Emission Details API: http://localhost:${PORT}/api/emission-details`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
