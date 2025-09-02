const express = require('express');
const cors = require('cors');
const http = require('http');
const authRoutes = require('./authRoutes');
const householdRoutes = require('./householdRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const notificationRoutes = require('./notificationRoutes');
const { initializeSocket } = require('./socket');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Authentication routes
app.use('/api/v1/auth', authRoutes);

// Household routes (protected by auth middleware)
app.use('/api/v1/households', householdRoutes);

// Inventory routes (protected by auth middleware)
// Pass io instance to inventory routes for broadcasting
app.use('/api/v1', (req, res, next) => {
  req.io = io;
  next();
}, inventoryRoutes);

// Dashboard routes (protected by auth middleware)
app.use('/api/v1/dashboard', dashboardRoutes);

// Notification routes (protected by auth middleware)
app.use('/api/v1/notifications', notificationRoutes);

// Test utilities (only in non-production)
if (process.env.NODE_ENV !== 'production') {
  const resetDbRoutes = require('./reset-db');
  app.use('/api/v1/test', resetDbRoutes);
}

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Mock backend server with WebSocket support is listening on port ${PORT}`);
});