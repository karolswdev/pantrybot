// Reset database endpoint for testing purposes
const express = require('express');
const router = express.Router();
const db = require('./db');

// POST /api/v1/test/reset-db
// This endpoint is only available in test mode
router.post('/reset-db', (req, res) => {
  // Only allow in non-production environments
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Database reset not allowed in production'
    });
  }

  // Clear all arrays
  db.users.length = 0;
  db.households.length = 0;
  db.household_members.length = 0;
  db.invitations.length = 0;
  db.inventoryItems.length = 0;
  db.itemHistory.length = 0;
  db.notification_preferences.length = 0;
  
  // Clear the refresh tokens set
  db.validRefreshTokens.clear();

  console.log('Database reset successfully');
  res.status(200).json({
    message: 'Database reset successfully',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;