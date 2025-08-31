describe('SignUp E2E Tests', () => {
  beforeEach(() => {
    // Clear any existing auth data
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('should successfully register a new user and redirect to the dashboard', () => {
    // Intercept the registration API call
    cy.intercept('POST', '**/api/v1/auth/register', {
      statusCode: 201,
      body: {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        email: 'newuser@example.com',
        displayName: 'John Doe',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.access',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.refresh',
        expiresIn: 900,
        defaultHouseholdId: '550e8400-e29b-41d4-a716-446655440002'
      }
    }).as('registerRequest');

    // Navigate to the signup page
    cy.visit('/signup');

    // Fill in the form with valid data
    cy.get('input[placeholder="John Doe"]').type('John Doe');
    cy.get('input[placeholder="john@example.com"]').type('newuser@example.com');
    cy.get('input[placeholder="Create a strong password"]').type('SecurePass123!');
    cy.get('input[placeholder="Smith Family"]').type('Doe Household');
    
    // Select timezone (click on the select trigger)
    cy.get('[role="combobox"]').click();
    cy.contains('Eastern Time (US & Canada)').click();
    
    // Check the terms checkbox
    cy.get('button[role="checkbox"]').click();
    
    // Submit the form
    cy.contains('button', 'Create Account').click();

    // Verify the API was called with correct payload
    cy.wait('@registerRequest').then((interception) => {
      expect(interception.request.body).to.deep.include({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        displayName: 'John Doe',
        timezone: 'America/New_York'
      });
    });

    // Assert that tokens are stored in localStorage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.equal('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.access');
      expect(win.localStorage.getItem('refresh_token')).to.equal('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.refresh');
    });

    // Assert that the application navigates to the dashboard
    cy.url().should('include', '/dashboard');
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
    cy.contains('8+ characters').parent().should('have.class', 'text-gray-400');
    cy.contains('One uppercase letter').parent().should('have.class', 'text-gray-400');
    cy.contains('One number').parent().should('have.class', 'text-gray-400');

    // Clear and type a strong password
    passwordInput.clear().type('StrongPass123');
    
    // Check that indicators show as met (green color)
    cy.contains('8+ characters').parent().should('have.class', 'text-green-600');
    cy.contains('One uppercase letter').parent().should('have.class', 'text-green-600');
    cy.contains('One number').parent().should('have.class', 'text-green-600');
  });

  it('should handle registration errors gracefully', () => {
    // Intercept with an error response
    cy.intercept('POST', '**/api/v1/auth/register', {
      statusCode: 409,
      body: {
        message: 'Email already registered'
      }
    }).as('registerError');

    cy.visit('/signup');

    // Fill in the form
    cy.get('input[placeholder="John Doe"]').type('John Doe');
    cy.get('input[placeholder="john@example.com"]').type('existing@example.com');
    cy.get('input[placeholder="Create a strong password"]').type('SecurePass123!');
    cy.get('input[placeholder="Smith Family"]').type('Doe Household');
    cy.get('[role="combobox"]').click();
    cy.contains('Eastern Time (US & Canada)').click();
    cy.get('button[role="checkbox"]').click();
    
    // Submit the form
    cy.contains('button', 'Create Account').click();

    // Wait for the error response
    cy.wait('@registerError');

    // Check that error message is displayed
    cy.contains('Email already registered').should('be.visible');
    
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
    passwordInput.should('have.attr', 'type', 'text');

    // Click again to hide
    cy.get('input[placeholder="Create a strong password"]')
      .parent()
      .find('button[type="button"]')
      .click();

    // Password should be hidden again
    passwordInput.should('have.attr', 'type', 'password');
  });

  it('should navigate to login page when clicking sign in link', () => {
    cy.visit('/signup');

    cy.contains('Sign in').click();
    cy.url().should('include', '/login');
  });
});