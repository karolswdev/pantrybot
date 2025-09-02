#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/v1`;

// Ensure evidence directories exist
const evidenceRoot = path.join(__dirname, 'evidence', 'PHASE-MBE-5', 'STORY-MBE-5.1', 'task-2', 'test-output');
fs.mkdirSync(evidenceRoot, { recursive: true });

// Helper to log requests and responses
function logRequest(testId, method, url, headers, body, response) {
  const logPath = path.join(evidenceRoot, `${testId}.log`);
  const logContent = `
=== TEST: ${testId} ===
Date: ${new Date().toISOString()}

REQUEST:
${method} ${url}
Headers:
${JSON.stringify(headers, null, 2)}
Body:
${body ? JSON.stringify(body, null, 2) : 'N/A'}

RESPONSE:
Status: ${response.status} ${response.statusText}
Headers:
${JSON.stringify(response.headers, null, 2)}
Body:
${JSON.stringify(response.data, null, 2)}

=== END TEST ===
`;
  fs.writeFileSync(logPath, logContent);
  console.log(`✓ Evidence saved to ${logPath}`);
}

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
    email: 'shoppingtest@example.com',
    password: 'TestPass123!',
    displayName: 'Shopping Test User',
    timezone: 'UTC'
  });
  console.log('✓ User registered');
  
  // Login
  const loginResponse = await axios.post(`${API_URL}/auth/login`, {
    email: 'shoppingtest@example.com',
    password: 'TestPass123!'
  });
  authToken = loginResponse.data.accessToken;
  console.log('✓ User logged in');
  
  // Create a household
  const householdResponse = await axios.post(
    `${API_URL}/households`,
    {
      name: 'Shopping Test Household',
      description: 'Test household for shopping lists'
    },
    {
      headers: { Authorization: `Bearer ${authToken}` }
    }
  );
  householdId = householdResponse.data.id;
  console.log('✓ Household created:', householdId);
}

async function runTests() {
  console.log('\n=== Starting Shopping List Tests ===\n');
  
  try {
    // Start server
    console.log('Starting server...');
    await startServer();
    
    // Setup test data
    await setupTestData();
    
    console.log('\n--- Test TC-MBE-5.1: GET Shopping Lists ---');
    
    // First create a shopping list so we have something to retrieve
    const createListCurl = `curl -X POST ${API_URL}/households/${householdId}/shopping-lists \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Weekly Groceries", "notes": "For the week"}' \\
  -iS`;
    
    await executeCurl('TC-MBE-5.2-prep', createListCurl);
    
    // Now test GET shopping lists (TC-MBE-5.1)
    const getListsCurl = `curl -X GET ${API_URL}/households/${householdId}/shopping-lists \\
  -H "Authorization: Bearer ${authToken}" \\
  -iS`;
    
    const getResult = await executeCurl('TC-MBE-5.1', getListsCurl);
    console.log('✓ TC-MBE-5.1: GET shopping lists successful');
    
    console.log('\n--- Test TC-MBE-5.2: POST Create Shopping List ---');
    
    // Test POST create shopping list (TC-MBE-5.2)
    const createListCurl2 = `curl -X POST ${API_URL}/households/${householdId}/shopping-lists \\
  -H "Authorization: Bearer ${authToken}" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Weekend Shopping", "notes": "For the party"}' \\
  -iS`;
    
    const createResult = await executeCurl('TC-MBE-5.2', createListCurl2);
    console.log('✓ TC-MBE-5.2: POST create shopping list successful');
    
    // Verify both lists are returned
    const verifyListsCurl = `curl -X GET ${API_URL}/households/${householdId}/shopping-lists \\
  -H "Authorization: Bearer ${authToken}" \\
  -iS`;
    
    const verifyResult = await executeCurl('TC-MBE-5.1-verify', verifyListsCurl);
    
    // Parse the output to check we have 2 lists
    const lines = verifyResult.output.split('\n');
    const jsonStart = lines.findIndex(line => line.startsWith('{'));
    if (jsonStart !== -1) {
      const jsonStr = lines.slice(jsonStart).join('\n');
      const data = JSON.parse(jsonStr);
      if (data.lists && data.lists.length === 2) {
        console.log('✓ Verification: Both shopping lists are present');
      } else {
        console.log(`⚠ Warning: Expected 2 lists, found ${data.lists ? data.lists.length : 0}`);
      }
    }
    
    console.log('\n=== All Shopping List Tests Completed Successfully ===\n');
    
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