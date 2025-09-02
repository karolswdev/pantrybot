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

// Phase 1 Tests
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
    try {
      await axios.post(`${BASE_URL}/api/v1/auth/register`, {
        email: `duplicate-${Date.now()}@example.com`,
        password: 'SecurePass123!',
        displayName: 'First User',
        timezone: 'America/New_York'
      });
      
      await axios.post(`${BASE_URL}/api/v1/auth/register`, {
        email: `duplicate-${Date.now()}@example.com`,
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

// Phase 2 Tests
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

// Phase 3 Tests
async function runPhase3Tests() {
  console.log('\n=== PHASE 3: Inventory Management Tests ===\n');
  
  let itemId = null;
  
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
    
    const etag = getResponse.headers.etag;
    
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
  });
  
  // TC-MBE-3.5: Delete Item
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

// Phase 4 Tests (New WebSocket tests)
async function runPhase4Tests() {
  console.log('\n=== PHASE 4: WebSocket and Real-Time Tests ===\n');
  
  await runTest('TC-MBE-4.1: WebSocket Connection With Valid Token Succeeds', 
    testValidTokenConnection);
  
  await runTest('TC-MBE-4.2: WebSocket Connection With Invalid Token Fails', 
    testInvalidTokenConnection);
  
  await runTest('TC-MBE-4.3: Item Update Triggers Broadcast', 
    testItemUpdateBroadcast);
}

// Main runner
async function runAllTests() {
  console.log('=== RUNNING FULL REGRESSION TEST SUITE ===');
  console.log('Testing against: ' + BASE_URL);
  console.log('Date: ' + new Date().toISOString());
  console.log('');
  
  try {
    await runPhase1Tests();
    await runPhase2Tests();
    await runPhase3Tests();
    await runPhase4Tests();
    
    // Summary
    console.log('\n=== TEST SUMMARY ===\n');
    const passed = testResults.filter(t => t.passed).length;
    const failed = testResults.filter(t => !t.passed).length;
    const total = testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      testResults.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    }
    
    console.log('\n=== REGRESSION TEST COMPLETE ===');
    
    // Exit with appropriate code
    process.exit(failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('Fatal error during test execution:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();