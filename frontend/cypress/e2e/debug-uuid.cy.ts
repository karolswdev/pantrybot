describe('Debug UUID Issue', () => {
  it('should test crypto.randomUUID availability', () => {
    cy.visit('/signup');
    
    // Test if crypto.randomUUID is available in the browser context
    cy.window().then((win) => {
      if (win.crypto && win.crypto.randomUUID) {
        cy.log('crypto.randomUUID is available');
        const uuid = win.crypto.randomUUID();
        cy.log('Generated UUID:', uuid);
      } else {
        cy.log('crypto.randomUUID is NOT available');
      }
    });
    
    // Try to register a user and catch any console errors
    cy.on('uncaught:exception', (err, runnable) => {
      // Log the error but don't fail the test
      cy.log('Uncaught exception:', err.message);
      return false;
    });
    
    // Fill the form
    cy.get('input[name="displayName"]').type('Test User');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('TestPass123');
    cy.get('input[name="householdName"]').type('Test House');
    cy.get('input[type="checkbox"]').check({ force: true });
    
    // Intercept the API call to see what happens
    cy.intercept('POST', '**/auth/register', (req) => {
      cy.log('Request headers:', JSON.stringify(req.headers));
      cy.log('Request body:', JSON.stringify(req.body));
    }).as('registerRequest');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for any errors to appear
    cy.wait(2000);
  });
});