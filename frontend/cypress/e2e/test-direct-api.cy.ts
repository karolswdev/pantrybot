describe('Test Direct API', () => {
  it('should test if API calls work directly', () => {
    // Test if we can make a direct API call
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/register',
      body: {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPass123',
        displayName: 'Test User',
        timezone: 'UTC',
        defaultHouseholdName: 'Test House'
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Direct API Response Status:', response.status);
      cy.log('Direct API Response Body:', JSON.stringify(response.body));
      expect(response.status).to.be.oneOf([200, 201]);
    });
  });
  
  it('should test if login API works directly', () => {
    // Test login with seeded user
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/login',
      body: {
        email: 'test.user@example.com',
        password: 'Password123!'
      },
      failOnStatusCode: false
    }).then((response) => {
      cy.log('Login API Response Status:', response.status);
      cy.log('Login API Response Body:', JSON.stringify(response.body));
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('accessToken');
    });
  });
});