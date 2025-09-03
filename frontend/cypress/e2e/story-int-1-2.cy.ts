describe('STORY-INT-1.2: Authentication Integration Tests', () => {
  // TC-INT-1.2: User registration via mock backend
  it('TC-INT-1.2: should successfully register a new user via mock backend', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    cy.visit('/signup');
    
    // Fill the form
    cy.get('input[name="displayName"]').type('Test User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('TestPass123');
    cy.get('input[name="householdName"]').type('Test House');
    cy.get('input[type="checkbox"]').check({ force: true });
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Should redirect to dashboard after successful registration
    cy.url().should('include', '/dashboard');
    
    // Verify user is authenticated
    cy.window().then((win) => {
      const accessToken = win.localStorage.getItem('access_token');
      expect(accessToken).to.not.be.null;
    });
  });
  
  // TC-INT-1.3: User login via mock backend  
  it('TC-INT-1.3: should successfully login via mock backend', () => {
    // First register a user
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const password = 'TestPass123';
    
    // Register via API directly to ensure user exists
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/register',
      body: {
        email: uniqueEmail,
        password: password,
        displayName: 'Test User',
        timezone: 'UTC',
        defaultHouseholdName: 'Test House'
      }
    });
    
    // Now test login
    cy.visit('/login');
    
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type(password);
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Should redirect to dashboard after successful login
    cy.url().should('include', '/dashboard');
    
    // Verify user is authenticated
    cy.window().then((win) => {
      const accessToken = win.localStorage.getItem('access_token');
      expect(accessToken).to.not.be.null;
    });
  });
  
  // TC-INT-1.4: Dashboard access requires authentication
  it('TC-INT-1.4: should require authentication to access dashboard', () => {
    // Clear any existing auth tokens
    cy.clearLocalStorage();
    
    // Try to access dashboard without authentication
    cy.visit('/dashboard');
    
    // Should be redirected to login page
    cy.url().should('include', '/login');
    
    // Now login and access dashboard
    const uniqueEmail = `test-${Date.now()}@example.com`;
    const password = 'TestPass123';
    
    // Register via API directly
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/register',
      body: {
        email: uniqueEmail,
        password: password,
        displayName: 'Test User',
        timezone: 'UTC',
        defaultHouseholdName: 'Test House'
      }
    });
    
    // Login
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();
    
    // Should now be on dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify dashboard content loads
    cy.contains('Welcome to Fridgr').should('be.visible');
  });
});