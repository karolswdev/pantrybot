describe('Shopping List Detail - Simplified Integration', () => {
  let accessToken: string;
  let refreshToken: string;
  let householdId: string;
  let userId: string;
  let listId: string;
  let households: any[];

  beforeEach(() => {
    // Login and create a shopping list for testing
    cy.request('POST', 'http://localhost:8080/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }).then((loginResponse) => {
      accessToken = loginResponse.body.accessToken;
      refreshToken = loginResponse.body.refreshToken;
      userId = loginResponse.body.userId;
      households = loginResponse.body.households;
      householdId = loginResponse.body.households[0].id;
      
      // Create a test shopping list
      return cy.request({
        method: 'POST',
        url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          name: 'Test Shopping List',
          notes: 'For integration testing'
        }
      });
    }).then((listResponse) => {
      listId = listResponse.body.id;
    });
  });

  // TC-INT-5.3: Should add an item to the list via the mock backend
  it('should add an item to the list via the mock backend', () => {
    // Add an item via API first to ensure the list has content
    cy.request({
      method: 'POST',
      url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Test Item via API',
        quantity: 1,
        unit: 'piece'
      }
    });

    // Visit the shopping lists page first with auth
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: { id: userId, email: 'test@example.com', displayName: 'Test User', defaultHouseholdId: householdId },
            token: accessToken,
            refreshToken: refreshToken,
            isAuthenticated: true,
            currentHouseholdId: householdId,
            households: households,
            isLoading: false,
            error: null
          }
        }));
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString());
      }
    });
    
    // Navigate to shopping lists
    cy.visit('/shopping');
    
    // Click on the test list to go to detail page
    cy.contains('Test Shopping List').click();
    
    // Wait for the detail page to load
    cy.get('[data-testid="to-buy-section"]', { timeout: 10000 }).should('exist');
    
    // Verify the API-added item is shown
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Test Item via API');
    
    // Now add a new item through the UI
    cy.get('[data-testid="add-item-input"]').type('Bananas');
    cy.get('[data-testid="add-item-button"]').click();
    
    // Verify the item was added
    cy.get('[data-testid="to-buy-section"]', { timeout: 10000 }).should('contain', 'Bananas');
  });

  // TC-INT-5.4: Should check and uncheck an item via the mock backend
  it('should check and uncheck an item via the mock backend', () => {
    // Add test items via API
    let itemId: string;
    
    cy.request({
      method: 'POST',
      url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Milk',
        quantity: 1,
        unit: 'gallon'
      }
    }).then((response) => {
      itemId = response.body.id;
    });

    // Visit with auth
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: { id: userId, email: 'test@example.com', displayName: 'Test User', defaultHouseholdId: householdId },
            token: accessToken,
            refreshToken: refreshToken,
            isAuthenticated: true,
            currentHouseholdId: householdId,
            households: households,
            isLoading: false,
            error: null
          }
        }));
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString());
      }
    });
    
    // Navigate to shopping lists
    cy.visit('/shopping');
    
    // Click on the test list
    cy.contains('Test Shopping List').click();
    
    // Wait for detail page
    cy.get('[data-testid="to-buy-section"]', { timeout: 10000 }).should('exist');
    
    // Verify Milk is in "To Buy" section
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
    
    // Find and click the checkbox for Milk
    cy.get('[data-testid="to-buy-section"]')
      .contains('Milk')
      .parents('[data-testid^="item-"]')
      .find('[data-testid^="checkbox-"]')
      .click();
    
    // Wait for update
    cy.wait(1000);
    
    // Verify Milk moved to "Bought" section
    cy.get('[data-testid="bought-section"]', { timeout: 5000 }).should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('not.contain', 'Milk');
    
    // Uncheck it to move back
    cy.get('[data-testid="bought-section"]')
      .contains('Milk')
      .parents('[data-testid^="item-"]')
      .find('[data-testid^="checkbox-"]')
      .click();
    
    // Wait for update
    cy.wait(1000);
    
    // Verify Milk moved back to "To Buy"
    cy.get('[data-testid="to-buy-section"]', { timeout: 5000 }).should('contain', 'Milk');
    cy.get('[data-testid="bought-section"]').should('not.contain', 'Milk');
  });

  // TC-INT-5.5: Should update the list when a WebSocket event is received from the mock backend
  it('should update the list when a WebSocket event is received from the mock backend', () => {
    // Visit with auth
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: { id: userId, email: 'test@example.com', displayName: 'Test User', defaultHouseholdId: householdId },
            token: accessToken,
            refreshToken: refreshToken,
            isAuthenticated: true,
            currentHouseholdId: householdId,
            households: households,
            isLoading: false,
            error: null
          }
        }));
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString());
      }
    });
    
    // Navigate to shopping lists
    cy.visit('/shopping');
    
    // Click on the test list
    cy.contains('Test Shopping List').click();
    
    // Wait for detail page
    cy.get('[data-testid="to-buy-section"]', { timeout: 10000 }).should('exist');
    
    // Simulate another user adding an item via API
    cy.request({
      method: 'POST',
      url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Eggs (Added by WebSocket)',
        quantity: 12,
        unit: 'pieces',
        notes: 'From another user'
      }
    });
    
    // The WebSocket should deliver the update
    // Wait for the item to appear via real-time update
    cy.get('[data-testid="to-buy-section"]', { timeout: 10000 })
      .should('contain', 'Eggs (Added by WebSocket)');
  });
});