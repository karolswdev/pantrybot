#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/v1`;

// Test result tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Evidence directory
const evidenceRoot = path.join(__dirname, 'evidence', 'PHASE-MBE-5', 'STORY-MBE-5.2');
fs.mkdirSync(path.join(evidenceRoot, 'regression-test'), { recursive: true });

function logTest(testId, passed, message = '') {
  totalTests++;
  if (passed) {
    passedTests++;
    console.log(`✓ ${testId}: PASSED ${message}`);
  } else {
    failedTests++;
    console.log(`✗ ${testId}: FAILED ${message}`);
  }
  testResults.push({ testId, passed, message, timestamp: new Date().toISOString() });
}

let server;
let authToken;
let refreshToken;
let householdId;
let userId;

async function startServer() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.status === 'ok') {
      console.log('Server already running');
      return;
    }
  } catch (error) {
    // Server not running, start it
  }
  
  return new Promise((resolve, reject) => {
    server = spawn('node', ['index.js'], { cwd: __dirname });
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Mock backend server')) {
        setTimeout(resolve, 1000);
      }
    });
    
    server.on('error', reject);
    setTimeout(resolve, 3000); // Fallback timeout
  });
}

async function runPhase1Tests() {
  console.log('\n=== PHASE 1: Authentication Tests ===\n');
  
  // Reset database
  await axios.post(`${API_URL}/test/reset-db`);
  
  // TC-MBE-1.1: Health check
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logTest('TC-MBE-1.1', response.status === 200 && response.data.status === 'ok');
  } catch (error) {
    logTest('TC-MBE-1.1', false, error.message);
  }
  
  // TC-MBE-1.2: Register with valid data
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'TestPass123!',
      displayName: 'Test User',
      timezone: 'UTC'
    });
    userId = response.data.user?.id;
    logTest('TC-MBE-1.2', response.status === 201 && response.data.user);
  } catch (error) {
    logTest('TC-MBE-1.2', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-1.3: Register duplicate email
  try {
    await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      password: 'TestPass123!',
      displayName: 'Duplicate User',
      timezone: 'UTC'
    });
    logTest('TC-MBE-1.3', false, 'Should have rejected duplicate');
  } catch (error) {
    logTest('TC-MBE-1.3', error.response?.status === 409);
  }
  
  // TC-MBE-1.4: Login with valid credentials
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'TestPass123!'
    });
    authToken = response.data.accessToken;
    refreshToken = response.data.refreshToken;
    logTest('TC-MBE-1.4', response.status === 200 && authToken && refreshToken);
  } catch (error) {
    logTest('TC-MBE-1.4', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-1.5: Login with invalid credentials
  try {
    await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'WrongPass'
    });
    logTest('TC-MBE-1.5', false, 'Should have rejected invalid password');
  } catch (error) {
    logTest('TC-MBE-1.5', error.response?.status === 401);
  }
  
  // TC-MBE-1.6: Refresh token
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });
    authToken = response.data.accessToken;
    logTest('TC-MBE-1.6', response.status === 200 && response.data.accessToken);
  } catch (error) {
    logTest('TC-MBE-1.6', false, error.response?.data?.message || error.message);
  }
}

