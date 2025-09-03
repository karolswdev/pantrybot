#!/usr/bin/env node

// Full end-to-end journey test script
// Tests complete user flow through the Fridgr mock backend

const axios = require('axios');

const BASE_URL = 'http://localhost:8080';
const API_URL = `${BASE_URL}/api/v1`;

// Test data
const testUser = {
  email: 'journey.test@example.com',
  password: 'JourneyPass123!',
  displayName: 'Journey Test User',
  timezone: 'America/New_York'
};

const testHousehold = {
  name: 'Journey Test Household',
  description: 'A household created during journey testing'
};

const testItem = {
  name: 'Test Milk',
  quantity: 2,
  unit: 'liters',
  location: 'Refrigerator',
  category: 'Dairy',
  expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  notes: 'Organic whole milk'
};

const testShoppingList = {
  name: 'Weekly Groceries',
  notes: 'Items needed for the week'
};

const testShoppingItem = {
  name: 'Bread',
  quantity: 2,
  unit: 'loaves',
  category: 'Bakery',
  notes: 'Whole wheat preferred'
};

// Store tokens and IDs for the journey
let accessToken = '';
let refreshToken = '';
let userId = '';
let householdId = '';
let itemId = '';
let shoppingListId = '';
let shoppingItemId = '';

// Helper function to log steps
function logStep(stepNumber, description, success = null) {
  const status = success === null ? '' : success ? ' ✓' : ' ✗';
  console.log(`\nStep ${stepNumber}: ${description}${status}`);
  console.log('─'.repeat(60));
}

// Helper function to log response details
function logResponse(response) {
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log('Response:', JSON.stringify(response.data, null, 2));
}

// Helper function to log error details
function logError(error) {
  if (error.response) {
    console.error(`Error Status: ${error.response.status}`);
    console.error('Error Response:', error.response.data);
  } else {
    console.error('Error:', error.message);
  }
}

