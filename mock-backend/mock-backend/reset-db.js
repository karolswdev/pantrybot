// Reset database module
const fs = require('fs');
const path = require('path');
const db = require('./db');

function resetDatabase() {
  // Reset the database to initial state
  // Clear all arrays
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
  
  console.log('✅ Database reset to initial state');
  return {
    success: true,
    message: 'Database reset successfully'
  };
}

module.exports = resetDatabase;