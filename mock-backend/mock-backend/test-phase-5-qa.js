#!/usr/bin/env node

/**
 * Phase 5 QA Test Suite - Shopping Lists
 * Tests TC-MBE-5.1 through TC-MBE-5.6
 */

const axios = require('axios');
const io = require('socket.io-client');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/v1`;

let testResults = {
  total: 6,
  passed: 0,
  failed: 0,
  tests: []
};

// Test user credentials
const testUser = {
  email: `qa${Date.now()}@test.com`,
  password: 'Test123!',
  displayName: 'QA Tester',
  timezone: 'UTC'
};

let authToken = '';
let userId = '';
let householdId = '';
let listId = '';
let itemId = '';

async function setup() {
  console.log('=== Phase 5 QA Test Suite ===\n');
  console.log('Setting up test data...\n');
  
  try {
    // Register user
    const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
    authToken = registerRes.data.accessToken;
    userId = registerRes.data.userId;
    householdId = registerRes.data.defaultHouseholdId;
    
    console.log('✓ Test setup complete\n');
    return true;
  } catch (error) {
    console.error('✗ Setup failed:', error.message);
    return false;
  }
}

async function testTC_MBE_5_1() {
  const testCase = 'TC-MBE-5.1: GET /shopping-lists returns household lists';
  console.log(`Testing ${testCase}...`);
  
  try {
    const response = await axios.get(
      `${API_URL}/households/${householdId}/shopping-lists`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    // Handle both array response or object with lists property
    const lists = Array.isArray(response.data) ? response.data : response.data.lists;
    
    if (response.status === 200 && Array.isArray(lists)) {
      console.log('✓ PASSED:', testCase);
      console.log(`  Response: ${lists.length} lists\n`);
      testResults.passed++;
      testResults.tests.push({ id: 'TC-MBE-5.1', status: 'PASS' });
      return true;
    } else {
      console.log('✗ FAILED:', testCase);
      console.log(`  Status: ${response.status}, Lists is array: ${Array.isArray(lists)}`);
      console.log(`  Data: ${JSON.stringify(response.data).substring(0, 100)}\n`);
      testResults.failed++;
      testResults.tests.push({ id: 'TC-MBE-5.1', status: 'FAIL', error: `Not an array` });
      return false;
    }
  } catch (error) {
    console.log('✗ FAILED:', testCase);
    console.log(`  Error: ${error.response?.status} - ${error.message}\n`);
    testResults.failed++;
    testResults.tests.push({ id: 'TC-MBE-5.1', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testTC_MBE_5_2() {
  const testCase = 'TC-MBE-5.2: POST /shopping-lists creates new list';
  console.log(`Testing ${testCase}...`);
  
  try {
    const response = await axios.post(
      `${API_URL}/households/${householdId}/shopping-lists`,
      { name: 'QA Test Shopping List' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.status === 201 && response.data.id) {
      listId = response.data.id;
      console.log('✓ PASSED:', testCase);
      console.log(`  Created list ID: ${listId}\n`);
      testResults.passed++;
      testResults.tests.push({ id: 'TC-MBE-5.2', status: 'PASS' });
      return true;
    }
  } catch (error) {
    console.log('✗ FAILED:', testCase);
    console.log(`  Error: ${error.message}\n`);
    testResults.failed++;
    testResults.tests.push({ id: 'TC-MBE-5.2', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testTC_MBE_5_3() {
  const testCase = 'TC-MBE-5.3: POST /items adds item to list';
  console.log(`Testing ${testCase}...`);
  
  try {
    const response = await axios.post(
      `${API_URL}/households/${householdId}/shopping-lists/${listId}/items`,
      { name: 'Test Item' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.status === 201 && response.data.id) {
      itemId = response.data.id;
      console.log('✓ PASSED:', testCase);
      console.log(`  Created item ID: ${itemId}\n`);
      testResults.passed++;
      testResults.tests.push({ id: 'TC-MBE-5.3', status: 'PASS' });
      return true;
    }
  } catch (error) {
    console.log('✗ FAILED:', testCase);
    console.log(`  Error: ${error.message}\n`);
    testResults.failed++;
    testResults.tests.push({ id: 'TC-MBE-5.3', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testTC_MBE_5_4() {
  const testCase = 'TC-MBE-5.4: PATCH /items toggles completed status';
  console.log(`Testing ${testCase}...`);
  
  try {
    const response = await axios.patch(
      `${API_URL}/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
      { completed: true },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.status === 200 && response.data.completed === true) {
      console.log('✓ PASSED:', testCase);
      console.log(`  Item marked as completed\n`);
      testResults.passed++;
      testResults.tests.push({ id: 'TC-MBE-5.4', status: 'PASS' });
      return true;
    }
  } catch (error) {
    console.log('✗ FAILED:', testCase);
    console.log(`  Error: ${error.message}\n`);
    testResults.failed++;
    testResults.tests.push({ id: 'TC-MBE-5.4', status: 'FAIL', error: error.message });
    return false;
  }
}