// Main journey test
async function runJourneyTest() {
  console.log('═'.repeat(70));
  console.log('FRIDGR MOCK BACKEND - FULL USER JOURNEY TEST');
  console.log('═'.repeat(70));
  console.log(`Test Started: ${new Date().toISOString()}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log('═'.repeat(70));

  try {
    // Step 0: Reset database for clean slate
    logStep(0, 'Reset database to clean state');
    try {
      const resetResponse = await axios.post(`${BASE_URL}/debug/reset-state`);
      logResponse(resetResponse);
      logStep(0, 'Reset database to clean state', true);
    } catch (error) {
      logError(error);
      logStep(0, 'Reset database to clean state', false);
      throw error;
    }

    // Step 1: Register a new user
    logStep(1, 'Register a new user');
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
      logResponse(registerResponse);
      
      accessToken = registerResponse.data.accessToken;
      refreshToken = registerResponse.data.refreshToken;
      userId = registerResponse.data.userId;
      householdId = registerResponse.data.defaultHouseholdId;
      
      console.log(`User ID: ${userId}`);
      console.log(`Default Household ID: ${householdId}`);
      logStep(1, 'Register a new user', true);
    } catch (error) {
      logError(error);
      logStep(1, 'Register a new user', false);
      throw error;
    }

    // Step 2: Login with the registered user
    logStep(2, 'Login with registered user');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      logResponse(loginResponse);
      
      // Update tokens from login
      accessToken = loginResponse.data.accessToken;
      refreshToken = loginResponse.data.refreshToken;
      
      logStep(2, 'Login with registered user', true);
    } catch (error) {
      logError(error);
      logStep(2, 'Login with registered user', false);
      throw error;
    }

    // Step 3: Create a household
    logStep(3, 'Create a new household');
    try {
      const createHouseholdResponse = await axios.post(
        `${API_URL}/households`,
        testHousehold,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      logResponse(createHouseholdResponse);
      
      // Use the newly created household
      householdId = createHouseholdResponse.data.id;
      console.log(`New Household ID: ${householdId}`);
      logStep(3, 'Create a new household', true);
    } catch (error) {
      logError(error);
      logStep(3, 'Create a new household', false);
      throw error;
    }

    // Step 4: Add an inventory item
    logStep(4, 'Add an inventory item');
    try {
      const addItemResponse = await axios.post(
        `${API_URL}/households/${householdId}/items`,
        testItem,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      logResponse(addItemResponse);
      
      itemId = addItemResponse.data.id;
      console.log(`Item ID: ${itemId}`);
      logStep(4, 'Add an inventory item', true);
    } catch (error) {
      logError(error);
      logStep(4, 'Add an inventory item', false);
      throw error;
    }

    // Step 5: Update the inventory item
    logStep(5, 'Update the inventory item');
    try {
      // First GET the item to obtain its ETag
      const getItemResponse = await axios.get(
        `${API_URL}/households/${householdId}/items/${itemId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      const etag = getItemResponse.headers.etag;
      console.log(`Current ETag: ${etag}`);
      
      const updatedItem = {
        ...testItem,
        quantity: 3,
        notes: 'Updated: Organic whole milk - extra bottle'
      };
      
      const updateItemResponse = await axios.patch(
        `${API_URL}/households/${householdId}/items/${itemId}`,
        updatedItem,
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'If-Match': etag
          }
        }
      );
      logResponse(updateItemResponse);
      logStep(5, 'Update the inventory item', true);
    } catch (error) {
      logError(error);
      logStep(5, 'Update the inventory item', false);
      throw error;
    }

    // Step 6: Consume the inventory item
    logStep(6, 'Consume the inventory item');
    try {
      const consumeResponse = await axios.post(
        `${API_URL}/households/${householdId}/items/${itemId}/consume`,
        {
          quantity: 1,
          reason: 'Used for breakfast',
          notes: 'Made cereal'
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      logResponse(consumeResponse);
      logStep(6, 'Consume the inventory item', true);
    } catch (error) {
      logError(error);
      logStep(6, 'Consume the inventory item', false);
      throw error;
    }

    // Step 7: Create a shopping list
    logStep(7, 'Create a shopping list');
    try {
      const createListResponse = await axios.post(
        `${API_URL}/households/${householdId}/shopping-lists`,
        testShoppingList,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      logResponse(createListResponse);
      
      shoppingListId = createListResponse.data.id;
      console.log(`Shopping List ID: ${shoppingListId}`);
      logStep(7, 'Create a shopping list', true);
    } catch (error) {
      logError(error);
      logStep(7, 'Create a shopping list', false);
      throw error;
    }

    // Step 8: Add an item to the shopping list
    logStep(8, 'Add an item to the shopping list');
    try {
      const addShoppingItemResponse = await axios.post(
        `${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items`,
        testShoppingItem,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      logResponse(addShoppingItemResponse);
      
      shoppingItemId = addShoppingItemResponse.data.id;
      console.log(`Shopping Item ID: ${shoppingItemId}`);
      logStep(8, 'Add an item to the shopping list', true);
    } catch (error) {
      logError(error);
      logStep(8, 'Add an item to the shopping list', false);
      throw error;
    }

    // Step 9: Check off the shopping list item
    logStep(9, 'Check off the shopping list item');
    try {
      const checkOffResponse = await axios.patch(
        `${API_URL}/households/${householdId}/shopping-lists/${shoppingListId}/items/${shoppingItemId}`,
        { completed: true },
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      logResponse(checkOffResponse);
      logStep(9, 'Check off the shopping list item', true);
    } catch (error) {
      logError(error);
      logStep(9, 'Check off the shopping list item', false);
      throw error;
    }

    // Step 10: Verify the system handled the full journey
    logStep(10, 'Verify system stability');
    try {
      // Get household details to verify everything is working
      const getHouseholdResponse = await axios.get(
        `${API_URL}/households/${householdId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      // Get inventory items to verify our item is there
      const getItemsResponse = await axios.get(
        `${API_URL}/households/${householdId}/items`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      // Get shopping lists to verify our list is there
      const getListsResponse = await axios.get(
        `${API_URL}/households/${householdId}/shopping-lists`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      
      console.log('Household Details:', getHouseholdResponse.data);
      console.log('Inventory Items Count:', getItemsResponse.data.items.length);
      console.log('Shopping Lists Count:', getListsResponse.data.lists.length);
      
      logStep(10, 'Verify system stability', true);
    } catch (error) {
      logError(error);
      logStep(10, 'Verify system stability', false);
      throw error;
    }

    // Final summary
    console.log('\n' + '═'.repeat(70));
    console.log('JOURNEY TEST COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(70));
    console.log('All steps executed without errors.');
    console.log('The system successfully handled a complete user journey:');
    console.log('  - User registration and authentication');
    console.log('  - Household creation and management');
    console.log('  - Inventory item CRUD operations');
    console.log('  - Shopping list management');
    console.log('  - Item consumption tracking');
    console.log(`Test Completed: ${new Date().toISOString()}`);
    console.log('═'.repeat(70));
    
    process.exit(0);

  } catch (error) {
    console.error('\n' + '═'.repeat(70));
    console.error('JOURNEY TEST FAILED');
    console.error('═'.repeat(70));
    console.error('The test encountered an error and could not complete.');
    console.error('Please review the error details above.');
    console.error(`Test Failed: ${new Date().toISOString()}`);
    console.error('═'.repeat(70));
    
    process.exit(1);
  }
}

// Run the journey test
runJourneyTest();