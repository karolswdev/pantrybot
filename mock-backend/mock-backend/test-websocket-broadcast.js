const io = require('socket.io-client');
const axios = require('axios');
const db = require('./db');

const BASE_URL = 'http://localhost:8080';

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
    const userAId = userAResponse.data.userId;
    console.log('✓ User A created with household:', householdId);

    // User B - create and directly add to household via db manipulation
    const userBEmail = `test-broadcast-b-${Date.now()}@example.com`;
    const userBResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: userBEmail,
      password: 'SecurePass123!',
      displayName: 'User B',
      timezone: 'America/New_York'
    });
    const userBId = userBResponse.data.userId;
    
    // Directly add User B to User A's household in the mock database BEFORE getting token
    db.household_members.push({
      id: require('uuid').v4(),
      householdId: householdId,
      userId: userBId,
      role: 'member',
      joinedAt: new Date().toISOString()
    });
    console.log('✓ User B added to household (via direct DB update for testing)');
    
    // Now login again to get a fresh token that will include the new membership
    const loginResponse = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
      email: userBEmail,
      password: 'SecurePass123!'
    });
    const tokenB = loginResponse.data.accessToken;

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

      clientB.on('connected', (data) => {
        console.log('✓ Client B connected');
        console.log(`  Client B households: ${JSON.stringify(data.households)}`);
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
            // First get the item to obtain its ETag
            const getResponse = await axios.get(
              `${BASE_URL}/api/v1/households/${householdId}/items/${itemId}`,
              {
                headers: { 
                  'Authorization': `Bearer ${tokenA}`,
                  'X-Household-Id': householdId
                }
              }
            );
            
            const etag = getResponse.headers.etag || 'W/"1"';
            
            // Now update with proper ETag
            await axios.patch(
              `${BASE_URL}/api/v1/households/${householdId}/items/${itemId}`,
              {
                quantity: 5,
                notes: 'Updated via WebSocket test'
              },
              {
                headers: { 
                  'Authorization': `Bearer ${tokenA}`,
                  'X-Household-Id': householdId,
                  'If-Match': etag
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

// Run test if executed directly
if (require.main === module) {
  testItemUpdateBroadcast()
    .then(() => {
      console.log('\nTest completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nTest failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testItemUpdateBroadcast };