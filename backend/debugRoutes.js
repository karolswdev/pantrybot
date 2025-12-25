const express = require('express');
const router = express.Router();
const resetDatabase = require('./reset-db');

// Reset state endpoint for tests
router.post('/reset-state', (req, res) => {
  try {
    resetDatabase();
    res.json({ 
      success: true, 
      message: 'State reset successfully' 
    });
  } catch (error) {
    console.error('Error resetting state:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'mock-backend',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;