describe('Test SignUp Debug', () => {
  it('should debug registration flow', () => {
    // Reset backend state
    cy.request('POST', 'http://localhost:8080/debug/reset-state');
    
    // Visit signup page
    cy.visit('/signup');
    
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    
    // Fill form
    cy.get('input[placeholder="John Doe"]').type('John Doe');
    cy.get('input[placeholder="john@example.com"]').type(testEmail);
    cy.get('input[placeholder="Create a strong password"]').type('SecurePass123');
    cy.get('input[placeholder="Smith Family"]').type('Test Household');
    
    // Select timezone
    cy.get('[role="combobox"]').click({ force: true });
    cy.contains('Eastern Time (US & Canada)').click({ force: true });
    
    // Check terms
    cy.get('button[role="checkbox"]').click();
    
    // Intercept the registration request to see what's being sent
    cy.intercept('POST', '**/api/v1/auth/register').as('register');
    
    // Submit form
    cy.contains('button', 'Create Account').click();
    
    // Wait for registration request
    cy.wait('@register').then((interception) => {
      cy.log('Response status:', interception.response?.statusCode);
      cy.log('Response body:', JSON.stringify(interception.response?.body));
    });
    
    // Wait a bit to see results
    cy.wait(2000);
    
    // Check if we're on dashboard or still on signup
    cy.url().then(url => {
      cy.log('Current URL:', url);
    });
    
    // Check for error message
    cy.get('body').then($body => {
      if ($body.find('.bg-red-50').length > 0) {
        cy.get('.bg-red-50').then($error => {
          cy.log('Error message found:', $error.text());
        });
      } else {
        cy.log('No error message found');
      }
    });
  });
});