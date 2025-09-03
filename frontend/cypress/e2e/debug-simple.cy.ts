describe('Debug Simple Auth', () => {
  it('should check if form submission works', () => {
    cy.visit('/signup');
    
    // Add console log capture
    cy.on('window:before:load', (win) => {
      cy.spy(win.console, 'log').as('consoleLog');
      cy.spy(win.console, 'error').as('consoleError');
    });
    
    // Wait for page to load
    cy.wait(1000);
    
    // Fill the form
    const uniqueEmail = `test-${Date.now()}@example.com`;
    cy.get('input[name="displayName"]').type('Test User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('TestPass123');
    cy.get('input[name="householdName"]').type('Test House');
    cy.get('input[type="checkbox"]').check({ force: true });
    
    // Check if submit button is not disabled
    cy.get('button[type="submit"]').should('not.be.disabled');
    
    // Intercept ANY network request to see what's happening
    cy.intercept('**/*').as('anyRequest');
    
    // Click submit and see what happens
    cy.get('button[type="submit"]').click();
    
    // Wait a bit to see if any requests are made
    cy.wait(2000);
    
    // Check if any error appears on the page
    cy.get('.bg-red-50').then($el => {
      if ($el.length) {
        cy.log('Error message found:', $el.text());
      } else {
        cy.log('No error message found');
      }
    });
    
    // Check the console logs
    cy.get('@consoleError').then((consoleError) => {
      if (consoleError && consoleError.callCount > 0) {
        cy.log('Console errors found');
      }
    });
    
    // Check current URL
    cy.url().then(url => {
      cy.log('Final URL:', url);
    });
  });
});