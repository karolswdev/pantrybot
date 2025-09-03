describe('Shopping List Detail Debug', () => {
  it('should test adding item to list', () => {
    // Login and get data
    cy.request('POST', 'http://localhost:8080/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }).then((loginResponse) => {
      const accessToken = loginResponse.body.accessToken;
      const householdId = loginResponse.body.households[0].id;
      
      // Create a test shopping list
      cy.request({
        method: 'POST',
        url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists`,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          name: 'Debug Test List',
          notes: 'Testing'
        }
      }).then((listResponse) => {
        const listId = listResponse.body.id;
        
        // Visit the detail page
        cy.visit(`/shopping/${listId}`, {
          onBeforeLoad(win) {
            // Set auth store data
            win.localStorage.setItem('auth-storage', JSON.stringify({
              state: {
                user: {
                  id: loginResponse.body.userId,
                  email: 'test@example.com',
                  displayName: 'Test User',
                  defaultHouseholdId: householdId
                },
                token: accessToken,
                refreshToken: loginResponse.body.refreshToken,
                isAuthenticated: true,
                currentHouseholdId: householdId,
                households: loginResponse.body.households,
                isLoading: false,
                error: null
              },
            }));
            // Also set tokens for api-client
            win.localStorage.setItem('access_token', accessToken);
            win.localStorage.setItem('refresh_token', loginResponse.body.refreshToken);
            win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString());
            // Also set household store
            win.localStorage.setItem('householdStore', JSON.stringify({
              state: {
                activeHouseholdId: householdId,
                households: loginResponse.body.households
              }
            }));
          }
        });
        
        // Wait for page to load
        cy.contains('Debug Test List', { timeout: 10000 }).should('be.visible');
        
        // Try to add an item
        cy.get('[data-testid="add-item-input"]').should('be.visible');
        cy.get('[data-testid="add-item-input"]').type('Test Item');
        cy.get('[data-testid="add-item-button"]').click();
        
        // Wait a bit to see if the item appears
        cy.wait(2000);
        
        // Check if item appeared
        cy.get('[data-testid="to-buy-section"]').should('contain', 'Test Item');
      });
    });
  });
});