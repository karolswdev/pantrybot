// Reset database module - uses Prisma for PostgreSQL
const { prisma } = require('./repositories');

async function resetDatabase() {
  try {
    // Truncate all tables in correct order (respecting foreign keys)
    // Use transaction to ensure all-or-nothing
    await prisma.$transaction([
      // First, delete dependent tables
      prisma.shoppingListItem.deleteMany(),
      prisma.shoppingList.deleteMany(),
      prisma.itemHistory.deleteMany(),
      prisma.inventoryItem.deleteMany(),
      prisma.invitation.deleteMany(),
      prisma.notification.deleteMany(),
      prisma.notificationPreference.deleteMany(),
      prisma.activityLog.deleteMany(),
      prisma.householdMember.deleteMany(),
      prisma.household.deleteMany(),
      prisma.refreshToken.deleteMany(),
      // Finally, delete users
      prisma.user.deleteMany(),
    ]);

    console.log('✅ Database reset to initial state (Prisma)');
    return {
      success: true,
      message: 'Database reset successfully'
    };
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  }
}

module.exports = resetDatabase;
