const io = require('socket.io-client');
const axios = require('axios');

const BASE_URL = 'http://localhost:8080';

// Test Case TC-MBE-4.3: Item update triggers broadcast
async function testItemUpdateBroadcast() {
  console.log('\n========================================');
  console.log('TEST CASE TC-MBE-4.3: WebSocket - ItemUpdate_TriggersBroadcast');
  console.log('========================================\n');

  let clientA = null;
  let clientB = null;

  try {
    // Create a single user with a household
    console.log('Creating test user with household...');
    const userResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
      email: `test-broadcast-${Date.now()}@example.com`,
      password: 'SecurePass123!',
      displayName: 'Test User',
      timezone: 'America/New_York'
    });
    const token = userResponse.data.accessToken;
    const householdId = userResponse.data.defaultHouseholdId;
    const userId = userResponse.data.userId;
    console.log('✓ User created with household:', householdId);

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
          'Authorization': `Bearer ${token}`,
          'X-Household-Id': householdId
        }
      }
    );
    const itemId = itemResponse.data.id;
    console.log('✓ Test item created:', itemId);

    // Connect two WebSocket clients with the same user (simulating multiple devices)
    console.log('\nConnecting WebSocket clients (simulating two devices for same user)...');
    
    clientA = io(BASE_URL, {
      auth: { token: token }
    });
    
    clientB = io(BASE_URL, {
      auth: { token: token }
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
      clientA.on('connected', (data) => {
        console.log('✓ Client A (Device 1) connected');
        console.log(`  Households: ${JSON.stringify(data.households)}`);
        clientAConnected = true;
        checkAndUpdate();
      });

      clientB.on('connected', (data) => {
        console.log('✓ Client B (Device 2) connected');
        console.log(`  Households: ${JSON.stringify(data.households)}`);
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
        console.log(`  Updated By: ${event.payload.updatedBy}`);
        console.log(`  Timestamp: ${event.payload.timestamp}`);
        
        updateReceived = true;
        clearTimeout(timeout);
        
        if (clientA) clientA.disconnect();
        if (clientB) clientB.disconnect();
        
        console.log('\n✓ TEST PASSED: Item update triggered broadcast to household members');
        resolve(true);
      });

      // Once both clients are connected, update the item via REST API
      async function checkAndUpdate() {
        if (clientAConnected && clientBConnected && !updateReceived) {
          console.log('\n✓ Both clients connected to household room');
          console.log('Updating inventory item via REST API...');
          
          try {
            // First get the item to obtain its ETag
            const getResponse = await axios.get(
              `${BASE_URL}/api/v1/households/${householdId}/items/${itemId}`,
              {
                headers: { 
                  'Authorization': `Bearer ${token}`,
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
                  'Authorization': `Bearer ${token}`,
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