const express = require('express');
const router = express.Router();
const db = require('./db');

// Debug endpoint to reset the in-memory database
// This endpoint is not protected by auth middleware for testing purposes
router.post('/reset-state', (req, res) => {
  try {
    // Clear all arrays in the database
    db.users.length = 0;
    db.households.length = 0;
    db.household_members.length = 0;
    db.validRefreshTokens.clear();
    db.invitations.length = 0;
    db.inventoryItems.length = 0;
    db.itemHistory.length = 0;
    db.notification_preferences.length = 0;
    db.shoppingLists.length = 0;
    db.shoppingListItems.length = 0;
    
    console.log('[DEBUG] In-memory database reset to initial empty state');
    
    res.status(200).json({
      message: 'Database reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[DEBUG] Error resetting database:', error);
    res.status(500).json({
      error: 'Failed to reset database',
      message: error.message
    });
  }
});

module.exports = router;