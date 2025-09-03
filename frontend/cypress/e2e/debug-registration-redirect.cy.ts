describe('Debug Registration Redirect', () => {
  it('should debug why registration does not redirect', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    cy.visit('/signup');
    
    // Intercept the register API call to see response
    cy.intercept('POST', '**/auth/register').as('registerRequest');
    
    // Fill the form
    cy.get('input[name="displayName"]').type('Test User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('TestPass123');
    cy.get('input[name="householdName"]').type('Test House');
    cy.get('input[type="checkbox"]').check({ force: true });
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for API response
    cy.wait('@registerRequest').then((interception) => {
      cy.log('Response Status:', interception.response?.statusCode);
      cy.log('Response Body:', JSON.stringify(interception.response?.body));
      
      // Check if response has required fields
      const body = interception.response?.body;
      expect(body).to.have.property('accessToken');
      expect(body).to.have.property('refreshToken');
      expect(body).to.have.property('userId');
    });
    
    // Wait a bit for any redirect
    cy.wait(2000);
    
    // Check current URL
    cy.url().then(url => {
      cy.log('Current URL after registration:', url);
    });
    
    // Check localStorage to see if tokens are stored
    cy.window().then((win) => {
      const accessToken = win.localStorage.getItem('access_token');
      const refreshToken = win.localStorage.getItem('refresh_token');
      const authStorage = win.localStorage.getItem('auth-storage');
      
      cy.log('Access Token:', accessToken ? 'Present' : 'Missing');
      cy.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
      cy.log('Auth Storage:', authStorage ? 'Present' : 'Missing');
      
      if (authStorage) {
        const parsed = JSON.parse(authStorage);
        cy.log('Auth state:', JSON.stringify(parsed.state));
      }
    });
    
    // Check if there's an error message
    cy.get('body').then($body => {
      if ($body.find('.bg-red-50').length > 0) {
        cy.log('Error message found:', $body.find('.bg-red-50').text());
      } else {
        cy.log('No error message found');
      }
    });
  });
});