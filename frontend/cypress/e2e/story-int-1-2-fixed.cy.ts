describe('STORY-INT-1.2: Authentication Integration Tests', () => {
  beforeEach(() => {
    // Reset backend state and clear any existing auth data
    cy.resetBackendState();
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  // TC-INT-1.2: User registration via mock backend
  it('TC-INT-1.2: should successfully register a new user via mock backend', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    
    cy.visit('/signup');
    
    // Fill the form using the correct selectors
    cy.get('input[placeholder="John Doe"]').type('Test User');
    cy.get('input[placeholder="john@example.com"]').type(uniqueEmail);
    cy.get('input[placeholder="Create a strong password"]').type('TestPass123');
    cy.get('input[placeholder="Smith Family"]').type('Test House');
    
    // Select timezone
    cy.get('[role="combobox"]').click({ force: true });
    cy.contains('Eastern Time (US & Canada)').click({ force: true });
    
    // Check the terms checkbox (it's a button with role="checkbox")
    cy.get('button[role="checkbox"]').click();
    
    // Submit the form
    cy.contains('button', 'Create Account').click();
    
    // Wait for auth state to update
    cy.wait(1000);
    
    // Should redirect to dashboard after successful registration
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    
    // Verify user is authenticated
    cy.window().then((win) => {
      const accessToken = win.localStorage.getItem('access_token');
      expect(accessToken).to.not.be.null;
      expect(win.localStorage.getItem('refresh_token')).to.not.be.null;
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
    
    cy.get('input[placeholder="user@example.com"]').type(uniqueEmail);
    cy.get('input[placeholder="Enter your password"]').type(password);
    
    // Submit the form
    cy.contains('button', 'Sign In').click();
    
    // Wait for auth state to update
    cy.wait(1000);
    
    // Should redirect to dashboard after successful login
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    
    // Verify user is authenticated
    cy.window().then((win) => {
      const accessToken = win.localStorage.getItem('access_token');
      expect(accessToken).to.not.be.null;
      expect(win.localStorage.getItem('refresh_token')).to.not.be.null;
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
    cy.get('input[placeholder="user@example.com"]').type(uniqueEmail);
    cy.get('input[placeholder="Enter your password"]').type(password);
    cy.contains('button', 'Sign In').click();
    
    // Wait for auth state to update
    cy.wait(1000);
    
    // Should now be on dashboard
    cy.url().should('include', '/dashboard', { timeout: 10000 });
    
    // Verify dashboard content loads
    cy.contains('Welcome back').should('be.visible');
  });
});