describe('Shopping Lists', () => {
  let accessToken: string;
  let refreshToken: string;
  let householdId: string;
  let userId: string;
  let households: any[];
  
  // Test user credentials
  const testUser = {
    email: 'shoppingtest@example.com',
    password: 'Test123!@#',
    displayName: 'Shopping Test User'
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
          households = householdsResponse.body.households;
          householdId = households[0].id;
        });
      });
    });
  });

  it('should display shopping lists from the mock backend', () => {
    // TC-INT-5.1: Display shopping lists from the mock backend
    
    // Arrange: Create test shopping lists in the backend
    cy.request({
      method: 'POST',
      url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Weekly Groceries',
        notes: 'Regular shopping'
      }
    });
    
    cy.request({
      method: 'POST',
      url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Party Supplies',
        notes: 'For the weekend'
      }
    });

    // Act: Visit home first to set localStorage, then navigate
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
            households: households,
            isLoading: false,
            error: null
          },
        }));
        // Also set tokens for api-client
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()); // 15 minutes
      }
    });
    
    // Then navigate to the shopping page
    cy.visit('/shopping');
    
    // Wait for the page to load and fetch data from backend
    cy.get('[data-testid="shopping-list-page"]', { timeout: 10000 }).should('exist');

    // Assert: Verify that at least 2 shopping list components are rendered
    cy.get('[data-testid^="shopping-list-"]').should('have.length.at.least', 2);
    
    // Assert: Verify the names match the created data
    // Note: We check for the list names without relying on specific IDs since they're generated
    cy.get('[data-testid^="shopping-list-"]').should('contain', 'Weekly Groceries');
    cy.get('[data-testid^="shopping-list-"]').should('contain', 'Party Supplies');
  });

  it('should create a new shopping list via the mock backend', () => {
    // TC-INT-5.2: Create a new shopping list via the mock backend

    // Act: Visit home first to set localStorage, then navigate
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
            households: households,
            isLoading: false,
            error: null
          },
        }));
        // Also set tokens for api-client
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()); // 15 minutes
      }
    });
    
    // Then navigate to the shopping page
    cy.visit('/shopping');
    
    // Wait for page to load
    cy.get('[data-testid="shopping-list-page"]', { timeout: 10000 }).should('exist');
    
    // Click the "New List" button
    cy.get('[data-testid="new-list-button"]').click();
    
    // Verify modal opens
    cy.get('[data-testid="create-list-modal"]').should('be.visible');
    
    // Enter a name in the modal
    cy.get('[data-testid="list-name-input"]').type('Weekend Shopping');
    cy.get('[data-testid="list-notes-input"]').type('For the BBQ');
    
    // Submit the form - this will trigger a real POST request
    cy.get('[data-testid="create-list-button"]').click();

    // Wait for the modal to close and list to appear
    cy.get('[data-testid="create-list-modal"]').should('not.exist');
    
    // Assert: Verify the new list appears in the UI after successful response
    cy.get('[data-testid^="shopping-list-"]', { timeout: 10000 })
      .contains('Weekend Shopping')
      .should('exist');
  });
});