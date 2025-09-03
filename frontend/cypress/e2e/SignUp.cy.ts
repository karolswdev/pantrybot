describe('SignUp E2E Tests', () => {
  beforeEach(() => {
    // Reset backend state and clear any existing auth data
    cy.resetBackendState();
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('should successfully register a new user and redirect to the dashboard', () => {
    // TC-INT-1.2: Test user registration against mock backend
    
    // Visit signup page
    cy.visit('/signup');

    // Generate a unique email for this test
    const timestamp = Date.now();
    const testEmail = `uitest${timestamp}@example.com`;

    // Fill in the form with valid data
    cy.get('input[placeholder="John Doe"]').type('John Doe');
    cy.get('input[placeholder="john@example.com"]').type(testEmail);
    cy.get('input[placeholder="Create a strong password"]').type('SecurePass123');
    cy.get('input[placeholder="Smith Family"]').type('Doe Household');
    
    // Select timezone (click on the select trigger)
    cy.get('[role="combobox"]').click({ force: true });
    cy.contains('Eastern Time (US & Canada)').click({ force: true });
    
    // Check the terms checkbox
    cy.get('button[role="checkbox"]').click();
    
    // Submit the form
    cy.contains('button', 'Create Account').click();

    // Wait a moment for the auth state to update and trigger redirect
    cy.wait(1000);

    // Wait for successful registration and redirect to dashboard
    cy.url().should('include', '/dashboard', { timeout: 10000 });

    // Assert that tokens are stored in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.not.be.null;
      expect(win.localStorage.getItem('refresh_token')).to.not.be.null;
    });
  });

  it('should display validation errors when submitting empty form', () => {
    cy.visit('/signup');

    // Try to submit without filling any fields
    cy.contains('button', 'Create Account').click();

    // Check for validation error messages
    cy.contains('Display name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password must be at least 8 characters').should('be.visible');
    cy.contains('Household name is required').should('be.visible');
    cy.contains('You must agree to the terms and privacy policy').should('be.visible');
  });

  it('should show password strength indicators', () => {
    cy.visit('/signup');

    const passwordInput = cy.get('input[placeholder="Create a strong password"]');

    // Type a weak password
    passwordInput.type('weak');
    
    // Check that indicators show as not met (gray color)
    // The div containing the indicator has the class
    cy.get('.text-gray-400').contains('8+ characters').should('be.visible');
    cy.get('.text-gray-400').contains('One uppercase letter').should('be.visible');
    cy.get('.text-gray-400').contains('One number').should('be.visible');

    // Clear and type a strong password
    passwordInput.clear().type('StrongPass123');
    
    // Check that indicators show as met (green color)
    // The div containing the indicator has the class
    cy.get('.text-green-600').contains('8+ characters').should('be.visible');
    cy.get('.text-green-600').contains('One uppercase letter').should('be.visible');
    cy.get('.text-green-600').contains('One number').should('be.visible');
  });

  it('should handle registration errors gracefully', () => {
    cy.visit('/signup');

    // Use an email that already exists in the mock backend
    // The mock backend should have some pre-seeded users
    cy.get('input[placeholder="John Doe"]').type('John Doe');
    cy.get('input[placeholder="john@example.com"]').type('test@example.com');
    cy.get('input[placeholder="Create a strong password"]').type('SecurePass123');
    cy.get('input[placeholder="Smith Family"]').type('Doe Household');
    cy.get('[role="combobox"]').click({ force: true });
    cy.contains('Eastern Time (US & Canada)').click({ force: true });
    cy.get('button[role="checkbox"]').click();
    
    // Submit the form
    cy.contains('button', 'Create Account').click();

    // Check that error message is displayed
    cy.contains('already', { matchCase: false, timeout: 5000 }).should('be.visible');
    
    // Ensure we stay on the signup page
    cy.url().should('include', '/signup');
  });

  it('should toggle password visibility', () => {
    cy.visit('/signup');

    const passwordInput = cy.get('input[placeholder="Create a strong password"]');
    
    // Initially password should be hidden
    passwordInput.should('have.attr', 'type', 'password');

    // Click the toggle button
    cy.get('input[placeholder="Create a strong password"]')
      .parent()
      .find('button[type="button"]')
      .click();

    // Password should now be visible
    cy.get('input[placeholder="Create a strong password"]').should('have.attr', 'type', 'text');

    // Click again to hide
    cy.get('input[placeholder="Create a strong password"]')
      .parent()
      .find('button[type="button"]')
      .click();

    // Password should be hidden again
    cy.get('input[placeholder="Create a strong password"]').should('have.attr', 'type', 'password');
  });

  it('should navigate to login page when clicking sign in link', () => {
    cy.visit('/signup');

    cy.contains('Sign in').click();
    cy.url().should('include', '/login');
  });
});