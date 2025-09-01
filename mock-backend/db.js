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

module.exports = {
  users,
  households,
  household_members,
  validRefreshTokens,
  invitations
};