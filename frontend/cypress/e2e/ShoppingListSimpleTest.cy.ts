describe('Shopping List Simple Test', () => {
  it('should add and display an item', () => {
    // Create a fresh user and list
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/register',
      body: {
        email: `test${Date.now()}@example.com`,
        password: 'Password123',
        displayName: 'Test User'
      },
      failOnStatusCode: false
    }).then((registerResponse) => {
      const { accessToken, userId, defaultHouseholdId: householdId } = registerResponse.body;
      
      // Create a shopping list
      cy.request({
        method: 'POST',
        url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: { name: 'Test List' }
      }).then((listResponse) => {
        const listId = listResponse.body.id;
        
        // Add an item via API first
        cy.request({
          method: 'POST',
          url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: { name: 'Pre-created Item', quantity: 1 }
        });
        
        // Set up localStorage
        cy.visit('/', {
          onBeforeLoad(win) {
            win.localStorage.setItem('auth-storage', JSON.stringify({
              state: {
                user: {
                  id: userId,
                  email: registerResponse.body.email,
                  displayName: 'Test User',
                  defaultHouseholdId: householdId
                },
                token: accessToken,
                refreshToken: registerResponse.body.refreshToken,
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
            win.localStorage.setItem('refresh_token', registerResponse.body.refreshToken);
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
        
        // Navigate directly to the list
        cy.visit(`/shopping/${listId}`);
        
        // Debug: Check if the page loaded
        cy.wait(2000);
        cy.get('body').then($body => {
          console.log('Page body:', $body.text());
        });
        
        // Wait for the page to load
        cy.contains('Test List', { timeout: 10000 }).should('be.visible');
        
        // Intercept the API calls
        cy.intercept('POST', '**/items').as('addItem');
        cy.intercept('GET', '**/items').as('getItems');
        
        // Add an item
        cy.get('[data-testid="add-item-input"]').type('New Item');
        cy.get('[data-testid="add-item-button"]').click();
        
        // Wait for the POST request
        cy.wait('@addItem').then((interception) => {
          expect(interception.response.statusCode).to.eq(201);
        });
        
        // The item should appear in the UI
        cy.get('[data-testid="to-buy-section"]').should('contain', 'New Item');
      });
    });
  });
});