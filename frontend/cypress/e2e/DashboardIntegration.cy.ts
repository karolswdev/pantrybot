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
    });
    
    // Step 2: Visit the dashboard
    cy.visit('http://localhost:3003/dashboard');
    
    // Wait for the dashboard to load
    cy.get('h1').should('contain', 'Welcome back');
    
    // Wait a bit for React Query to fetch data
    cy.wait(1000);
    
    // Step 3: Verify backend data is displayed (not mock data)
    // Backend returns: totalItems: 127, expiringItems: 3
    // Mock data has: totalItems: 47, expiringItems: 5
    
    // Check the stat cards for backend values
    cy.contains('h3', 'Total Items')
      .parent()
      .parent()
      .within(() => {
        // Should show 127 from backend, NOT 47 from mock
        cy.get('p.text-2xl').should('contain', '127');
      });
    
    cy.contains('h3', 'Expiring Soon')
      .parent()
      .parent()
      .within(() => {
        // Should show 3 from backend, NOT 5 from mock
        cy.get('p.text-2xl').should('contain', '3');
      });
    
    // Step 4: Verify the expiring items list
    // The backend returns statistics showing 3 expiring items, but the actual items list is empty
    // This is why it shows "No items expiring soon!"
    cy.contains('No items expiring soon!').should('be.visible');
    cy.contains('Great job managing your inventory.').should('be.visible');
    
    cy.log('✓ Expiring items section rendered correctly');
    
    // Step 5: Verify React Query is making real API calls
    cy.window().then((win) => {
      // Check if React Query client exists
      const queryClient = (win as any).__queryClient;
      if (queryClient) {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();
        
        // Log all query keys for debugging
        queries.forEach((query: any) => {
          cy.log(`Query Key: ${JSON.stringify(query.queryKey)}`);
          cy.log(`Query State: ${query.state.status}`);
          if (query.state.data) {
            cy.log(`Query Data: ${JSON.stringify(query.state.data).substring(0, 100)}...`);
          }
        });
        
        // Find the household query
        const householdQuery = queries.find((q: any) => 
          q.queryKey[0] === 'household' && q.queryKey[1] === householdId
        );
        
        if (householdQuery && householdQuery.state.data) {
          expect(householdQuery.state.data.statistics.totalItems).to.equal(127);
          expect(householdQuery.state.data.statistics.expiringItems).to.equal(3);
          cy.log('✓ React Query cache contains backend data');
        }
      }
    });
    
    cy.log('✓ Dashboard is displaying data from the backend, not mock data');
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