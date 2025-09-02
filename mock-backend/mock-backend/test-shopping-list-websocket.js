#!/usr/bin/env node

const io = require('socket.io-client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/v1`;

// Ensure evidence directories exist
const evidenceRoot = path.join(__dirname, 'evidence', 'PHASE-MBE-5', 'STORY-MBE-5.2', 'task-2', 'test-output');
fs.mkdirSync(evidenceRoot, { recursive: true });

// Helper to log test results
function logTestResult(testId, events) {
  const logPath = path.join(evidenceRoot, `${testId}.log`);
  const logContent = `
=== TEST: ${testId} ===
Date: ${new Date().toISOString()}

WEBSOCKET EVENTS CAPTURED:
${JSON.stringify(events, null, 2)}

TEST STATUS: ${events.length > 0 ? 'PASSED' : 'FAILED'}
Event Count: ${events.length}

=== END TEST ===
`;
  fs.writeFileSync(logPath, logContent);
  console.log(`✓ Evidence saved to ${logPath}`);
}

let server;
let authToken;
let householdId;
let shoppingListId;

async function startServer() {
  // Check if server is already running
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
      console.log('Server:', output.trim());
      if (output.includes('Mock backend server')) {
        setTimeout(resolve, 1000); // Give it a moment to fully start
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });
    
    server.on('error', reject);
  });
}

