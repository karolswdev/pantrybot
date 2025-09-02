const axios = require('axios');
const { testValidTokenConnection, testInvalidTokenConnection } = require('./test-websocket.js');
const { testItemUpdateBroadcast } = require('./test-tc-mbe-4.3.js');

const BASE_URL = 'http://localhost:8080';
let testResults = [];
let token = null;
let householdId = null;
let userId = null;

// Helper function to run a test
async function runTest(testName, testFunc) {
  try {
    await testFunc();
    testResults.push({ name: testName, passed: true });
    console.log(`✓ ${testName} - PASSED`);
  } catch (error) {
    testResults.push({ name: testName, passed: false, error: error.message });
    console.log(`✗ ${testName} - FAILED: ${error.message}`);
  }
}

// Phase 1 Tests (5 tests)
async function runPhase1Tests() {
  console.log('\n=== PHASE 1: Authentication Tests ===\n');
  
  // TC-MBE-1.1: Health Check
  await runTest('TC-MBE-1.1: Health Check Endpoint Returns 200', async () => {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  // TC-MBE-1.2: User Registration
  await runTest('TC-MBE-1.2: User Registration Creates Account', async () => {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: `regression-test-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      displayName: 'Regression Test User',
      timezone: 'America/New_York'
    });
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    token = response.data.accessToken;
    householdId = response.data.defaultHouseholdId;
    userId = response.data.userId;
  });
  
  // TC-MBE-1.3: Duplicate Email Prevention
  await runTest('TC-MBE-1.3: User Registration Prevents Duplicate Email', async () => {
    const duplicateEmail = `duplicate-${Date.now()}@example.com`;
    
    // First registration
    await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: duplicateEmail,
      password: 'SecurePass123!',
      displayName: 'First User',
      timezone: 'America/New_York'
    });
    
    // Second registration with same email
    try {
      await axios.post(`${BASE_URL}/api/v1/auth/register`, {
        email: duplicateEmail,
        password: 'SecurePass123!',
        displayName: 'Second User',
        timezone: 'America/New_York'
      });
      throw new Error('Should have rejected duplicate email');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        // This is expected
        return;
      }
      throw error;
    }
  });
  
  // TC-MBE-1.4: User Login
  const loginEmail = `login-test-${Date.now()}@example.com`;
  const loginPassword = 'SecurePass123!';
  await axios.post(`${BASE_URL}/api/v1/auth/register`, {
    email: loginEmail,
    password: loginPassword,
    displayName: 'Login Test User',
    timezone: 'America/New_York'
  });
  
  await runTest('TC-MBE-1.4: User Login Returns Valid Token', async () => {
    const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: loginEmail,
      password: loginPassword
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.accessToken) throw new Error('No access token returned');
  });
  
  // TC-MBE-1.5: Invalid Credentials
  await runTest('TC-MBE-1.5: Invalid Credentials Return 401', async () => {
    try {
      await axios.post(`${BASE_URL}/api/v1/auth/login`, {
        email: loginEmail,
        password: 'WrongPassword!'
      });
      throw new Error('Should have returned 401');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return;
      }
      throw error;
    }
  });
}

// Phase 2 Tests (4 tests)
async function runPhase2Tests() {
  console.log('\n=== PHASE 2: Household Management Tests ===\n');
  
  // TC-MBE-2.1: Protected Endpoint Without Token
  await runTest('TC-MBE-2.1: Access Protected Endpoint Without Token Returns 401', async () => {
    try {
      await axios.get(`${BASE_URL}/api/v1/households`);
      throw new Error('Should have returned 401');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return;
      }
      throw error;
    }
  });
  
  // TC-MBE-2.2: List Households
  await runTest('TC-MBE-2.2: List Households With Valid Token Returns 200', async () => {
    const response = await axios.get(`${BASE_URL}/api/v1/households`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  // TC-MBE-2.3: Create Household
  await runTest('TC-MBE-2.3: Create Household With Valid Data Returns 201', async () => {
    const response = await axios.post(`${BASE_URL}/api/v1/households`, {
      name: 'Test Household',
      description: 'A test household'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
  });
  
  // TC-MBE-2.4: Dashboard Stats
  await runTest('TC-MBE-2.4: Get Dashboard Stats Returns 200', async () => {
    const response = await axios.get(`${BASE_URL}/api/v1/dashboard/stats`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Household-Id': householdId
      }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
}

// Phase 3 Tests (8 tests)
async function runPhase3Tests() {
  console.log('\n=== PHASE 3: Inventory Management Tests ===\n');
  
  let itemId = null;
  let etag = null;
  
  // TC-MBE-3.1: Protected Inventory Endpoint
  await runTest('TC-MBE-3.1: Access Inventory Endpoint Without Token Returns 401', async () => {
    try {
      await axios.get(`${BASE_URL}/api/v1/households/${householdId}/items`);
      throw new Error('Should have returned 401');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return;
      }
      throw error;
    }
  });
  
  // TC-MBE-3.2: List Items
  await runTest('TC-MBE-3.2: List Items With Valid Token Returns 200', async () => {
    const response = await axios.get(`${BASE_URL}/api/v1/households/${householdId}/items`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Household-Id': householdId
      }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  // TC-MBE-3.3: Add Item
  await runTest('TC-MBE-3.3: Add Item With Valid Data Returns 201', async () => {
    const response = await axios.post(`${BASE_URL}/api/v1/households/${householdId}/items`, {
      name: 'Test Item',
      quantity: 1,
      unit: 'piece',
      location: 'pantry'
    }, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Household-Id': householdId
      }
    });
    if (response.status !== 201) throw new Error(`Expected 201, got ${response.status}`);
    itemId = response.data.id;
  });
  
  // TC-MBE-3.4: Update Item with Valid ETag
  await runTest('TC-MBE-3.4: Update Item With Valid ETag Returns 200', async () => {
    // First get the item to obtain ETag
    const getResponse = await axios.get(
      `${BASE_URL}/api/v1/households/${householdId}/items/${itemId}`,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Household-Id': householdId
        }
      }
    );
    
    etag = getResponse.headers.etag;
    
    const response = await axios.patch(
      `${BASE_URL}/api/v1/households/${householdId}/items/${itemId}`,
      { quantity: 2 },
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Household-Id': householdId,
          'If-Match': etag
        }
      }
    );
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    // Update etag for next test
    etag = response.headers.etag;
  });
  
  // TC-MBE-3.5: Update Item with Invalid ETag (Conflict)
  await runTest('TC-MBE-3.5: Update Item With Invalid ETag Returns 409', async () => {
    try {
      await axios.patch(
        `${BASE_URL}/api/v1/households/${householdId}/items/${itemId}`,
        { quantity: 3 },
        {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Household-Id': householdId,
            'If-Match': '"invalid-etag"'
          }
        }
      );
      throw new Error('Should have returned 409');
    } catch (error) {
      if (error.response && error.response.status === 409) {
        return;
      }
      throw error;
    }
  });
  
  // TC-MBE-3.6: Search Items  
  await runTest('TC-MBE-3.6: Search Items With Query Returns Filtered Results', async () => {
    const response = await axios.get(
      `${BASE_URL}/api/v1/households/${householdId}/items?search=Test`,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Household-Id': householdId
        }
      }
    );
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!Array.isArray(response.data.items)) throw new Error('Expected items array');
  });
  
  // TC-MBE-3.7: Get Expiring Items
  await runTest('TC-MBE-3.7: Get Expiring Items Returns 200', async () => {
    const response = await axios.get(
      `${BASE_URL}/api/v1/households/${householdId}/items/expiring`,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Household-Id': householdId
        }
      }
    );
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
  });
  
  // TC-MBE-3.8: Delete Item
  await runTest('TC-MBE-3.8: Delete Item Returns 204', async () => {
    const response = await axios.delete(
      `${BASE_URL}/api/v1/households/${householdId}/items/${itemId}`,
      {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Household-Id': householdId
        }
      }
    );
    if (response.status !== 204) throw new Error(`Expected 204, got ${response.status}`);
  });
}

// Phase 4 Tests - WebSocket (3 tests)
async function runPhase4WebSocketTests() {
  console.log('\n=== PHASE 4: WebSocket and Real-Time Tests ===\n');
  
  await runTest('TC-MBE-4.1: WebSocket Connection With Valid Token Succeeds', 
    testValidTokenConnection);
  
  await runTest('TC-MBE-4.2: WebSocket Connection With Invalid Token Fails', 
    testInvalidTokenConnection);
  
  await runTest('TC-MBE-4.3: Item Update Triggers Broadcast', 
    testItemUpdateBroadcast);
}

// Phase 4 Tests - Notification Settings (3 tests)
async function runPhase4NotificationTests() {
  console.log('\n=== PHASE 4: Notification Settings Tests ===\n');
  
  // TC-MBE-4.4: Get Notification Settings
  await runTest('TC-MBE-4.4: Get Notification Settings Returns 200', async () => {
    const response = await axios.get(`${BASE_URL}/api/v1/notifications/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.emailEnabled !== undefined) throw new Error('Missing emailEnabled field');
    if (!response.data.pushEnabled !== undefined) throw new Error('Missing pushEnabled field');
  });
  
  // TC-MBE-4.5: Update Notification Settings
  await runTest('TC-MBE-4.5: Update Notification Settings Saves Preferences', async () => {
    // Update settings
    const updateResponse = await axios.put(`${BASE_URL}/api/v1/notifications/settings`, {
      emailEnabled: false,
      pushEnabled: true,
      telegramEnabled: true,
      expirationWarningDays: 5,
      lowStockWarningEnabled: false
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (updateResponse.status !== 200) throw new Error(`Expected 200, got ${updateResponse.status}`);
    
    // Verify changes were saved
    const getResponse = await axios.get(`${BASE_URL}/api/v1/notifications/settings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (getResponse.status !== 200) throw new Error(`GET failed with ${getResponse.status}`);
    if (getResponse.data.emailEnabled !== false) throw new Error('Email setting not saved');
    if (getResponse.data.pushEnabled !== true) throw new Error('Push setting not saved');
    if (getResponse.data.expirationWarningDays !== 5) throw new Error('Warning days not saved');
  });
  
  // TC-MBE-4.6: Link Telegram Account
  await runTest('TC-MBE-4.6: Link Telegram Account With Valid Code Returns 200', async () => {
    const response = await axios.post(`${BASE_URL}/api/v1/notifications/telegram/link`, {
      verificationCode: 'TEST123456'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}`);
    if (!response.data.success) throw new Error('Expected success: true');
    if (!response.data.telegramUsername) throw new Error('Missing telegramUsername');
  });
}

// Main runner
async function runAllTests() {
  console.log('===========================================');
  console.log('   FULL REGRESSION TEST SUITE');
  console.log('===========================================');
  console.log('Testing against: ' + BASE_URL);
  console.log('Date: ' + new Date().toISOString());
  console.log('Total Test Cases: 25');
  console.log('');
  
  try {
    // Run all phases
    await runPhase1Tests();      // 5 tests
    await runPhase2Tests();      // 4 tests  
    await runPhase3Tests();      // 8 tests
    await runPhase4WebSocketTests();     // 3 tests
    await runPhase4NotificationTests();  // 3 tests
    
    // Summary
    console.log('\n===========================================');
    console.log('           TEST SUMMARY');
    console.log('===========================================\n');
    
    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.filter(t => !t.passed).length;
    const total = testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    } else {
      console.log('\n✅ ALL TESTS PASSED!');
    }
    
    // List all test results
    console.log('\nDetailed Results:');
    console.log('─────────────────');
    testResults.forEach((t, index) => {
      const status = t.passed ? '✓' : '✗';
      console.log(`${(index + 1).toString().padStart(2)}. [${status}] ${t.name}`);
    });
    
    console.log('\n===========================================');
    console.log('      REGRESSION TEST COMPLETE');
    console.log('===========================================');
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();