async function runPhase2Tests() {
  console.log('\n=== PHASE 2: Household Management Tests ===\n');
  
  // TC-MBE-2.1: Access protected endpoint without token
  try {
    await axios.get(`${API_URL}/households`);
    logTest('TC-MBE-2.1', false, 'Should have required auth');
  } catch (error) {
    logTest('TC-MBE-2.1', error.response?.status === 401);
  }
  
  // TC-MBE-2.2: List households (empty initially)
  try {
    const response = await axios.get(`${API_URL}/households`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-2.2', response.status === 200 && Array.isArray(response.data.households));
  } catch (error) {
    logTest('TC-MBE-2.2', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-2.3: Create household
  try {
    const response = await axios.post(`${API_URL}/households`, {
      name: 'Test Household',
      description: 'Test Description'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    householdId = response.data.id;
    logTest('TC-MBE-2.3', response.status === 201 && householdId);
  } catch (error) {
    logTest('TC-MBE-2.3', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-2.4: Get household details
  try {
    const response = await axios.get(`${API_URL}/households/${householdId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-2.4', response.status === 200 && response.data.id === householdId);
  } catch (error) {
    logTest('TC-MBE-2.4', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-2.5: Create invitation
  try {
    const response = await axios.post(`${API_URL}/households/${householdId}/invitations`, {
      email: 'invitee@example.com',
      role: 'member'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-2.5', response.status === 201 && response.data.invitationId);
  } catch (error) {
    logTest('TC-MBE-2.5', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-2.6: List members
  try {
    const response = await axios.get(`${API_URL}/households/${householdId}/members`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-2.6', response.status === 200 && Array.isArray(response.data.members));
  } catch (error) {
    logTest('TC-MBE-2.6', false, error.response?.data?.message || error.message);
  }
}

async function runPhase3Tests() {
  console.log('\n=== PHASE 3: Inventory Management Tests ===\n');
  
  let itemId;
  let etag;
  
  // TC-MBE-3.1: List items (empty initially)
  try {
    const response = await axios.get(`${API_URL}/households/${householdId}/items`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-3.1', response.status === 200 && Array.isArray(response.data.items));
  } catch (error) {
    logTest('TC-MBE-3.1', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-3.2: Get expiring items (empty)
  try {
    const response = await axios.get(`${API_URL}/households/${householdId}/items/expiring`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-3.2', response.status === 200 && Array.isArray(response.data.items));
  } catch (error) {
    logTest('TC-MBE-3.2', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-3.3: Add inventory item
  try {
    const response = await axios.post(`${API_URL}/households/${householdId}/items`, {
      name: 'Test Item',
      quantity: 1,
      unit: 'piece',
      location: 'Fridge',
      category: 'Dairy',
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    itemId = response.data.id;
    logTest('TC-MBE-3.3', response.status === 201 && itemId);
  } catch (error) {
    logTest('TC-MBE-3.3', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-3.4: Get item details with ETag
  try {
    const response = await axios.get(`${API_URL}/households/${householdId}/items/${itemId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    etag = response.headers.etag;
    logTest('TC-MBE-3.4', response.status === 200 && etag);
  } catch (error) {
    logTest('TC-MBE-3.4', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-3.5: Update item with ETag
  try {
    const response = await axios.patch(`${API_URL}/households/${householdId}/items/${itemId}`, {
      quantity: 2
    }, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'If-Match': etag
      }
    });
    logTest('TC-MBE-3.5', response.status === 200);
  } catch (error) {
    logTest('TC-MBE-3.5', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-3.6: Mark item as consumed
  try {
    const response = await axios.post(`${API_URL}/households/${householdId}/items/${itemId}/consume`, {
      quantity: 1,
      reason: 'Used for cooking'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-3.6', response.status === 200);
  } catch (error) {
    logTest('TC-MBE-3.6', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-3.7: Mark item as wasted
  try {
    // Create a new item to waste
    const newItem = await axios.post(`${API_URL}/households/${householdId}/items`, {
      name: 'Waste Item',
      quantity: 1,
      unit: 'piece',
      location: 'Fridge'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    const response = await axios.post(`${API_URL}/households/${householdId}/items/${newItem.data.id}/waste`, {
      quantity: 1,
      reason: 'Expired'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-3.7', response.status === 200);
  } catch (error) {
    logTest('TC-MBE-3.7', false, error.response?.data?.message || error.message);
  }
}

async function runPhase4Tests() {
  console.log('\n=== PHASE 4: Dashboard & Notifications Tests ===\n');
  
  // TC-MBE-4.1: Get dashboard stats
  try {
    const response = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-4.1', response.status === 200 && response.data.totalItems !== undefined);
  } catch (error) {
    logTest('TC-MBE-4.1', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-4.2: Get item history
  try {
    const response = await axios.get(`${API_URL}/households/${householdId}/items/history`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-4.2', response.status === 200 && Array.isArray(response.data.history));
  } catch (error) {
    logTest('TC-MBE-4.2', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-4.3: WebSocket inventory broadcast
  const wsTestPassed = await new Promise((resolve) => {
    const socket = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    socket.on('connect', () => {
      socket.emit('join-household', householdId);
      
      socket.on('item.added', (data) => {
        socket.disconnect();
        resolve(true);
      });
      
      // Trigger an item add
      axios.post(`${API_URL}/households/${householdId}/items`, {
        name: 'WebSocket Test Item',
        quantity: 1,
        unit: 'piece',
        location: 'Fridge'
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    });
    
    setTimeout(() => {
      socket.disconnect();
      resolve(false);
    }, 3000);
  });
  logTest('TC-MBE-4.3', wsTestPassed);
  
  // TC-MBE-4.4: Get notification settings
  try {
    const response = await axios.get(`${API_URL}/notifications/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-4.4', response.status === 200 && response.data.preferences);
  } catch (error) {
    logTest('TC-MBE-4.4', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-4.5: Update notification settings
  try {
    const response = await axios.put(`${API_URL}/notifications/settings`, {
      email: { enabled: true },
      inApp: { enabled: true },
      preferences: {
        expirationWarningDays: 3,
        notificationTypes: ['expiration', 'lowStock']
      }
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-4.5', response.status === 200);
  } catch (error) {
    logTest('TC-MBE-4.5', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-4.6: Link Telegram account
  try {
    const response = await axios.post(`${API_URL}/notifications/telegram/link`, {
      telegramUsername: 'testuser'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-4.6', response.status === 200 && response.data.verificationCode);
  } catch (error) {
    logTest('TC-MBE-4.6', false, error.response?.data?.message || error.message);
  }
}

async function runPhase5Tests() {
  console.log('\n=== PHASE 5: Shopping Lists Tests ===\n');
  
  let shoppingListId;
  let itemId;
  
  // TC-MBE-5.1: List shopping lists
  try {
    const response = await axios.get(`${API_URL}/households/${householdId}/shopping-lists`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-5.1', response.status === 200 && Array.isArray(response.data.lists));
  } catch (error) {
    logTest('TC-MBE-5.1', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-5.2: Create shopping list
  try {
    const response = await axios.post(`${API_URL}/households/${householdId}/shopping-lists`, {
      name: 'Test Shopping List',
      notes: 'Test notes'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    shoppingListId = response.data.id;
    logTest('TC-MBE-5.2', response.status === 201 && shoppingListId);
  } catch (error) {
    logTest('TC-MBE-5.2', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-5.3: Add item to shopping list
  try {
    const response = await axios.post(`${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items`, {
      name: 'Shopping Item',
      quantity: 2,
      unit: 'pieces',
      category: 'Test'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    itemId = response.data.id;
    logTest('TC-MBE-5.3', response.status === 201 && itemId);
  } catch (error) {
    logTest('TC-MBE-5.3', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-5.4: Update shopping list item
  try {
    const response = await axios.patch(`${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items/${itemId}`, {
      completed: true
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logTest('TC-MBE-5.4', response.status === 200 && response.data.completed === true);
  } catch (error) {
    logTest('TC-MBE-5.4', false, error.response?.data?.message || error.message);
  }
  
  // TC-MBE-5.5: WebSocket shopping list item added broadcast
  const wsAddTestPassed = await new Promise((resolve) => {
    const socket = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    socket.on('connect', () => {
      socket.emit('join-household', householdId);
      
      socket.on('shoppinglist.item.added', (data) => {
        socket.disconnect();
        resolve(true);
      });
      
      // Trigger an item add
      setTimeout(() => {
        axios.post(`${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items`, {
          name: 'WebSocket Test Shopping Item',
          quantity: 1
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }, 500);
    });
    
    setTimeout(() => {
      socket.disconnect();
      resolve(false);
    }, 3000);
  });
  logTest('TC-MBE-5.5', wsAddTestPassed);
  
  // TC-MBE-5.6: WebSocket shopping list item updated broadcast
  const wsUpdateTestPassed = await new Promise((resolve) => {
    const socket = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    socket.on('connect', () => {
      socket.emit('join-household', householdId);
      
      socket.on('shoppinglist.item.updated', (data) => {
        socket.disconnect();
        resolve(true);
      });
      
      // Trigger an item update
      setTimeout(() => {
        axios.patch(`${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items/${itemId}`, {
          completed: false
        }, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }, 500);
    });
    
    setTimeout(() => {
      socket.disconnect();
      resolve(false);
    }, 3000);
  });
  logTest('TC-MBE-5.6', wsUpdateTestPassed);
}

async function runAllTests() {
  console.log('\n=== Starting Full Regression Test Suite ===\n');
  console.log('Target: 31 test cases across 5 phases\n');
  
  try {
    await startServer();
    
    await runPhase1Tests();
    await runPhase2Tests();
    await runPhase3Tests();
    await runPhase4Tests();
    await runPhase5Tests();
    
    // Generate summary
    console.log('\n=== Test Summary ===\n');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    // Save summary to evidence
    const summaryPath = path.join(evidenceRoot, 'regression-test.log');
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      successRate: `${((passedTests / totalTests) * 100).toFixed(1)}%`,
      targetTests: 31,
      actualTests: totalTests,
      results: testResults
    };
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`\n✓ Test summary saved to ${summaryPath}`);
    
    if (failedTests === 0 && totalTests === 31) {
      console.log('\n✅ ALL 31 TESTS PASSED! Phase 5 Story 2 Complete!\n');
    } else if (failedTests > 0) {
      console.log('\n❌ Some tests failed. Please review the results.\n');
      process.exit(1);
    } else if (totalTests !== 31) {
      console.log(`\n⚠️ Expected 31 tests but ran ${totalTests}\n`);
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.kill();
    }
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

// Run the tests
runAllTests();