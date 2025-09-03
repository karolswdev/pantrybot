describe('Simple SignUp Test', () => {
  it('should register a new user via API and then login via UI', () => {
    // First reset backend state
    cy.request('POST', 'http://localhost:8080/debug/reset-state');
    
    // Generate unique email
    const timestamp = Date.now();
    const email = `test${timestamp}@example.com`;
    const password = 'SecurePass123!';
    
    // Register via API directly
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/register',
      body: {
        email,
        password,
        displayName: 'Test User',
        timezone: 'America/New_York',
        defaultHouseholdName: 'Test Household'
      }
    }).then(response => {
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('userId');
      expect(response.body).to.have.property('accessToken');
      expect(response.body).to.have.property('refreshToken');
      
      // Now try to login via UI with the same credentials
      cy.visit('/login');
      cy.get('input[placeholder="user@example.com"]').type(email);
      cy.get('input[placeholder="Enter your password"]').type(password);
      cy.contains('button', 'Sign In').click();
      
      // Should redirect to dashboard after login
      cy.url().should('include', '/dashboard', { timeout: 10000 });
      
      // Verify tokens are stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('access_token')).to.not.be.null;
        expect(win.localStorage.getItem('refresh_token')).to.not.be.null;
      });
    });
  });
});