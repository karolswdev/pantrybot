/**
 * Helper functions for setting up authentication in Cypress tests
 */

export interface AuthSetupData {
  accessToken: string;
  refreshToken: string;
  userId: string;
  defaultHouseholdId: string;
  displayName: string;
  email: string;
}

/**
 * Sets up authentication state in localStorage for Cypress tests
 * This ensures both the auth store and token manager have the necessary data
 */
export function setupAuth(authData: AuthSetupData) {
  const { accessToken, refreshToken, userId, defaultHouseholdId, displayName, email } = authData;
  
  // Build user object for auth store
  const user = {
    id: userId,
    email: email,
    displayName: displayName,
    defaultHouseholdId: defaultHouseholdId,
    households: [{
      householdId: defaultHouseholdId,
      name: `${displayName}'s Home`,
      role: 'admin'
    }]
  };
  
  // Set auth state in localStorage (for Zustand store)
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
  localStorage.setItem('auth-storage', JSON.stringify(authStorage));
  
  // Also set individual token keys for tokenManager
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  
  // Set token expiry (15 minutes from now)
  const expiryTime = Date.now() + (15 * 60 * 1000);
  localStorage.setItem('token_expiry', expiryTime.toString());
}

/**
 * Cypress command to set up authentication before visiting a page
 */
Cypress.Commands.add('setupAuth', (authData: AuthSetupData) => {
  cy.window().then((win) => {
    setupAuth.call(win, authData);
  });
});

// Add type definition for the custom command
declare global {
  namespace Cypress {
    interface Chainable {
      setupAuth(authData: AuthSetupData): Chainable<void>;
    }
  }
}