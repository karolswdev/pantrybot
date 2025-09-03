describe('Shopping List Detail', () => {
  let accessToken: string;
  let refreshToken: string;
  let householdId: string;
  let userId: string;
  let listId: string;
  
  // Test user credentials
  const testUser = {
    email: 'shoppingdetailtest@example.com',
    password: 'Test123!@#',
    displayName: 'Shopping Detail Test User'
  };

  beforeEach(() => {
    // First, try to register the test user (will fail if already exists)
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/register',
      body: testUser,
      failOnStatusCode: false // Don't fail if user already exists
    }).then((registerResponse) => {
      // Now login with the test user
      cy.request('POST', 'http://localhost:8080/api/v1/auth/login', {
        email: testUser.email,
        password: testUser.password
      }).then((loginResponse) => {
        accessToken = loginResponse.body.accessToken;
        refreshToken = loginResponse.body.refreshToken;
        userId = loginResponse.body.userId;
        
        // Get the user's households
        cy.request({
          method: 'GET',
          url: 'http://localhost:8080/api/v1/households',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }).then((householdsResponse) => {
          householdId = householdsResponse.body.households[0].id;
          
          // Create a test shopping list
          cy.request({
            method: 'POST',
            url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists`,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: {
              name: 'Weekly Groceries',
              notes: 'Test list for Cypress'
            }
          }).then((listResponse) => {
            listId = listResponse.body.id;
            
            // Add some initial items to the list
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
                unit: 'gal',
                category: 'Dairy'
              }
            });
            
            cy.request({
              method: 'POST',
              url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: {
                name: 'Bread',
                quantity: 2,
                unit: 'loaves',
                category: 'Bakery'
              }
            });
            
            // Add a completed item
            cy.request({
              method: 'POST',
              url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: {
                name: 'Apples',
                quantity: 6,
                unit: 'pieces',
                category: 'Produce'
              }
            }).then((itemResponse) => {
              // Mark it as completed
              cy.request({
                method: 'PATCH',
                url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items/${itemResponse.body.id}`,
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                },
                body: {
                  completed: true
                }
              });
            });
          });
        });
      });
    });
  });

  // TC-INT-5.3: Should add an item to the list via the mock backend
  it('should add an item to the list via the mock backend', () => {
    // Setup localStorage before navigating
    cy.visit('/', {
      onBeforeLoad(win) {
        // Set auth store data
        win.localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: {
              id: userId,
              email: testUser.email,
              displayName: testUser.displayName,
              defaultHouseholdId: householdId
            },
            token: accessToken,
            refreshToken: refreshToken,
            isAuthenticated: true,
            currentHouseholdId: householdId,
            households: [{
              id: householdId,
              name: 'Test Household',
              role: 'admin'
            }],
            isLoading: false,
            error: null
          },
        }));
        // Also set tokens for api-client
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()); // 15 minutes
        // Also set household store for compatibility
        win.localStorage.setItem('householdStore', JSON.stringify({
          state: {
            activeHouseholdId: householdId,
            households: [{
              id: householdId,
              name: 'Test Household',
              role: 'admin'
            }]
          }
        }));
      }
    });
    
    // Navigate to shopping list detail page
    cy.visit(`/shopping/${listId}`);
    
    // Wait for page to load
    cy.contains('Weekly Groceries', { timeout: 10000 }).should('be.visible');
    
    // Verify initial items are shown from backend
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Bread');
    cy.get('[data-testid="bought-section"]').should('contain', 'Apples');
    
    // Use the "Add item" input field to add a new item
    cy.get('[data-testid="add-item-input"]').type('Bananas');
    cy.get('[data-testid="add-item-button"]').click();
    
    // Wait a moment for the mutation to complete
    cy.wait(1000);
    
    // Wait for the item to appear (real backend call)
    cy.get('[data-testid="to-buy-section"]', { timeout: 10000 }).within(() => {
      cy.contains('Bananas').should('exist');
    });
    
    // Verify we now have 3 items in "To Buy" section
    cy.get('[data-testid="to-buy-section"]').within(() => {
      cy.get('[data-testid^="item-"]').should('have.length', 3);
    });
  });

  // TC-INT-5.4: Should check and uncheck an item via the mock backend
  it('should check and uncheck an item via the mock backend', () => {
    // Setup localStorage before navigating
    cy.visit('/', {
      onBeforeLoad(win) {
        // Set auth store data
        win.localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: {
              id: userId,
              email: testUser.email,
              displayName: testUser.displayName,
              defaultHouseholdId: householdId
            },
            token: accessToken,
            refreshToken: refreshToken,
            isAuthenticated: true,
            currentHouseholdId: householdId,
            households: [{
              id: householdId,
              name: 'Test Household',
              role: 'admin'
            }],
            isLoading: false,
            error: null
          },
        }));
        // Also set tokens for api-client
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()); // 15 minutes
        // Also set household store for compatibility
        win.localStorage.setItem('householdStore', JSON.stringify({
          state: {
            activeHouseholdId: householdId,
            households: [{
              id: householdId,
              name: 'Test Household',
              role: 'admin'
            }]
          }
        }));
      }
    });
    
    // Navigate to shopping list detail page
    cy.visit(`/shopping/${listId}`);
    
    // Wait for page to load and verify initial state
    cy.contains('Weekly Groceries', { timeout: 10000 }).should('be.visible');
    
    // Verify initial state: Milk and Bread in "To Buy", Apples in "Bought"
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Bread');
    cy.get('[data-testid="bought-section"]').should('contain', 'Apples');
    
    // Find the Milk item and check it
    cy.get('[data-testid="to-buy-section"]')
      .contains('Milk')
      .closest('[data-testid^="item-"]')
      .find('[data-testid^="checkbox-"]')
      .click();
    
    // Wait for the backend update and UI to reflect the change
    cy.wait(1000);
    
    // Verify Milk moved to "Bought" section
    cy.get('[data-testid="bought-section"]', { timeout: 10000 }).should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('not.contain', 'Milk');
    
    // Now uncheck Milk from the "Bought" section
    cy.get('[data-testid="bought-section"]')
      .contains('Milk')
      .closest('[data-testid^="item-"]')
      .find('[data-testid^="checkbox-"]')
      .click();
    
    // Wait for the backend update
    cy.wait(1000);
    
    // Verify Milk moved back to "To Buy"
    cy.get('[data-testid="to-buy-section"]', { timeout: 10000 }).should('contain', 'Milk');
    cy.get('[data-testid="bought-section"]').should('not.contain', 'Milk');
  });

  // TC-INT-5.5: Should update the list when a WebSocket event is received from the mock backend
  it('should update the list when a WebSocket event is received from the mock backend', () => {
    // Setup localStorage before navigating
    cy.visit('/', {
      onBeforeLoad(win) {
        // Set auth store data
        win.localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: {
              id: userId,
              email: testUser.email,
              displayName: testUser.displayName,
              defaultHouseholdId: householdId
            },
            token: accessToken,
            refreshToken: refreshToken,
            isAuthenticated: true,
            currentHouseholdId: householdId,
            households: [{
              id: householdId,
              name: 'Test Household',
              role: 'admin'
            }],
            isLoading: false,
            error: null
          },
        }));
        // Also set tokens for api-client
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()); // 15 minutes
        // Also set household store for compatibility
        win.localStorage.setItem('householdStore', JSON.stringify({
          state: {
            activeHouseholdId: householdId,
            households: [{
              id: householdId,
              name: 'Test Household',
              role: 'admin'
            }]
          }
        }));
      }
    });
    
    // Navigate to shopping list detail page
    cy.visit(`/shopping/${listId}`);
    
    // Wait for page to load and verify initial state
    cy.contains('Weekly Groceries', { timeout: 10000 }).should('be.visible');
    
    // Verify initial items
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Bread');
    
    // Simulate another user adding an item via API (not through UI)
    cy.request({
      method: 'POST',
      url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Eggs',
        quantity: 12,
        unit: 'pieces',
        category: 'Dairy',
        notes: 'Added by another user'
      }
    });
    
    // The WebSocket event should be broadcast by the backend
    // and the UI should update automatically without refresh
    // Wait for the item to appear via WebSocket update
    cy.get('[data-testid="to-buy-section"]', { timeout: 10000 }).within(() => {
      cy.contains('Eggs').should('exist');
    });
    
    // Now simulate another user marking an item as completed
    // First get the Milk item ID from the checkbox data-testid
    cy.get('[data-testid="to-buy-section"]')
      .contains('Milk')
      .closest('[data-testid^="item-"]')
      .invoke('attr', 'data-testid')
      .then((testId) => {
        const milkItemId = (testId as string).replace('item-', '');
        // Simulate another user checking off Milk via API
        cy.request({
          method: 'PATCH',
          url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items/${milkItemId}`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: {
            completed: true
          }
        });
      });
    
    // Wait for the WebSocket update to move Milk to "Bought"
    cy.get('[data-testid="bought-section"]', { timeout: 10000 }).should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('not.contain', 'Milk');
  });
});