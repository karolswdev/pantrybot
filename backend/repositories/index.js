const prisma = require('../prisma/client');

const UserRepository = require('./userRepository');
const HouseholdRepository = require('./householdRepository');
const InventoryRepository = require('./inventoryRepository');
const ShoppingListRepository = require('./shoppingListRepository');
const NotificationRepository = require('./notificationRepository');
const ActivityLogRepository = require('./activityLogRepository');
const InvitationRepository = require('./invitationRepository');
const RefreshTokenRepository = require('./refreshTokenRepository');

// Create singleton instances
const userRepository = new UserRepository(prisma);
const householdRepository = new HouseholdRepository(prisma);
const inventoryRepository = new InventoryRepository(prisma);
const shoppingListRepository = new ShoppingListRepository(prisma);
const notificationRepository = new NotificationRepository(prisma);
const activityLogRepository = new ActivityLogRepository(prisma);
const invitationRepository = new InvitationRepository(prisma);
const refreshTokenRepository = new RefreshTokenRepository(prisma);

module.exports = {
  prisma,
  userRepository,
  householdRepository,
  inventoryRepository,
  shoppingListRepository,
  notificationRepository,
  activityLogRepository,
  invitationRepository,
  refreshTokenRepository
};
