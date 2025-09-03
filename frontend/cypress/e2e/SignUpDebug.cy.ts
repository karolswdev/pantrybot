describe('SignUp Debug Test', () => {
  beforeEach(() => {
    // Reset backend state
    cy.resetBackendState();
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('should register with detailed debugging', () => {
    // Visit signup page
    cy.visit('/signup');

    // Generate unique email
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
    
    // Intercept the request to see what happens
    cy.intercept('POST', '**/api/v1/auth/register', (req) => {
      // Log request details
      console.log('Request URL:', req.url);
      console.log('Request Body:', req.body);
      req.continue((res) => {
        console.log('Response Status:', res.statusCode);
        console.log('Response Body:', res.body);
      });
    }).as('registerRequest');
    
    // Submit form
    cy.contains('button', 'Create Account').click();
    
    // Wait for request
    cy.wait('@registerRequest', { timeout: 10000 }).then((interception) => {
      cy.log('Request sent to:', interception.request.url);
      cy.log('Request body:', JSON.stringify(interception.request.body));
      cy.log('Response status:', interception.response?.statusCode);
      cy.log('Response body:', JSON.stringify(interception.response?.body));
      
      // Check if we got success or error
      if (interception.response?.statusCode === 201) {
        cy.log('Registration successful!');
        // Check for redirect
        cy.url().should('include', '/dashboard', { timeout: 10000 });
      } else {
        cy.log('Registration failed with status:', interception.response?.statusCode);
        cy.log('Error details:', JSON.stringify(interception.response?.body));
      }
    });
  });
});