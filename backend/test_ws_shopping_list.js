const io = require('socket.io-client');
const axios = require('axios');

const API_URL = 'http://localhost:8080';

async function testShoppingListWebSocket() {
  console.log('=== TEST: TC-MBE-5.5 & TC-MBE-5.6 ===');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('');

  try {
    // Register a user
    const registerRes = await axios.post(`${API_URL}/api/v1/auth/register`, {
      email: 'ws.test5@example.com',
      password: 'password123',
      displayName: 'WS Test User 5'
    });
    const token = registerRes.data.accessToken;

    // Create household
    const householdRes = await axios.post(`${API_URL}/api/v1/households`, {
      name: 'WS Test Household 5',
      description: 'Testing WebSocket shopping list events'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const householdId = householdRes.data.id;

    // Create shopping list
    const listRes = await axios.post(`${API_URL}/api/v1/households/${householdId}/shopping-lists`, {
      name: 'WS Test List'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const listId = listRes.data.id;

    // Connect WebSocket client
    const socket = io(API_URL, {
      auth: { token }
    });

    const events = [];

    await new Promise((resolve, reject) => {
      socket.on('connect', async () => {
        console.log('WebSocket connected');

        // Listen for events
        socket.on('shoppinglist.item.added', (data) => {
          events.push({
            event: 'shoppinglist.item.added',
            data,
            timestamp: new Date().toISOString()
          });
        });

        socket.on('shoppinglist.item.updated', (data) => {
          events.push({
            event: 'shoppinglist.item.updated',
            data,
            timestamp: new Date().toISOString()
          });
        });

        // Give time for event handlers to register
        await new Promise(r => setTimeout(r, 100));

        // TEST TC-MBE-5.5: Add item (should trigger broadcast)
        console.log('Testing TC-MBE-5.5: Adding item...');
        const addRes = await axios.post(
          `${API_URL}/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
          {
            name: 'Broadcast Test Item',
            quantity: 1,
            unit: 'piece',
            category: 'Test',
            notes: 'Testing WebSocket broadcast'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const itemId = addRes.data.id;
        console.log(`Item added with ID: ${itemId}`);

        // Wait for event
        await new Promise(r => setTimeout(r, 500));

        // TEST TC-MBE-5.6: Update item (should trigger broadcast)
        console.log('Testing TC-MBE-5.6: Updating item...');
        await axios.patch(
          `${API_URL}/api/v1/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
          { completed: true },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Item updated');

        // Wait for event
        await new Promise(r => setTimeout(r, 500));

        socket.disconnect();
        resolve();
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error.message);
        reject(error);
      });

      setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
    });

    // Output results
    console.log('');
    console.log('WEBSOCKET EVENTS CAPTURED:');
    console.log(JSON.stringify(events, null, 2));
    console.log('');
    console.log(`TC-MBE-5.5 Status: ${events.some(e => e.event === 'shoppinglist.item.added') ? 'PASSED' : 'FAILED'}`);
    console.log(`TC-MBE-5.6 Status: ${events.some(e => e.event === 'shoppinglist.item.updated') ? 'PASSED' : 'FAILED'}`);
    console.log('Event Count:', events.length);
    console.log('');
    console.log('=== END TEST ===');
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testShoppingListWebSocket();