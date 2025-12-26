describe('API Client Integration', () => {
  it('should connect to mock backend and fetch household data', () => {
    // Register a new user
    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: `test-${Date.now()}@example.com`,
      password: 'password123',
      displayName: 'API Test User'
    }).then((response) => {
      expect(response.status).to.equal(201);
      const { accessToken, defaultHouseholdId } = response.body;

      // Test direct API call to household endpoint
      cy.request({
        method: 'GET',
        url: `http://localhost:8080/api/v1/households/${defaultHouseholdId}`,
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }).then((householdResponse) => {
        expect(householdResponse.status).to.equal(200);
        expect(householdResponse.body).to.have.property('id', defaultHouseholdId);
        expect(householdResponse.body).to.have.property('name', "API Test User's Home");
        // New users start with empty inventory
        expect(householdResponse.body.statistics).to.have.property('totalItems', 0);
        expect(householdResponse.body.statistics).to.have.property('expiringItems', 0);

        cy.log('✓ Mock backend is accessible and returning expected data');
        cy.log(`Household ID: ${defaultHouseholdId}`);
        cy.log(`Total Items: ${householdResponse.body.statistics.totalItems}`);
        cy.log(`Expiring Items: ${householdResponse.body.statistics.expiringItems}`);
      });
    });
  });
});
