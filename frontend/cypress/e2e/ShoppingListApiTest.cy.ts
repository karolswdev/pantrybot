describe('Shopping List API Test', () => {
  it('should verify shopping list item operations', () => {
    let accessToken: string;
    let householdId: string;
    let listId: string;
    let itemId: string;
    
    // Step 1: Register and login
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/register',
      body: {
        email: 'apitest@example.com',
        password: 'Test123!@#',
        displayName: 'API Test User'
      },
      failOnStatusCode: false
    }).then(() => {
      cy.request('POST', 'http://localhost:8080/api/v1/auth/login', {
        email: 'apitest@example.com',
        password: 'Test123!@#'
      }).then((response) => {
        accessToken = response.body.accessToken;
        
        // Step 2: Get household
        cy.request({
          method: 'GET',
          url: 'http://localhost:8080/api/v1/households',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }).then((householdResponse) => {
          householdId = householdResponse.body.households[0].id;
          
          // Step 3: Create shopping list
          cy.request({
            method: 'POST',
            url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists`,
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: { name: 'API Test List' }
          }).then((listResponse) => {
            listId = listResponse.body.id;
            cy.log('Created list:', listId);
            
            // Step 4: Add item
            cy.request({
              method: 'POST',
              url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: { name: 'Test Item', quantity: 1 }
            }).then((itemResponse) => {
              itemId = itemResponse.body.id;
              cy.log('Created item:', itemId);
              expect(itemResponse.status).to.eq(201);
              expect(itemResponse.body.name).to.eq('Test Item');
              
              // Step 5: Get items
              cy.request({
                method: 'GET',
                url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items`,
                headers: { 'Authorization': `Bearer ${accessToken}` }
              }).then((getResponse) => {
                cy.log('Items:', JSON.stringify(getResponse.body));
                expect(getResponse.body).to.be.an('array');
                expect(getResponse.body).to.have.length.greaterThan(0);
                expect(getResponse.body[0].name).to.eq('Test Item');
                
                // Step 6: Update item (mark as completed)
                cy.request({
                  method: 'PATCH',
                  url: `http://localhost:8080/api/v1/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: { completed: true }
                }).then((updateResponse) => {
                  cy.log('Updated item:', JSON.stringify(updateResponse.body));
                  expect(updateResponse.status).to.eq(200);
                  expect(updateResponse.body.completed).to.be.true;
                });
              });
            });
          });
        });
      });
    });
  });
});