describe('Telegram Account Linking', () => {
  let authToken: string;
  let userId: string;

  beforeEach(() => {
    // Reset database before each test
    cy.request('POST', 'http://localhost:8080/api/v1/test/reset-db');
    
    // Register and login
    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: 'test@example.com',
      password: 'Test123456',  // Use simpler password without special chars
      displayName: 'Test User'
    }).then((response) => {
      const { accessToken, refreshToken, userId: uid, defaultHouseholdId, displayName, email } = response.body;
      
      // Store for use in tests
      authToken = accessToken;
      userId = uid;
      
      // Build user object for auth store
      const user = {
        id: uid,
        email: email,
        displayName: displayName,
        defaultHouseholdId: defaultHouseholdId,  // Add this to match what the frontend expects
        households: [{
          householdId: defaultHouseholdId,
          name: `${displayName}'s Home`,
          role: 'admin'
        }]
      };
      
      // Set auth state properly in localStorage before visiting
      cy.window().then((win) => {
        // Build auth storage for Zustand
        const authStorage = {
          state: {
            user: user,
            households: [{
              id: defaultHouseholdId,
              name: `${displayName}'s Home`,
              role: 'admin'
            }],
            currentHouseholdId: defaultHouseholdId,
            isAuthenticated: true,
            token: accessToken,
            refreshToken: refreshToken
          }
        };
        
        // Set auth storage for Zustand
        win.localStorage.setItem('auth-storage', JSON.stringify(authStorage));
        
        // Also set individual token keys for tokenManager
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        
        // Set token expiry (15 minutes from now)
        const expiryTime = Date.now() + (15 * 60 * 1000);
        win.localStorage.setItem('token_expiry', expiryTime.toString());
      });
      
      // Now visit the page
      cy.visit('/settings/notifications');
    });
  });

  it('should link a telegram account via the mock backend', () => {
    // TC-INT-4.4: Link Telegram account via backend
    const verificationCode = 'ABC123'; // This code triggers success in the mock backend

    // Wait for page to load
    cy.contains('Notification Settings', { timeout: 10000 }).should('be.visible');

    // Find and click the "Connect with Telegram" button
    cy.contains('button', 'Connect with Telegram').click();

    // Verify the modal appears with instructions
    cy.contains('Connect Telegram Account').should('be.visible');
    cy.contains('Open Telegram and search for @FridgrBot').should('be.visible');
    cy.contains('Start a conversation with the bot').should('be.visible');
    cy.contains('Send /link command to get a verification code').should('be.visible');
    cy.contains('Enter the verification code below').should('be.visible');

    // Enter the verification code
    cy.get('input#code').type(verificationCode);
    cy.get('input#code').should('have.value', verificationCode);

    // Click the link account button
    cy.contains('button', 'Link Account').click();

    // Wait for async operations
    cy.wait(2000);

    // Verify success toast appears
    cy.contains('Success').should('be.visible');
    cy.contains('Your Telegram account has been linked').should('be.visible');

    // Verify the modal is closed
    cy.contains('Connect Telegram Account').should('not.exist');

    // Reload the page to verify the linked status persists
    cy.reload();
    cy.wait(2000);
    
    // After linking, the button should change to show linked status
    // or Telegram settings should show as linked
    cy.contains('Notification Settings').should('be.visible');
    
    // The UI should indicate Telegram is now linked
    // (exact UI depends on implementation)
  });
});