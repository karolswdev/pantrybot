// Test utilities for consistent test infrastructure
const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Reset database to a clean state
function resetDatabase() {
  // Clear all arrays
  db.users.length = 0;
  db.households.length = 0;
  db.household_members.length = 0;
  db.validRefreshTokens.clear();
  db.invitations.length = 0;
  db.inventoryItems.length = 0;
  db.itemHistory.length = 0;
}

// Create a test user with known credentials
async function createTestUser(email = 'test@example.com', password = 'Test123!', name = 'Test User') {
  const userId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = {
    id: userId,
    email: email,
    passwordHash: hashedPassword,
    displayName: name,
    timezone: 'UTC',
    createdAt: new Date().toISOString()
  };
  
  db.users.push(user);
  
  // Create a default household for the user
  const householdId = uuidv4();
  const household = {
    id: householdId,
    name: `${name}'s Household`,
    description: 'Default household',
    createdBy: userId,
    createdAt: new Date().toISOString()
  };
  
  db.households.push(household);
  
  // Add user as admin of the household
  db.household_members.push({
    householdId: householdId,
    userId: userId,
    role: 'admin',
    joinedAt: new Date().toISOString()
  });
  
  return {
    userId,
    householdId,
    email,
    password,
    name
  };
}

// Create additional test users with different roles
async function createTestHouseholdWithMembers() {
  // Create admin user
  const admin = await createTestUser('admin@example.com', 'Admin123!', 'Admin User');
  
  // Create member user
  const memberUserId = uuidv4();
  const memberUser = {
    id: memberUserId,
    email: 'member@example.com',
    passwordHash: await bcrypt.hash('Member123!', 10),
    displayName: 'Member User',
    timezone: 'UTC',
    createdAt: new Date().toISOString()
  };
  db.users.push(memberUser);
  
  // Add member to admin's household
  db.household_members.push({
    householdId: admin.householdId,
    userId: memberUserId,
    role: 'member',
    joinedAt: new Date().toISOString()
  });
  
  // Create viewer user
  const viewerUserId = uuidv4();
  const viewerUser = {
    id: viewerUserId,
    email: 'viewer@example.com',
    passwordHash: await bcrypt.hash('Viewer123!', 10),
    displayName: 'Viewer User',
    timezone: 'UTC',
    createdAt: new Date().toISOString()
  };
  db.users.push(viewerUser);
  
  // Add viewer to admin's household
  db.household_members.push({
    householdId: admin.householdId,
    userId: viewerUserId,
    role: 'viewer',
    joinedAt: new Date().toISOString()
  });
  
  return {
    admin: {
      userId: admin.userId,
      householdId: admin.householdId,
      email: admin.email,
      password: admin.password
    },
    member: {
      userId: memberUserId,
      email: 'member@example.com',
      password: 'Member123!'
    },
    viewer: {
      userId: viewerUserId,
      email: 'viewer@example.com',
      password: 'Viewer123!'
    }
  };
}

// Create test inventory items
function createTestInventoryItems(householdId, userId) {
  const items = [
    {
      id: uuidv4(),
      householdId: householdId,
      name: 'Milk',
      quantity: 2,
      unit: 'liters',
      location: 'fridge',
      category: 'dairy',
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rowVersion: 1
    },
    {
      id: uuidv4(),
      householdId: householdId,
      name: 'Bread',
      quantity: 1,
      unit: 'loaf',
      location: 'pantry',
      category: 'bakery',
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rowVersion: 1
    }
  ];
  
  items.forEach(item => db.inventoryItems.push(item));
  return items;
}

module.exports = {
  resetDatabase,
  createTestUser,
  createTestHouseholdWithMembers,
  createTestInventoryItems
};