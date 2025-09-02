const express = require('express');
const cors = require('cors');
const authRoutes = require('./authRoutes');
const householdRoutes = require('./householdRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Create Express app
const app = express();

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
app.use('/api/v1', inventoryRoutes);

// Dashboard routes (protected by auth middleware)
app.use('/api/v1/dashboard', dashboardRoutes);

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Mock backend server is listening on port ${PORT}`);
});