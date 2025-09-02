// In-memory data store for mock backend
// This file serves as the database for the mock authentication system

// Users array stores registered user accounts
// Schema: { id: uuid, email: string, passwordHash: string, displayName: string, timezone: string, createdAt: Date }
const users = [];

// Households array stores household entities
// Schema: { id: uuid, name: string, description: string, createdBy: uuid (userId), createdAt: Date }
const households = [];

// Household members array stores the relationship between users and households
// Schema: { householdId: uuid, userId: uuid, role: string ('admin'|'member'|'viewer'), joinedAt: Date }
const household_members = [];

// Valid refresh tokens set stores active refresh tokens
// Used to validate refresh token requests and enable token rotation
const validRefreshTokens = new Set();

// Invitations array stores pending member invitations
// Schema: { invitationId: uuid, householdId: uuid, email: string, role: string, status: string, createdBy: uuid, createdAt: Date, expiresAt: Date }
const invitations = [];

// Inventory items array stores household inventory items
// Schema: { 
//   id: uuid, 
//   householdId: uuid, 
//   name: string, 
//   quantity: number, 
//   unit: string, 
//   location: string,
//   category: string,
//   expirationDate: Date|null,
//   bestBeforeDate: Date|null,
//   purchaseDate: Date|null,
//   price: number|null,
//   notes: string|null,
//   createdBy: uuid (userId),
//   createdAt: Date,
//   updatedAt: Date,
//   rowVersion: number (for ETag support)
// }
const inventoryItems = [];

// Item history array stores consumption and waste history
// Schema: {
//   id: uuid,
//   itemId: uuid,
//   householdId: uuid,
//   action: string ('created'|'updated'|'consumed'|'wasted'|'moved'),
//   quantity: number|null,
//   reason: string|null,
//   notes: string|null,
//   previousLocation: string|null,
//   newLocation: string|null,
//   userId: uuid,
//   timestamp: Date
// }
const itemHistory = [];

// Notification preferences array stores user notification settings
// Schema: {
//   userId: uuid,
//   email: { enabled: boolean, address: string },
//   inApp: { enabled: boolean },
//   telegram: { enabled: boolean, linked: boolean, username: string|null },
//   preferences: {
//     expirationWarningDays: number,
//     notificationTypes: string[] ('expiration'|'lowStock'|'shoppingReminder'),
//     preferredTime: string (HH:MM format),
//     timezone: string
//   },
//   updatedAt: Date
// }
const notification_preferences = [];

module.exports = {
  users,
  households,
  household_members,
  validRefreshTokens,
  invitations,
  inventoryItems,
  itemHistory,
  notification_preferences
};