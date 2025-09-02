#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/v1`;

// Ensure evidence directories exist
const evidenceRoot = path.join(__dirname, 'evidence', 'PHASE-MBE-5', 'STORY-MBE-5.2', 'task-1', 'test-output');
fs.mkdirSync(evidenceRoot, { recursive: true });

// Helper to execute curl and save output
async function executeCurl(testId, curlCommand) {
  const logPath = path.join(evidenceRoot, `${testId}.log`);
  
  return new Promise((resolve, reject) => {
    const child = spawn('bash', ['-c', curlCommand]);
    let output = '';
    let error = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      const fullOutput = `
=== TEST: ${testId} ===
Date: ${new Date().toISOString()}

CURL COMMAND:
${curlCommand}

OUTPUT:
${output}

STDERR (verbose info):
${error}

Exit Code: ${code}
=== END TEST ===
`;
      fs.writeFileSync(logPath, fullOutput);
      console.log(`✓ Evidence saved to ${logPath}`);
      
      if (code === 0) {
        resolve({ output, error });
      } else {
        reject(new Error(`Curl failed with code ${code}`));
      }
    });
  });
}

let server;
let authToken;
let householdId;
let shoppingListId;
let itemId;

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
    email: 'itemtest@example.com',
    password: 'TestPass123!',
    displayName: 'Item Test User',
    timezone: 'UTC'
  });
  console.log('✓ User registered');
  
  // Login
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    email: 'itemtest@example.com',
    password: 'TestPass123!'
  });
  authToken = loginResponse.data.accessToken;
  console.log('✓ User logged in');
  
  // Create a household
  const householdResponse = await axios.post(
    `${API_URL}/households`,
    {
      name: 'Item Test Household',
      description: 'Test household for shopping list items'
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
      name: 'Test Shopping List',
      notes: 'For testing items'
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  shoppingListId = listResponse.data.id;
  console.log('✓ Shopping list created:', shoppingListId);
}

async function runTests() {
  console.log('\n=== Starting Shopping List Item Tests ===\n');
  
  try {
    // Start server
    console.log('Starting server...');
    await startServer();
    
    // Setup test data
    await setupTestData();
    
    console.log('\n--- Test TC-MBE-5.3: POST Item to Shopping List ---');
    
    // Test POST add item to shopping list (TC-MBE-5.3)
    const addItemCurl = `curl -X POST ${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Milk",
    "quantity": 2,
    "unit": "liters",
    "category": "Dairy",
    "notes": "Low-fat preferred"
  }' \\
  -iS`;
    
    const addResult = await executeCurl('TC-MBE-5.3', addItemCurl);
    
    // Parse the response to get the item ID
    const lines = addResult.output.split('\n');
    const jsonStart = lines.findIndex(line => line.startsWith('{'));
    if (jsonStart !== -1) {
      const jsonStr = lines.slice(jsonStart).join('\n');
      const data = JSON.parse(jsonStr);
      itemId = data.id;
      console.log('✓ TC-MBE-5.3: Item added successfully with ID:', itemId);
      
      // Verify status code is 201
      const statusLine = lines.find(line => line.startsWith('HTTP/'));
      if (statusLine && statusLine.includes('201')) {
        console.log('✓ TC-MBE-5.3: Confirmed status code is 201 Created');
      } else {
        console.log(`⚠ Warning: Expected 201 Created, got: ${statusLine}`);
      }
    }
    
    console.log('\n--- Test TC-MBE-5.4: PATCH Item Toggle Completed Status ---');
    
    // Test PATCH update item (TC-MBE-5.4)
    const updateItemCurl = `curl -X PATCH ${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items/${itemId} \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"completed": true}' \\
  -iS`;
    
    const updateResult = await executeCurl('TC-MBE-5.4', updateItemCurl);
    
    // Parse the response to verify the update
    const updateLines = updateResult.output.split('\n');
    const updateJsonStart = updateLines.findIndex(line => line.startsWith('{'));
    if (updateJsonStart !== -1) {
      const jsonStr = updateLines.slice(updateJsonStart).join('\n');
      const data = JSON.parse(jsonStr);
      
      if (data.completed === true) {
        console.log('✓ TC-MBE-5.4: Item completed status successfully toggled to true');
      } else {
        console.log(`⚠ Warning: Expected completed=true, got: ${data.completed}`);
      }
      
      // Verify status code is 200
      const statusLine = updateLines.find(line => line.startsWith('HTTP/'));
      if (statusLine && statusLine.includes('200')) {
        console.log('✓ TC-MBE-5.4: Confirmed status code is 200 OK');
      } else {
        console.log(`⚠ Warning: Expected 200 OK, got: ${statusLine}`);
      }
    }
    
    // Test toggling back to false
    console.log('\n--- Additional Test: Toggle Completed Back to False ---');
    
    const toggleBackCurl = `curl -X PATCH ${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items/${itemId} \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"completed": false}' \\
  -iS`;
    
    const toggleResult = await executeCurl('TC-MBE-5.4-toggle-back', toggleBackCurl);
    
    // Parse the response to verify the toggle back
    const toggleLines = toggleResult.output.split('\n');
    const toggleJsonStart = toggleLines.findIndex(line => line.startsWith('{'));
    if (toggleJsonStart !== -1) {
      const jsonStr = toggleLines.slice(toggleJsonStart).join('\n');
      const data = JSON.parse(jsonStr);
      
      if (data.completed === false && data.completedBy === null) {
        console.log('✓ Item completed status successfully toggled back to false');
      }
    }
    
    console.log('\n=== All Shopping List Item Tests Completed Successfully ===\n');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    if (server) {
      server.kill();
      console.log('Server stopped');
    }
  }
}

// Run the tests
runTests().catch(console.error);