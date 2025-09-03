describe('Shopping Lists Debug', () => {
  it('should check what is on the shopping page', () => {
    // Login and set auth
    cy.request('POST', 'http://localhost:8080/api/v1/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    }).then((response) => {
      const { accessToken, refreshToken, userId, households } = response.body;
      const householdId = households[0].id;
      
      cy.visit('/shopping', {
        onBeforeLoad(win) {
          // Set auth before page loads
          win.localStorage.setItem('auth-storage', JSON.stringify({
            state: {
              user: {
                id: userId,
                email: 'test@example.com',
                displayName: 'Test User',
                defaultHouseholdId: householdId
              },
              accessToken: accessToken,
              refreshToken: refreshToken,
              isAuthenticated: true,
              currentHouseholdId: householdId,
            },
          }));
        }
      });
    });
    
    // Check what's visible
    cy.wait(3000); // Give time to load
    
    // Log the body content
    cy.get('body').then(($body) => {
      cy.log('Body text:', $body.text());
    });
    
    // Check if there's any error or loading state
    cy.get('body').should('be.visible');
    
    // Try to find any common elements
    cy.get('h1,h2,h3,p,div').first().then(($el) => {
      cy.log('First element found:', $el.text());
    });
  });
});