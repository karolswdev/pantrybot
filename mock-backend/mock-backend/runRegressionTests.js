#!/usr/bin/env node

// Regression test runner with improved test infrastructure
const axios = require('axios');
const { resetDatabase, createTestUser, createTestHouseholdWithMembers, createTestInventoryItems } = require('./testUtils');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:8080';
const JWT_SECRET = 'your-secret-key-for-development';

// Test results tracking
const results = [];
let passCount = 0;
let failCount = 0;

// Helper function to log test results
function logTest(testId, description, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m - ${testId}: ${description}`);
  if (!passed && details) {
    console.log(`  Details: ${details}`);
  }
  results.push({ testId, description, passed, details });
  if (passed) passCount++;
  else failCount++;
}

// Generate a valid JWT token for testing
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
}

async function runTests() {
  console.log('\n=== RUNNING PHASE MBE-3 REGRESSION TESTS ===\n');
  console.log('Resetting database and preparing test data...\n');
  
  // Reset database before each test run
  resetDatabase();
  
  // Phase 1 Tests: Authentication
  console.log('--- Phase 1: Authentication Tests ---');
  
  // TC-MBE-1.1: Health Check
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logTest('TC-MBE-1.1', 'Health Check Endpoint Returns 200', response.status === 200);
  } catch (error) {
    logTest('TC-MBE-1.1', 'Health Check Endpoint Returns 200', false, error.message);
  }
  
  // TC-MBE-1.2: User Registration
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: 'newuser@example.com',
      password: 'Test123!',
      name: 'New User'
    });
    logTest('TC-MBE-1.2', 'User Registration Creates Account', 
      response.status === 201 && response.data.accessToken && response.data.refreshToken);
  } catch (error) {
    logTest('TC-MBE-1.2', 'User Registration Creates Account', false, error.message);
  }
  
  // TC-MBE-1.3: Duplicate Registration
  try {
    await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: 'newuser@example.com',
      password: 'Test123!',
      name: 'Duplicate User'
    });
    logTest('TC-MBE-1.3', 'User Registration Prevents Duplicate Email', false, 'Should have returned 409');
  } catch (error) {
    logTest('TC-MBE-1.3', 'User Registration Prevents Duplicate Email', 
      error.response && error.response.status === 409);
  }
  
  // TC-MBE-1.4: User Login
  let accessToken, refreshToken;
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'newuser@example.com',
      password: 'Test123!'
    });
    accessToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;
    logTest('TC-MBE-1.4', 'User Login Returns Valid Token', 
      response.status === 200 && accessToken && refreshToken);
  } catch (error) {
    logTest('TC-MBE-1.4', 'User Login Returns Valid Token', false, error.message);
  }
  
  // TC-MBE-1.5: Invalid Credentials
  try {
    await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'newuser@example.com',
      password: 'WrongPassword!'
    });
    logTest('TC-MBE-1.5', 'Invalid Credentials Return 401', false, 'Should have returned 401');
  } catch (error) {
    logTest('TC-MBE-1.5', 'Invalid Credentials Return 401', 
      error.response && error.response.status === 401);
  }
  
  // TC-MBE-1.6: Non-existent User
  try {
    await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: 'nonexistent@example.com',
      password: 'Test123!'
    });
    logTest('TC-MBE-1.6', 'Non-existent User Returns 401', false, 'Should have returned 401');
  } catch (error) {
    logTest('TC-MBE-1.6', 'Non-existent User Returns 401', 
      error.response && error.response.status === 401);
  }
  
  // TC-MBE-1.7: Token Refresh
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
      refreshToken: refreshToken
    });
    logTest('TC-MBE-1.7', 'Refresh Token Rotates Successfully', 
      response.status === 200 && response.data.accessToken && response.data.refreshToken);
    accessToken = response.data.accessToken; // Update token for subsequent tests
  } catch (error) {
    logTest('TC-MBE-1.7', 'Refresh Token Rotates Successfully', false, error.message);
  }
  
  // Phase 2 Tests: Household Management
  console.log('\n--- Phase 2: Household Management Tests ---');
  
  // TC-MBE-2.1: Protected Endpoint Without Token
  try {
    await axios.get(`${BASE_URL}/api/v1/households`);
    logTest('TC-MBE-2.1', 'Access Protected Endpoint Without Token Returns 401', false, 'Should have returned 401');
  } catch (error) {
    logTest('TC-MBE-2.1', 'Access Protected Endpoint Without Token Returns 401', 
      error.response && error.response.status === 401);
  }
  
  // TC-MBE-2.2: List Households
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/households`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    logTest('TC-MBE-2.2', 'List Households With Valid Token Returns 200', 
      response.status === 200 && Array.isArray(response.data.households));
  } catch (error) {
    logTest('TC-MBE-2.2', 'List Households With Valid Token Returns 200', false, error.message);
  }
  
  // TC-MBE-2.3: Create Household
  let householdId;
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/households`, {
      name: 'Test Household',
      description: 'Test Description'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    householdId = response.data.id;
    logTest('TC-MBE-2.3', 'Create Household With Valid Data Returns 201', 
      response.status === 201 && householdId);
  } catch (error) {
    logTest('TC-MBE-2.3', 'Create Household With Valid Data Returns 201', false, error.message);
  }
  
  // TC-MBE-2.4: Get Dashboard Stats
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/dashboard/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    logTest('TC-MBE-2.4', 'Get Dashboard Stats Returns 200', 
      response.status === 200 && response.data.totalHouseholds !== undefined);
  } catch (error) {
    logTest('TC-MBE-2.4', 'Get Dashboard Stats Returns 200', false, error.message);
  }
  
  // Phase 3 Tests: Inventory Management
  console.log('\n--- Phase 3: Inventory Management Tests ---');
  
  // Setup test data for Phase 3
  const testSetup = await createTestHouseholdWithMembers();
  const adminToken = generateToken(testSetup.admin.userId, testSetup.admin.email);
  const memberToken = generateToken(testSetup.member.userId, testSetup.member.email);
  const viewerToken = generateToken(testSetup.viewer.userId, testSetup.viewer.email);
  
  // TC-MBE-3.1: Access Inventory Without Token
  try {
    await axios.get(`${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items`);
    logTest('TC-MBE-3.1', 'Access Inventory Endpoint Without Token Returns 401', false, 'Should have returned 401');
  } catch (error) {
    logTest('TC-MBE-3.1', 'Access Inventory Endpoint Without Token Returns 401', 
      error.response && error.response.status === 401);
  }
  
  // TC-MBE-3.2: List Items
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    logTest('TC-MBE-3.2', 'List Items With Valid Token Returns 200', 
      response.status === 200 && response.data.items !== undefined);
  } catch (error) {
    logTest('TC-MBE-3.2', 'List Items With Valid Token Returns 200', false, error.message);
  }
  
  // TC-MBE-3.3: Add Item
  let itemId;
  try {
    const response = await axios.post(`${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items`, {
      name: 'Test Item',
      quantity: 5,
      unit: 'pieces',
      location: 'pantry',
      category: 'snacks'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    itemId = response.data.id;
    logTest('TC-MBE-3.3', 'Add Item With Valid Data Returns 201', 
      response.status === 201 && itemId);
  } catch (error) {
    logTest('TC-MBE-3.3', 'Add Item With Valid Data Returns 201', false, error.message);
  }
  
  // TC-MBE-3.4: Update Item with ETag
  if (itemId) {
    try {
      // First get the item to obtain ETag
      const getResponse = await axios.get(
        `${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items/${itemId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      const etag = getResponse.headers.etag;
      
      // Now update with ETag
      const updateResponse = await axios.patch(
        `${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items/${itemId}`,
        { quantity: 3 },
        { headers: { Authorization: `Bearer ${adminToken}`, 'If-Match': etag } }
      );
      logTest('TC-MBE-3.4', 'Update Item With Valid ETag Returns 200', 
        updateResponse.status === 200);
    } catch (error) {
      logTest('TC-MBE-3.4', 'Update Item With Valid ETag Returns 200', false, error.message);
    }
  } else {
    logTest('TC-MBE-3.4', 'Update Item With Valid ETag Returns 200', false, 'No item to update');
  }
  
  // TC-MBE-3.5: Update with Stale ETag
  if (itemId) {
    try {
      await axios.patch(
        `${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items/${itemId}`,
        { quantity: 2 },
        { headers: { Authorization: `Bearer ${adminToken}`, 'If-Match': '"1"' } }
      );
      logTest('TC-MBE-3.5', 'Update Item With Stale ETag Returns 409', false, 'Should have returned 409');
    } catch (error) {
      logTest('TC-MBE-3.5', 'Update Item With Stale ETag Returns 409', 
        error.response && error.response.status === 409);
    }
  } else {
    logTest('TC-MBE-3.5', 'Update Item With Stale ETag Returns 409', false, 'No item to update');
  }
  
  // TC-MBE-3.6: Consume Item
  if (itemId) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items/${itemId}/consume`,
        { quantity: 1 },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logTest('TC-MBE-3.6', 'Consume Item Returns 200', response.status === 200);
    } catch (error) {
      logTest('TC-MBE-3.6', 'Consume Item Returns 200', false, error.message);
    }
  } else {
    logTest('TC-MBE-3.6', 'Consume Item Returns 200', false, 'No item to consume');
  }
  
  // TC-MBE-3.7: Waste Item
  if (itemId) {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items/${itemId}/waste`,
        { quantity: 1, reason: 'Expired' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logTest('TC-MBE-3.7', 'Waste Item Returns 200', response.status === 200);
    } catch (error) {
      logTest('TC-MBE-3.7', 'Waste Item Returns 200', false, error.message);
    }
  } else {
    logTest('TC-MBE-3.7', 'Waste Item Returns 200', false, 'No item to waste');
  }
  
  // TC-MBE-3.8: Delete Item
  if (itemId) {
    try {
      const response = await axios.delete(
        `${BASE_URL}/api/v1/households/${testSetup.admin.householdId}/items/${itemId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      logTest('TC-MBE-3.8', 'Delete Item Returns 204', response.status === 204);
    } catch (error) {
      logTest('TC-MBE-3.8', 'Delete Item Returns 204', false, error.message);
    }
  } else {
    logTest('TC-MBE-3.8', 'Delete Item Returns 204', false, 'No item to delete');
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Total Tests: ${passCount + failCount}`);
  console.log(`\x1b[32mPassed: ${passCount}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${failCount}\x1b[0m`);
  console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  
  return {
    passed: passCount,
    failed: failCount,
    total: passCount + failCount,
    results: results
  };
}

// Check if server is running
axios.get(`${BASE_URL}/health`)
  .then(() => {
    // Server is running, proceed with tests
    return runTests();
  })
  .then((summary) => {
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\x1b[31mError: Mock backend server is not running on port 8080\x1b[0m');
    console.error('Please start the server with: npm start');
    process.exit(1);
  });