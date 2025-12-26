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

    // Fill in the form with valid data (updated placeholders)
    cy.get('input[placeholder="What should we call you?"]').type('John Doe');
    cy.get('input[placeholder="you@example.com"]').type(testEmail);
    cy.get('input[placeholder="Create a strong password"]').type('SecurePass123');
    cy.get('input[placeholder="e.g., The Smith Kitchen"]').type('Doe Household');

    // Select timezone (click on the select trigger)
    cy.get('[role="combobox"]').click({ force: true });
    cy.contains('Eastern Time (US & Canada)').click({ force: true });

    // Check the terms checkbox
    cy.get('button[role="checkbox"]').click();

    // Submit the form (updated button text)
    cy.contains('button', 'Get Started').click();

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

    // Try to submit without filling any fields (updated button text)
    cy.contains('button', 'Get Started').click();

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

    // Check that indicators show as not met (gray color - updated class)
    cy.get('.text-gray-400').contains('8+ characters').should('be.visible');
    cy.get('.text-gray-400').contains('One uppercase letter').should('be.visible');
    cy.get('.text-gray-400').contains('One number').should('be.visible');

    // Clear and type a strong password
    passwordInput.clear().type('StrongPass123');

    // Check that indicators show as met (primary color - updated from green)
    cy.get('.text-primary-600').contains('8+ characters').should('be.visible');
    cy.get('.text-primary-600').contains('One uppercase letter').should('be.visible');
    cy.get('.text-primary-600').contains('One number').should('be.visible');
  });

  it('should handle registration errors gracefully', () => {
    cy.visit('/signup');

    // Use an email that already exists in the mock backend
    // The mock backend should have some pre-seeded users
    cy.get('input[placeholder="What should we call you?"]').type('John Doe');
    cy.get('input[placeholder="you@example.com"]').type('test@example.com');
    cy.get('input[placeholder="Create a strong password"]').type('SecurePass123');
    cy.get('input[placeholder="e.g., The Smith Kitchen"]').type('Doe Household');
    cy.get('[role="combobox"]').click({ force: true });
    cy.contains('Eastern Time (US & Canada)').click({ force: true });
    cy.get('button[role="checkbox"]').click();

    // Submit the form (updated button text)
    cy.contains('button', 'Get Started').click();

    // Check that error message is displayed
    cy.contains('already', { matchCase: false, timeout: 5000 }).should('be.visible');

    // Ensure we stay on the signup page
    cy.url().should('include', '/signup');
  });

  it('should toggle password visibility', () => {
    cy.visit('/signup');

    const passwordSelector = 'input[placeholder="Create a strong password"]';

    // Initially password should be hidden
    cy.get(passwordSelector).should('have.attr', 'type', 'password');

    // Click the toggle button
    cy.get(passwordSelector)
      .parent()
      .find('button[type="button"]')
      .click();

    // Password should now be visible
    cy.get(passwordSelector).should('have.attr', 'type', 'text');

    // Click again to hide
    cy.get(passwordSelector)
      .parent()
      .find('button[type="button"]')
      .click();

    // Password should be hidden again
    cy.get(passwordSelector).should('have.attr', 'type', 'password');
  });

  it('should navigate to login page when clicking sign in link', () => {
    cy.visit('/signup');

    cy.contains('Sign in').click();
    cy.url().should('include', '/login');
  });
});
