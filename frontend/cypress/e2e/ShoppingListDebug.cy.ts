describe('Shopping List Debug', () => {
  let accessToken: string;
  let householdId: string;
  let userId: string;
  let listId: string;

  beforeEach(() => {
    // Setup test data
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/register',
      body: {
        email: 'debugtest@example.com',
        password: 'Test123!@#',
        displayName: 'Debug Test User'
      },
      failOnStatusCode: false
    }).then(() => {
      cy.request('POST', 'http://localhost:8080/api/v1/auth/login', {
        email: 'debugtest@example.com',
        password: 'Test123!@#'
      }).then((response) => {
        accessToken = response.body.accessToken;
        userId = response.body.userId;
        
        cy.request({
          method: 'GET',
          url: 'http://localhost:8080/api/v1/households',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then((householdResponse) => {
          householdId = householdResponse.body.households[0].id;
          
          // Create a test shopping list
          cy.request({
            method: 'POST',
            url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists`,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: {
              name: 'Debug Test List'
            }
          }).then((listResponse) => {
            listId = listResponse.body.id;
            console.log('Created list with ID:', listId);
          });
        });
      });
    });
  });

  it('should debug item addition and fetching', () => {
    // Add an item via API
    cy.request({
      method: 'POST',
      url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: {
        name: 'Test Item',
        quantity: 1
      }
    }).then((addResponse) => {
      console.log('Add item response:', addResponse.body);
      
      // Fetch items to see what's returned
      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }).then((fetchResponse) => {
        console.log('Fetch items response:', fetchResponse.body);
        expect(fetchResponse.body).to.be.an('array');
        expect(fetchResponse.body).to.have.length.greaterThan(0);
        
        // Check the structure of the first item
        const firstItem = fetchResponse.body[0];
        console.log('First item structure:', firstItem);
      });
    });
    
    // Now test through the UI
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: {
              id: userId,
              email: 'debugtest@example.com',
              displayName: 'Debug Test User',
              defaultHouseholdId: householdId
            },
            token: accessToken,
            refreshToken: accessToken,
            isAuthenticated: true,
            currentHouseholdId: householdId,
            households: [{
              id: householdId,
              name: 'Test Household',
              role: 'admin'
            }],
            isLoading: false,
            error: null
          }
        }));
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', accessToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString());
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
    
    cy.visit(`/shopping/${listId}`);
    cy.contains('Debug Test List', { timeout: 10000 }).should('be.visible');
    
    // Check if the item is displayed
    cy.contains('Test Item', { timeout: 10000 }).should('be.visible');
    
    // Try adding a new item through the UI
    cy.get('[data-testid="add-item-input"]').type('UI Added Item');
    cy.get('[data-testid="add-item-button"]').click();
    
    // Check network tab
    cy.intercept('POST', '**/items').as('addItem');
    
    // Wait a moment for the mutation to complete
    cy.wait(2000);
    
    // Check if the new item appears
    cy.contains('UI Added Item', { timeout: 10000 }).should('be.visible');
  });
});