async function testTC_MBE_5_5() {
  const testCase = 'TC-MBE-5.5: WebSocket broadcasts item.added event';
  console.log(`Testing ${testCase}...`);
  
  return new Promise((resolve) => {
    const socket = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    socket.on('connect', () => {
      console.log('  WebSocket connected');
      
      socket.on('shoppinglist.item.added', (data) => {
        console.log('✓ PASSED:', testCase);
        console.log(`  Received broadcast for list ${data.listId}\n`);
        testResults.passed++;
        testResults.tests.push({ id: 'TC-MBE-5.5', status: 'PASS' });
        socket.disconnect();
        resolve(true);
      });
      
      // Trigger the event by adding an item
      setTimeout(async () => {
        try {
          await axios.post(
            `${API_URL}/households/${householdId}/shopping-lists/${listId}/items`,
            { name: 'Broadcast Test Item' },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } catch (error) {
          console.log('✗ FAILED:', testCase);
          console.log(`  Error: ${error.message}\n`);
          testResults.failed++;
          testResults.tests.push({ id: 'TC-MBE-5.5', status: 'FAIL', error: error.message });
          socket.disconnect();
          resolve(false);
        }
      }, 500);
    });
    
    socket.on('connect_error', (error) => {
      console.log('✗ FAILED:', testCase);
      console.log(`  Connection error: ${error.message}\n`);
      testResults.failed++;
      testResults.tests.push({ id: 'TC-MBE-5.5', status: 'FAIL', error: error.message });
      resolve(false);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('✗ FAILED:', testCase);
      console.log(`  Timeout: No broadcast received\n`);
      testResults.failed++;
      testResults.tests.push({ id: 'TC-MBE-5.5', status: 'FAIL', error: 'Timeout' });
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

async function testTC_MBE_5_6() {
  const testCase = 'TC-MBE-5.6: WebSocket broadcasts item.updated event';
  console.log(`Testing ${testCase}...`);
  
  return new Promise((resolve) => {
    const socket = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    socket.on('connect', () => {
      console.log('  WebSocket connected');
      
      socket.on('shoppinglist.item.updated', (data) => {
        console.log('✓ PASSED:', testCase);
        console.log(`  Received update broadcast for list ${data.listId}\n`);
        testResults.passed++;
        testResults.tests.push({ id: 'TC-MBE-5.6', status: 'PASS' });
        socket.disconnect();
        resolve(true);
      });
      
      // Trigger the event by updating an item
      setTimeout(async () => {
        try {
          await axios.patch(
            `${API_URL}/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
            { completed: false },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
        } catch (error) {
          console.log('✗ FAILED:', testCase);
          console.log(`  Error: ${error.message}\n`);
          testResults.failed++;
          testResults.tests.push({ id: 'TC-MBE-5.6', status: 'FAIL', error: error.message });
          socket.disconnect();
          resolve(false);
        }
      }, 500);
    });
    
    socket.on('connect_error', (error) => {
      console.log('✗ FAILED:', testCase);
      console.log(`  Connection error: ${error.message}\n`);
      testResults.failed++;
      testResults.tests.push({ id: 'TC-MBE-5.6', status: 'FAIL', error: error.message });
      resolve(false);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      console.log('✗ FAILED:', testCase);
      console.log(`  Timeout: No broadcast received\n`);
      testResults.failed++;
      testResults.tests.push({ id: 'TC-MBE-5.6', status: 'FAIL', error: 'Timeout' });
      socket.disconnect();
      resolve(false);
    }, 5000);
  });
}

async function runTests() {
  if (!await setup()) {
    console.log('\n❌ Setup failed, cannot continue with tests\n');
    process.exit(1);
  }
  
  // Run tests sequentially
  await testTC_MBE_5_1();
  await testTC_MBE_5_2();
  await testTC_MBE_5_3();
  await testTC_MBE_5_4();
  await testTC_MBE_5_5();
  await testTC_MBE_5_6();
  
  // Print summary
  console.log('=== Phase 5 Test Summary ===\n');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${(testResults.passed / testResults.total * 100).toFixed(1)}%\n`);
  
  if (testResults.failed === 0) {
    console.log('✅ All Phase 5 tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Review the results above.\n');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});