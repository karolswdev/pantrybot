describe('Debug Auth Issue', () => {
  it('should debug registration and authentication flow', () => {
    // Clear local storage before test
    cy.clearLocalStorage();
    
    // Visit signup page
    cy.visit('/signup');
    
    // Intercept the register API call
    cy.intercept('POST', '**/auth/register', (req) => {
      cy.log('Register Request Headers:', JSON.stringify(req.headers));
      cy.log('Register Request Body:', JSON.stringify(req.body));
    }).as('registerRequest');
    
    // Fill the form with unique email
    const uniqueEmail = `test-${Date.now()}@example.com`;
    cy.get('input[name="displayName"]').type('Test User');
    cy.get('input[name="email"]').type(uniqueEmail);
    cy.get('input[name="password"]').type('TestPass123');
    cy.get('input[name="householdName"]').type('Test House');
    cy.get('input[type="checkbox"]').check({ force: true });
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@registerRequest').then((interception) => {
      cy.log('Register Response Status:', interception.response?.statusCode);
      cy.log('Register Response Body:', JSON.stringify(interception.response?.body));
    });
    
    // Check local storage after registration
    cy.wait(1000); // Give time for state to update
    cy.window().then((win) => {
      const authStorage = win.localStorage.getItem('auth-storage');
      const accessToken = win.localStorage.getItem('access_token');
      const refreshToken = win.localStorage.getItem('refresh_token');
      
      cy.log('Auth Storage:', authStorage);
      cy.log('Access Token:', accessToken ? 'Present' : 'Missing');
      cy.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
      
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          cy.log('Auth Storage Parsed:', JSON.stringify(parsed));
        } catch (e) {
          cy.log('Failed to parse auth storage');
        }
      }
    });
    
    // Check current URL
    cy.url().then(url => {
      cy.log('Current URL after registration:', url);
    });
    
    // Check if we can manually navigate to dashboard
    cy.visit('/dashboard').then(() => {
      cy.url().then(url => {
        cy.log('URL after manual navigation to dashboard:', url);
      });
    });
  });
  
  it('should debug login flow', () => {
    // Clear local storage before test
    cy.clearLocalStorage();
    
    // Visit login page
    cy.visit('/login');
    
    // Intercept the login API call
    cy.intercept('POST', '**/auth/login', (req) => {
      cy.log('Login Request Headers:', JSON.stringify(req.headers));
      cy.log('Login Request Body:', JSON.stringify(req.body));
    }).as('loginRequest');
    
    // Use the seeded user
    cy.get('input[name="email"]').type('test.user@example.com');
    cy.get('input[name="password"]').type('Password123!');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the API call
    cy.wait('@loginRequest').then((interception) => {
      cy.log('Login Response Status:', interception.response?.statusCode);
      cy.log('Login Response Body:', JSON.stringify(interception.response?.body));
    });
    
    // Check local storage after login
    cy.wait(1000); // Give time for state to update
    cy.window().then((win) => {
      const authStorage = win.localStorage.getItem('auth-storage');
      const accessToken = win.localStorage.getItem('access_token');
      const refreshToken = win.localStorage.getItem('refresh_token');
      
      cy.log('Auth Storage:', authStorage);
      cy.log('Access Token:', accessToken ? 'Present' : 'Missing');
      cy.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
      
      if (authStorage) {
        try {
          const parsed = JSON.parse(authStorage);
          cy.log('Auth Storage Parsed:', JSON.stringify(parsed));
        } catch (e) {
          cy.log('Failed to parse auth storage');
        }
      }
    });
    
    // Check current URL
    cy.url().then(url => {
      cy.log('Current URL after login:', url);
    });
  });
});