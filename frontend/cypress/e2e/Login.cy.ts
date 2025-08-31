describe('Login E2E Tests', () => {
  beforeEach(() => {
    // Clear any existing auth data
    cy.window().then((win) => {
      win.localStorage.clear();
    });
  });

  it('should successfully log in an existing user', () => {
    // Intercept the login API call
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 200,
      body: {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.access',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.refresh',
        expiresIn: 900,
        households: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'Home',
            role: 'admin'
          }
        ]
      }
    }).as('loginRequest');

    // Navigate to the login page
    cy.visit('/login');

    // Fill in valid credentials
    cy.get('input[placeholder="user@example.com"]').type('testuser@example.com');
    cy.get('input[placeholder="Enter your password"]').type('TestPass123!');
    
    // Submit the form
    cy.contains('button', 'Sign In').click();

    // Verify the API was called correctly
    cy.wait('@loginRequest').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        email: 'testuser@example.com',
        password: 'TestPass123!'
      });
    });

    // Assert that tokens are stored
    cy.window().then((win) => {
      expect(win.localStorage.getItem('access_token')).to.equal('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.access');
      expect(win.localStorage.getItem('refresh_token')).to.equal('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.refresh');
    });

    // Assert redirection to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should display error for invalid credentials', () => {
    // Intercept with error response
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 401,
      body: {
        message: 'Invalid credentials'
      }
    }).as('loginError');

    cy.visit('/login');

    // Fill in invalid credentials
    cy.get('input[placeholder="user@example.com"]').type('wrong@example.com');
    cy.get('input[placeholder="Enter your password"]').type('WrongPass');
    
    // Submit the form
    cy.contains('button', 'Sign In').click();

    // Wait for the error response
    cy.wait('@loginError');

    // Check that error message is displayed
    cy.contains('Invalid credentials').should('be.visible');
    
    // Ensure we stay on the login page
    cy.url().should('include', '/login');
  });

  it('should validate required fields', () => {
    cy.visit('/login');

    // Try to submit without filling any fields
    cy.contains('button', 'Sign In').click();

    // Check for validation errors
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should validate email format', () => {
    cy.visit('/login');

    // Enter invalid email format
    cy.get('input[placeholder="user@example.com"]').type('invalidemail');
    cy.get('input[placeholder="Enter your password"]').type('SomePassword');
    
    // Submit the form
    cy.contains('button', 'Sign In').click();

    // Check for email validation error
    cy.contains('Invalid email address').should('be.visible');
  });

  it('should toggle password visibility', () => {
    cy.visit('/login');

    const passwordInput = cy.get('input[placeholder="Enter your password"]');
    
    // Initially password should be hidden
    passwordInput.should('have.attr', 'type', 'password');

    // Click the toggle button
    cy.get('input[placeholder="Enter your password"]')
      .parent()
      .find('button[type="button"]')
      .click();

    // Password should now be visible
    passwordInput.should('have.attr', 'type', 'text');

    // Click again to hide
    cy.get('input[placeholder="Enter your password"]')
      .parent()
      .find('button[type="button"]')
      .click();

    // Password should be hidden again
    passwordInput.should('have.attr', 'type', 'password');
  });

  it('should handle remember me checkbox', () => {
    cy.visit('/login');

    // Check the remember me checkbox
    cy.contains('Remember me')
      .parent()
      .find('button[role="checkbox"]')
      .click();

    // Verify checkbox is checked (aria-checked attribute)
    cy.contains('Remember me')
      .parent()
      .find('button[role="checkbox"]')
      .should('have.attr', 'aria-checked', 'true');
  });

  it('should navigate to signup page when clicking sign up link', () => {
    cy.visit('/login');

    cy.contains('Sign up').click();
    cy.url().should('include', '/signup');
  });

  it('should navigate to forgot password page when clicking forgot password link', () => {
    cy.visit('/login');

    cy.contains('Forgot password?').click();
    cy.url().should('include', '/forgot-password');
  });

  it('should show loading state during login', () => {
    // Intercept with a delay
    cy.intercept('POST', '**/api/v1/auth/login', (req) => {
      req.reply({
        delay: 1000,
        statusCode: 200,
        body: {
          userId: '550e8400-e29b-41d4-a716-446655440001',
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.access',
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.refresh',
          expiresIn: 900,
          households: []
        }
      });
    }).as('loginWithDelay');

    cy.visit('/login');

    // Fill in credentials
    cy.get('input[placeholder="user@example.com"]').type('testuser@example.com');
    cy.get('input[placeholder="Enter your password"]').type('TestPass123!');
    
    // Submit the form
    cy.contains('button', 'Sign In').click();

    // Check for loading state
    cy.contains('Signing in...').should('be.visible');
    
    // Wait for the request to complete
    cy.wait('@loginWithDelay');
    
    // Should redirect after successful login
    cy.url().should('include', '/dashboard');
  });

  it('should handle rate limiting errors', () => {
    // Intercept with rate limit error
    cy.intercept('POST', '**/api/v1/auth/login', {
      statusCode: 429,
      body: {
        message: 'Too many failed attempts'
      }
    }).as('rateLimitError');

    cy.visit('/login');

    // Fill in credentials
    cy.get('input[placeholder="user@example.com"]').type('testuser@example.com');
    cy.get('input[placeholder="Enter your password"]').type('TestPass123!');
    
    // Submit the form
    cy.contains('button', 'Sign In').click();

    // Wait for the error response
    cy.wait('@rateLimitError');

    // Check that error message is displayed
    cy.contains('Too many failed attempts').should('be.visible');
    
    // Ensure we stay on the login page
    cy.url().should('include', '/login');
  });
});