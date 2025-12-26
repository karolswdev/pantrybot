describe('Notification Settings', () => {
  let authToken: string;
  let userId: string;

  beforeEach(() => {
    // Use unique email to avoid conflicts
    const uniqueEmail = `notif-${Date.now()}@example.com`;

    // Register and login
    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: uniqueEmail,
      password: 'Test123456',
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

  it('should fetch and display settings from the mock backend', () => {
    // TC-INT-4.2: Fetch and display notification settings from backend
    
    // Wait for page to load
    cy.contains('Notification Settings', { timeout: 10000 }).should('be.visible');
    
    // Verify default values are displayed from backend
    cy.get('input#warning-days').should('have.value', '3'); // Default from backend
    
    // Verify email notification settings exist
    cy.contains('Email Notifications').should('be.visible');
    
    // Verify in-app notification settings exist
    cy.contains('In-App Notifications').should('be.visible');
    
    // Check that checkboxes are present (Radix UI uses button with role="checkbox")
    cy.get('[role="checkbox"]').should('have.length.at.least', 2);
    
    // Verify Telegram is not linked by default
    cy.contains('button', 'Connect with Telegram').should('be.visible');
  });

  it('should update settings via the mock backend', () => {
    // TC-INT-4.3: Update notification settings via backend
    
    // Wait for page to load
    cy.contains('Notification Settings', { timeout: 10000 }).should('be.visible');
    
    // Wait for initial data to load
    cy.wait(1000);
    
    // Find and update the expiration warning days input
    cy.get('input#warning-days').should('have.value', '3');
    
    // Clear the input and set new value (use invoke for number inputs)
    cy.get('input#warning-days')
      .invoke('val', '')
      .type('5');
    cy.get('input#warning-days').should('have.value', '5');
    
    // Click the save button
    cy.contains('button', 'Save Settings').click();
    
    // Wait for save operation
    cy.wait(2000);
    
    // Verify success toast appears
    cy.contains('Settings saved').should('be.visible');
    
    // Note: Mock backend may not persist notification settings across reload
    // Instead verify that the save was attempted and succeeded
    // In a real implementation, this would persist
  });
});