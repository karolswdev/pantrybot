const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

// Helper function to get a valid JWT token
async function getValidToken() {
  try {
    // Register a test user
    const registerResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: `test-ws-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      displayName: 'WebSocket Test User',
      timezone: 'America/New_York'
    });
    
    return registerResponse.data.accessToken;
  } catch (error) {
    console.error('Failed to get valid token:', error.message);
    throw error;
  }
}

// Test Case TC-MBE-4.1: Connection with valid token succeeds
async function testValidTokenConnection() {
  console.log('\n========================================');
  console.log('TEST CASE TC-MBE-4.1: WebSocket - Connection_WithValidToken_Succeeds');
  console.log('========================================\n');
  
  try {
    // Get a valid JWT token
    console.log('Getting valid JWT token...');
    const token = await getValidToken();
    console.log('✓ Valid token obtained');

    // Attempt WebSocket connection with valid token
    console.log('\nAttempting WebSocket connection with valid token...');
    const socket = io(BASE_URL, {
      auth: {
        token: token
      }
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Connection timeout'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        console.log('✓ WebSocket connection established successfully');
        console.log(`  Socket ID: ${socket.id}`);
      });

      socket.on('connected', (data) => {
        console.log('✓ Received connection success event from server');
        console.log(`  User ID: ${data.userId}`);
        console.log(`  Households: ${JSON.stringify(data.households)}`);
        
        socket.disconnect();
        console.log('\n✓ TEST PASSED: Connection with valid token succeeded');
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        socket.disconnect();
        console.error('✗ Connection failed:', error.message);
        reject(error);
      });
    });
  } catch (error) {
    console.error('\n✗ TEST FAILED:', error.message);
    throw error;
  }
}

// Test Case TC-MBE-4.2: Connection with invalid token fails
async function testInvalidTokenConnection() {
  console.log('\n========================================');
  console.log('TEST CASE TC-MBE-4.2: WebSocket - Connection_WithInvalidToken_Fails');
  console.log('========================================\n');

  try {
    // Test with invalid token
    console.log('Attempting WebSocket connection with invalid token...');
    const socket = io(BASE_URL, {
      auth: {
        token: 'invalid-token-12345'
      }
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        socket.disconnect();
        reject(new Error('Expected connection to fail, but no error received'));
      }, 5000);

      socket.on('connect', () => {
        clearTimeout(timeout);
        socket.disconnect();
        console.error('✗ Unexpected: Connection succeeded with invalid token');
        reject(new Error('Connection should have failed with invalid token'));
      });

      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.log('✓ Connection rejected as expected');
        console.log(`  Error message: ${error.message}`);
        socket.disconnect();
        console.log('\n✓ TEST PASSED: Connection with invalid token was properly rejected');
        resolve(true);
      });
    });
  } catch (error) {
    console.error('\n✗ TEST FAILED:', error.message);
    throw error;
  }
}

// Test Case TC-MBE-4.3: Item update triggers broadcast
async function testItemUpdateBroadcast() {
  console.log('\n========================================');
  console.log('TEST CASE TC-MBE-4.3: WebSocket - ItemUpdate_TriggersBroadcast');
  console.log('========================================\n');

  let clientA = null;
  let clientB = null;

  try {
    // Create two users in the same household
    console.log('Creating two test users...');
    
    // User A - creates household
    const userAResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: `test-broadcast-a-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      displayName: 'User A',
      timezone: 'America/New_York'
    });
    const tokenA = userAResponse.data.accessToken;
    const householdId = userAResponse.data.defaultHouseholdId;
    console.log('✓ User A created with household:', householdId);

    // Add an inventory item first
    const itemResponse = await axios.post(
      `${BASE_URL}/api/v1/households/${householdId}/items`,
      {
        name: 'Test Broadcast Item',
        quantity: 1,
        unit: 'piece',
        location: 'pantry'
      },
      {
        headers: { 
          'Authorization': `Bearer ${tokenA}`,
          'X-Household-Id': householdId
        }
      }
    );
    const itemId = itemResponse.data.id;
    console.log('✓ Test item created:', itemId);

    // User B - joins household
    const userBEmail = `test-broadcast-b-${Date.now()}@example.com`;
    const userBResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: userBEmail,
      password: 'SecurePass123!',
      displayName: 'User B',
      timezone: 'America/New_York'
    });
    const tokenB = userBResponse.data.accessToken;
    const userBId = userBResponse.data.userId;
    
    // Add User B to User A's household by email (as per the API)
    await axios.post(
      `${BASE_URL}/api/v1/households/${householdId}/members`,
      {
        email: userBEmail,
        role: 'member'
      },
      {
        headers: { 'Authorization': `Bearer ${tokenA}` }
      }
    );
    console.log('✓ User B invited to household');

    // Connect both clients via WebSocket
    console.log('\nConnecting WebSocket clients...');
    
    clientA = io(BASE_URL, {
      auth: { token: tokenA }
    });
    
    clientB = io(BASE_URL, {
      auth: { token: tokenB }
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (clientA) clientA.disconnect();
        if (clientB) clientB.disconnect();
        reject(new Error('Test timeout'));
      }, 10000);

      let clientAConnected = false;
      let clientBConnected = false;
      let updateReceived = false;

      // Wait for both clients to connect
      clientA.on('connected', () => {
        console.log('✓ Client A connected');
        clientAConnected = true;
        checkAndUpdate();
      });

      clientB.on('connected', () => {
        console.log('✓ Client B connected');
        clientBConnected = true;
        checkAndUpdate();
      });

      // Client B listens for item update events
      clientB.on('item.updated', (event) => {
        console.log('\n✓ Client B received item.updated event:');
        console.log(`  Event Type: ${event.type}`);
        console.log(`  Household ID: ${event.householdId}`);
        console.log(`  Item ID: ${event.payload.itemId}`);
        console.log(`  Changes: ${JSON.stringify(event.payload.changes)}`);
        
        updateReceived = true;
        clearTimeout(timeout);
        
        if (clientA) clientA.disconnect();
        if (clientB) clientB.disconnect();
        
        console.log('\n✓ TEST PASSED: Item update triggered broadcast to household members');
        resolve(true);
      });

      // Once both clients are connected, Client A updates the item
      async function checkAndUpdate() {
        if (clientAConnected && clientBConnected && !updateReceived) {
          console.log('\n✓ Both clients connected to household room');
          console.log('Client A updating inventory item...');
          
          try {
            await axios.patch(
              `${BASE_URL}/api/v1/households/${householdId}/items/${itemId}`,
              {
                quantity: 5,
                notes: 'Updated via WebSocket test'
              },
              {
                headers: { 
                  'Authorization': `Bearer ${tokenA}`,
                  'X-Household-Id': householdId
                }
              }
            );
            console.log('✓ Item update request sent');
          } catch (error) {
            clearTimeout(timeout);
            if (clientA) clientA.disconnect();
            if (clientB) clientB.disconnect();
            reject(error);
          }
        }
      }

      // Handle connection errors
      clientA.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Client A connection error: ${error.message}`));
      });

      clientB.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`Client B connection error: ${error.message}`));
      });
    });
  } catch (error) {
    console.error('\n✗ TEST FAILED:', error.message);
    if (clientA) clientA.disconnect();
    if (clientB) clientB.disconnect();
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('Starting WebSocket tests...');
  console.log('Make sure the mock backend server is running on port 8080\n');

  try {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Run TC-MBE-4.1
    await testValidTokenConnection();
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Run TC-MBE-4.2
    await testInvalidTokenConnection();
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Run TC-MBE-4.3
    await testItemUpdateBroadcast();
    
    console.log('\n========================================');
    console.log('ALL WEBSOCKET TESTS PASSED SUCCESSFULLY');
    console.log('========================================\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\nWebSocket tests failed:', error.message);
    process.exit(1);
  }
}

// Export individual test functions for modular testing
module.exports = {
  testValidTokenConnection,
  testInvalidTokenConnection,
  testItemUpdateBroadcast
};

// Run tests if executed directly
if (require.main === module) {
  runTests();
}