describe('Dashboard E2E Tests', () => {
  interface AuthData {
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
    displayName: string;
    defaultHouseholdId: string;
  };
  let authData: AuthData;
  let householdId: string;
  let accessToken: string;

  beforeEach(() => {
    // Clear any existing auth data
    cy.clearLocalStorage();

    // Register and login a test user
    const uniqueEmail = `test-${Date.now()}@example.com`;

    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: uniqueEmail,
      password: 'password123',
      displayName: 'Test User'
    }).then((response) => {
      authData = response.body as AuthData;
      accessToken = authData.accessToken;
      householdId = authData.defaultHouseholdId;

      // Set up authentication in localStorage
      cy.window().then((win) => {
        // Store tokens for API client
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', authData.refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()); // 15 minutes

        // Store auth state for the app
        const authState = {
          state: {
            user: {
              id: authData.userId,
              email: uniqueEmail,
              displayName: 'Test User',
              activeHouseholdId: householdId,
              defaultHouseholdId: householdId
            },
            households: [{
              id: householdId,
              name: "Test User's Home",
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
    });
  });

  it('should display empty dashboard state for new user', () => {
    // New users have no inventory items, so they see the empty state
    cy.visit('http://localhost:3003/dashboard');

    // Wait for the dashboard to load
    cy.contains("Test User's Home", { timeout: 10000 }).should('be.visible');

    // Verify the empty dashboard state is shown
    cy.contains('Your inventory is empty!').should('be.visible');
    cy.contains('Add First Item').should('be.visible');
  });

  it('should display summary statistics after adding items', () => {
    // First, add some inventory items via API
    cy.window().then((win) => {
      const token = win.localStorage.getItem('access_token');

      // Add multiple items to the inventory
      const items = [
        { name: 'Milk', quantity: 2, unit: 'liters', location: 'fridge', expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Bread', quantity: 1, unit: 'loaf', location: 'pantry', expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() },
        { name: 'Cheese', quantity: 1, unit: 'pack', location: 'fridge', expirationDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
      ];

      // Add items sequentially
      cy.wrap(items).each((item: { name: string; quantity: number; location: string; expirationDate: string }) => {
        cy.request({
          method: 'POST',
          url: `http://localhost:8080/api/v1/households/${householdId}/items`,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: item
        }).then((response) => {
          expect(response.status).to.equal(201);
        });
      });
    });

    // Now visit the dashboard
    cy.visit('http://localhost:3003/dashboard');

    // Wait for the dashboard to load with the welcome message
    cy.contains('Test User', { timeout: 10000 }).should('be.visible');

    // Wait for data to be fetched
    cy.wait(1000);

    // Verify the summary cards are visible (uppercase CSS applied to titles)
    cy.contains(/total items/i).should('be.visible');
    cy.contains('3').should('be.visible'); // We added 3 items

    cy.contains(/expiring soon/i).should('be.visible');

    // Verify the household name is displayed
    cy.contains("Test User's Home").should('be.visible');
  });

  it('should show loading skeleton while fetching data', () => {
    cy.visit('http://localhost:3003/dashboard');

    // Check for loading skeleton elements (may be very brief)
    cy.get('[data-testid="dashboard-skeleton"]', { timeout: 1000 }).should('exist');

    // After data loads, skeleton should be gone
    cy.contains("Test User's Home", { timeout: 10000 }).should('be.visible');
    cy.get('[data-testid="dashboard-skeleton"]').should('not.exist');
  });
});
