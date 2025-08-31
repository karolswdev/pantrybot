describe('Shopping Lists', () => {
  beforeEach(() => {
    // Set up authentication state
    window.localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        isAuthenticated: true,
        activeHouseholdId: 'household-1',
      },
    }));
  });

  it('should display shopping lists for the active household', () => {
    // TC-FE-5.1: Display shopping lists for the active household
    
    // Arrange: Intercept GET /api/v1/households/{id}/shopping-lists and return mock data
    cy.intercept('GET', '/api/v1/households/household-1/shopping-lists', {
      statusCode: 200,
      body: {
        lists: [
          {
            id: 'list-1',
            name: 'Weekly Groceries',
            itemCount: 12,
            completedCount: 3,
            createdAt: '2024-01-14T00:00:00Z',
            createdBy: 'John Doe',
            lastUpdated: '2024-01-15T00:00:00Z',
          },
          {
            id: 'list-2',
            name: 'Party Supplies',
            itemCount: 5,
            completedCount: 0,
            createdAt: '2024-01-15T00:00:00Z',
            createdBy: 'Jane Smith',
            lastUpdated: '2024-01-15T00:00:00Z',
          },
        ],
        total: 2,
      },
    }).as('getShoppingLists');

    // Act: Navigate to the /shopping page
    cy.visit('/shopping');
    
    // Wait for the API call
    cy.wait('@getShoppingLists');

    // Assert: Verify that 2 shopping list components are rendered
    cy.get('[data-testid="shopping-list-page"]').should('exist');
    cy.get('[data-testid^="shopping-list-"]').should('have.length', 2);
    
    // Assert: Verify the names match the mocked data
    cy.get('[data-testid="shopping-list-list-1"]').should('contain', 'Weekly Groceries');
    cy.get('[data-testid="shopping-list-list-1"]').should('contain', '12 items');
    cy.get('[data-testid="shopping-list-list-1"]').should('contain', 'John Doe');
    
    cy.get('[data-testid="shopping-list-list-2"]').should('contain', 'Party Supplies');
    cy.get('[data-testid="shopping-list-list-2"]').should('contain', '5 items');
    cy.get('[data-testid="shopping-list-list-2"]').should('contain', 'Jane Smith');
  });

  it('should successfully create a new shopping list', () => {
    // TC-FE-5.2: Successfully create a new shopping list
    
    // Arrange: Intercept POST /api/v1/households/{id}/shopping-lists
    cy.intercept('POST', '/api/v1/households/household-1/shopping-lists', {
      statusCode: 201,
      body: {
        id: 'new-list-id',
        name: 'Weekend Shopping',
        notes: 'For the BBQ',
        items: [],
        createdAt: '2024-01-16T00:00:00Z',
        createdBy: 'user-1',
      },
    }).as('createShoppingList');

    // Also intercept the GET to return the updated list
    cy.intercept('GET', '/api/v1/households/household-1/shopping-lists', {
      statusCode: 200,
      body: {
        lists: [
          {
            id: 'new-list-id',
            name: 'Weekend Shopping',
            itemCount: 0,
            completedCount: 0,
            createdAt: '2024-01-16T00:00:00Z',
            createdBy: 'Test User',
            lastUpdated: '2024-01-16T00:00:00Z',
          },
        ],
        total: 1,
      },
    }).as('getUpdatedLists');

    // Act: Navigate to shopping page
    cy.visit('/shopping');
    
    // Click the "New List" button
    cy.get('[data-testid="new-list-button"]').click();
    
    // Verify modal opens
    cy.get('[data-testid="create-list-modal"]').should('be.visible');
    
    // Enter a name in the modal
    cy.get('[data-testid="list-name-input"]').type('Weekend Shopping');
    cy.get('[data-testid="list-notes-input"]').type('For the BBQ');
    
    // Submit the form
    cy.get('[data-testid="create-list-button"]').click();

    // Assert: Verify the POST was called with the correct name
    cy.wait('@createShoppingList').then((interception) => {
      expect(interception.request.body).to.deep.include({
        name: 'Weekend Shopping',
        notes: 'For the BBQ',
      });
    });

    // Wait for the list refresh
    cy.wait('@getUpdatedLists');

    // Assert: Verify the new list appears in the UI after successful response
    cy.get('[data-testid="shopping-list-new-list-id"]').should('exist');
    cy.get('[data-testid="shopping-list-new-list-id"]').should('contain', 'Weekend Shopping');
    
    // Verify modal is closed
    cy.get('[data-testid="create-list-modal"]').should('not.exist');
  });
});