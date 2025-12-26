describe('Dashboard Integration with Backend', () => {
  let accessToken: string;
  let householdId: string;

  before(() => {
    // Start fresh - clear any existing auth data
    cy.clearLocalStorage();
  });

  it('should fetch and display real backend data', () => {
    // Step 1: Register a new user to get fresh tokens
    const uniqueEmail = `dashboard-test-${Date.now()}@example.com`;

    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: uniqueEmail,
      password: 'password123',
      displayName: 'Dashboard Test User'
    }).then((response) => {
      expect(response.status).to.equal(201);
      accessToken = response.body.accessToken;
      householdId = response.body.defaultHouseholdId;

      // Store tokens in localStorage as the app would
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', response.body.refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()); // 15 minutes

        // Also set the auth store state
        const authState = {
          state: {
            user: {
              id: response.body.userId,
              email: uniqueEmail,
              displayName: 'Dashboard Test User',
              activeHouseholdId: householdId,
              defaultHouseholdId: householdId
            },
            households: [{
              id: householdId,
              name: "Dashboard Test User's Home",
              role: 'admin'
            }],
            currentHouseholdId: householdId,
            isAuthenticated: true,
            isLoading: false,
            error: null
          },
          version: 0
        };
        win.localStorage.setItem('auth-storage', JSON.stringify(authState));
      });

      cy.log('✓ User registered and tokens stored');
      cy.log(`Access Token: ${accessToken.substring(0, 20)}...`);
      cy.log(`Household ID: ${householdId}`);

      // Step 2: Add some inventory items to have data to display
      const items = [
        { name: 'Milk', quantity: 2, unit: 'liters', location: 'fridge', expirationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() }, // Expiring in 2 days
        { name: 'Bread', quantity: 1, unit: 'loaf', location: 'pantry', expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Cheese', quantity: 1, unit: 'pack', location: 'fridge', expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Eggs', quantity: 12, unit: 'pieces', location: 'fridge', expirationDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      items.forEach((item) => {
        cy.request({
          method: 'POST',
          url: `http://localhost:8080/api/v1/households/${householdId}/items`,
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: item
        }).then((addResponse) => {
          expect(addResponse.status).to.equal(201);
        });
      });

      cy.log('✓ Added 4 inventory items');
    });

    // Step 3: Visit the dashboard
    cy.visit('http://localhost:3003/dashboard');

    // Wait for the dashboard to load - check for the user name in the welcome message
    cy.contains('Dashboard Test User', { timeout: 10000 }).should('be.visible');

    // Wait for React Query to fetch data
    cy.wait(1000);

    // Step 4: Verify backend data is displayed
    // Check the stat cards (uppercase CSS applied to titles)
    cy.contains(/total items/i).should('be.visible');
    cy.contains('4').should('be.visible'); // We added 4 items

    cy.contains(/expiring soon/i).should('be.visible');

    // Step 5: Verify the expiring items section
    // One item (Milk) is expiring in 2 days, which should show in the expiring list
    // Note: The backend defines "expiring soon" as items within 5 days
    cy.contains('Milk').should('be.visible');

    cy.log('✓ Dashboard is displaying data from the backend');
  });

  it('should handle authentication errors gracefully', () => {
    // Clear tokens to simulate logged out state
    cy.clearLocalStorage();

    // Try to visit dashboard without auth
    cy.visit('http://localhost:3003/dashboard', { failOnStatusCode: false });

    // Should redirect to login or show error
    // The exact behavior depends on the app's auth guard implementation
    cy.url().should('include', '/login');
  });
});