async function setupTestData() {
  // Reset database
  await axios.post(`${API_URL}/test/reset-db`);
  console.log('✓ Database reset');
  
  // Register a user
  const registerResponse = await axios.post(`${API_URL}/auth/register`, {
    email: 'wstest@example.com',
    password: 'TestPass123!',
    displayName: 'WebSocket Test User',
    timezone: 'UTC'
  });
  console.log('✓ User registered');
  
  // Login
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    email: 'wstest@example.com',
    password: 'TestPass123!'
  });
  authToken = loginResponse.data.accessToken;
  console.log('✓ User logged in');
  
  // Create a household
  const householdResponse = await axios.post(
    `${API_URL}/households`,
    {
      name: 'WebSocket Test Household',
      description: 'Test household for WebSocket events'
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  householdId = householdResponse.data.id;
  console.log('✓ Household created:', householdId);
  
  // Create a shopping list
  const listResponse = await axios.post(
    `${API_URL}/households/${householdId}/shopping-lists`,
    {
      name: 'WebSocket Test List',
      notes: 'For WebSocket testing'
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  shoppingListId = listResponse.data.id;
  console.log('✓ Shopping list created:', shoppingListId);
}

async function testShoppingListItemAdd() {
  console.log('\n--- Test TC-MBE-5.5: WebSocket broadcasts shoppinglist.item.added event ---');
  
  return new Promise((resolve) => {
    const events = [];
    
    // Create two WebSocket clients
    const clientA = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    const clientB = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    // Wait for both clients to connect
    let connectedCount = 0;
    
    clientA.on('connect', () => {
      console.log('Client A connected');
      clientA.emit('join-household', householdId);
      connectedCount++;
      if (connectedCount === 2) {
        performAddItem();
      }
    });
    
    clientB.on('connect', () => {
      console.log('Client B connected');
      clientB.emit('join-household', householdId);
      connectedCount++;
      if (connectedCount === 2) {
        performAddItem();
      }
    });
    
    // Client B listens for the event
    clientB.on('shoppinglist.item.added', (data) => {
      console.log('Client B received shoppinglist.item.added event:', data);
      events.push({
        event: 'shoppinglist.item.added',
        data: data,
        timestamp: new Date().toISOString()
      });
      
      // Log the test result
      logTestResult('TC-MBE-5.5', events);
      
      // Clean up
      clientA.disconnect();
      clientB.disconnect();
      
      resolve(data);
    });
    
    async function performAddItem() {
      // Wait a moment for the room join to process
      await new Promise(r => setTimeout(r, 500));
      
      // Client A adds an item to the shopping list
      console.log('Client A adding item to shopping list...');
      try {
        const response = await axios.post(
          `${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items`,
          {
            name: 'Broadcast Test Item',
            quantity: 1,
            unit: 'piece',
            category: 'Test',
            notes: 'Testing WebSocket broadcast'
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        console.log('Item added successfully:', response.data.id);
      } catch (error) {
        console.error('Error adding item:', error.response?.data || error.message);
        clientA.disconnect();
        clientB.disconnect();
        resolve(null);
      }
    }
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (events.length === 0) {
        console.log('⚠ Timeout: No events received');
        logTestResult('TC-MBE-5.5', events);
      }
      clientA.disconnect();
      clientB.disconnect();
      resolve(null);
    }, 5000);
  });
}

async function testShoppingListItemUpdate(itemId) {
  console.log('\n--- Test TC-MBE-5.6: WebSocket broadcasts shoppinglist.item.updated event ---');
  
  return new Promise((resolve) => {
    const events = [];
    
    // Create two WebSocket clients
    const clientA = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    const clientB = io(BASE_URL, {
      auth: { token: authToken }
    });
    
    // Wait for both clients to connect
    let connectedCount = 0;
    
    clientA.on('connect', () => {
      console.log('Client A connected');
      clientA.emit('join-household', householdId);
      connectedCount++;
      if (connectedCount === 2) {
        performUpdateItem();
      }
    });
    
    clientB.on('connect', () => {
      console.log('Client B connected');
      clientB.emit('join-household', householdId);
      connectedCount++;
      if (connectedCount === 2) {
        performUpdateItem();
      }
    });
    
    // Client B listens for the event
    clientB.on('shoppinglist.item.updated', (data) => {
      console.log('Client B received shoppinglist.item.updated event:', data);
      events.push({
        event: 'shoppinglist.item.updated',
        data: data,
        timestamp: new Date().toISOString()
      });
      
      // Log the test result
      logTestResult('TC-MBE-5.6', events);
      
      // Clean up
      clientA.disconnect();
      clientB.disconnect();
      
      resolve(data);
    });
    
    async function performUpdateItem() {
      // Wait a moment for the room join to process
      await new Promise(r => setTimeout(r, 500));
      
      // First, add an item if we don't have one
      if (!itemId) {
        try {
          const addResponse = await axios.post(
            `${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items`,
            {
              name: 'Item to Update',
              quantity: 1,
              unit: 'piece',
              category: 'Test'
            },
            {
              headers: { Authorization: `Bearer ${authToken}` }
            }
          );
          itemId = addResponse.data.id;
          console.log('Item created for update test:', itemId);
        } catch (error) {
          console.error('Error creating item:', error.response?.data || error.message);
          clientA.disconnect();
          clientB.disconnect();
          resolve(null);
          return;
        }
      }
      
      // Client A updates the item (toggles completed status)
      console.log('Client A updating item completed status...');
      try {
        const response = await axios.patch(
          `${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items/${itemId}`,
          {
            completed: true
          },
          {
            headers: { Authorization: `Bearer ${authToken}` }
          }
        );
        console.log('Item updated successfully, completed:', response.data.completed);
      } catch (error) {
        console.error('Error updating item:', error.response?.data || error.message);
        clientA.disconnect();
        clientB.disconnect();
        resolve(null);
      }
    }
    
    // Timeout after 5 seconds
    setTimeout(() => {
      if (events.length === 0) {
        console.log('⚠ Timeout: No events received');
        logTestResult('TC-MBE-5.6', events);
      }
      clientA.disconnect();
      clientB.disconnect();
      resolve(null);
    }, 5000);
  });
}

async function runTests() {
  console.log('\n=== Starting Shopping List WebSocket Tests ===\n');
  
  try {
    // Start server
    console.log('Starting server...');
    await startServer();
    
    // Setup test data
    await setupTestData();
    
    // Run TC-MBE-5.5: Test shoppinglist.item.added broadcast
    const addResult = await testShoppingListItemAdd();
    if (addResult) {
      console.log('✓ TC-MBE-5.5: Successfully received shoppinglist.item.added event');
    } else {
      console.log('✗ TC-MBE-5.5: Failed to receive shoppinglist.item.added event');
    }
    
    // Wait a moment between tests
    await new Promise(r => setTimeout(r, 1000));
    
    // Run TC-MBE-5.6: Test shoppinglist.item.updated broadcast
    const updateResult = await testShoppingListItemUpdate();
    if (updateResult) {
      console.log('✓ TC-MBE-5.6: Successfully received shoppinglist.item.updated event');
    } else {
      console.log('✗ TC-MBE-5.6: Failed to receive shoppinglist.item.updated event');
    }
    
    console.log('\n=== All Shopping List WebSocket Tests Completed ===\n');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.kill();
      console.log('Server stopped');
    }
    process.exit(0);
  }
}

// Run the tests
runTests().catch(console.error);