const express = require('express');
const router = express.Router();
const resetDatabase = require('./reset-db');

// Reset database endpoint for E2E tests
router.post('/reset-db', async (req, res) => {
  try {
    const result = await resetDatabase();
    res.json(result);
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
