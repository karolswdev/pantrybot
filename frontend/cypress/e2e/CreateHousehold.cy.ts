describe('CreateHousehold - TC-INT-2.3', () => {
  let authData: any;
  let householdId: string;

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
      authData = response.body;
      const { accessToken, refreshToken, userId, email, displayName, defaultHouseholdId } = authData;
      householdId = defaultHouseholdId;
      
      // Set up authentication in localStorage
      cy.window().then((win) => {
        // Store tokens for API client
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()); // 15 minutes
        
        // Store auth state for the app
        const authState = {
          state: {
            user: {
              id: userId,
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

  it('should create a new household via the mock backend', () => {
    // Navigate to dashboard
    cy.visit('http://localhost:3003/dashboard');
    
    // Wait for page to load
    cy.contains('Welcome back', { timeout: 10000 }).should('be.visible');
    
    // Create a new household via direct API call
    // In a real implementation, this would be triggered by a UI component
    cy.window().then((win) => {
      const accessToken = win.localStorage.getItem('access_token');
      
      // Make the actual API call to create a household
      cy.request({
        method: 'POST',
        url: 'http://localhost:8080/api/v1/households',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          name: 'New Test Household',
          description: 'A test household created via Cypress'
        }
      }).then((createResponse) => {
        // Verify the response
        expect(createResponse.status).to.equal(201);
        expect(createResponse.body).to.exist;
        
        // The response might have the household at root level or in a household property
        const household = createResponse.body.household || createResponse.body;
        expect(household).to.exist;
        expect(household.name).to.equal('New Test Household');
        
        const newHouseholdId = household.id;
        
        // Verify the new household appears in the households list
        cy.request({
          method: 'GET',
          url: 'http://localhost:8080/api/v1/households',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }).then((listResponse) => {
          expect(listResponse.status).to.equal(200);
          expect(listResponse.body.households).to.be.an('array');
          
          // Should now have at least 2 households (original + new)
          expect(listResponse.body.households.length).to.be.at.least(2);
          
          // Find the new household in the list
          const newHousehold = listResponse.body.households.find(
            (h: any) => h.id === newHouseholdId
          );
          expect(newHousehold).to.exist;
          expect(newHousehold.name).to.equal('New Test Household');
          expect(newHousehold.role).to.equal('admin'); // Creator should be admin
        });
      });
    });
    
    // Log success for the test
    cy.log('✓ Household created successfully via mock backend');
    cy.log('✓ New household appears in households list');
    cy.log('✓ Creator has admin role in new household');
  });
});