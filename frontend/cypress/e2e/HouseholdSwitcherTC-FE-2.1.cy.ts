describe('HouseholdSwitcher - TC-FE-2.1', () => {
  beforeEach(() => {
    // Mock GET /api/v1/households to return a list of 2+ households
    cy.intercept('GET', '/api/v1/households', {
      statusCode: 200,
      body: {
        households: [
          {
            id: 'household-1',
            name: 'Smith Family',
            role: 'admin',
            memberCount: 4,
            createdAt: '2024-01-01T00:00:00Z'
          },
          {
            id: 'household-2',
            name: 'Beach House',
            role: 'member',
            memberCount: 2,
            createdAt: '2024-01-15T00:00:00Z'
          },
          {
            id: 'household-3',
            name: 'Work Kitchen',
            role: 'viewer',
            memberCount: 12,
            createdAt: '2024-02-01T00:00:00Z'
          }
        ]
      }
    }).as('getHouseholds');
  });

  it('should list all user households and allow switching', () => {
    // Arrange: Mock GET /api/v1/households to return a list of 2+ households (done in beforeEach)
    
    // Set up initial auth state with households
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'mock-token');
      
      // Set up auth store with initial household data
      const authData = {
        user: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: 'Test User',
          activeHouseholdId: 'household-1'
        },
        households: [
          {
            id: 'household-1',
            name: 'Smith Family',
            role: 'admin',
            memberCount: 4
          },
          {
            id: 'household-2',
            name: 'Beach House',
            role: 'member',
            memberCount: 2
          },
          {
            id: 'household-3',
            name: 'Work Kitchen',
            role: 'viewer',
            memberCount: 12
          }
        ],
        currentHouseholdId: 'household-1'
      };
      win.localStorage.setItem('auth-storage', JSON.stringify({ state: authData }));
    });
    
    // Visit the dashboard
    cy.visit('/dashboard');
    
    // Wait for the page to fully load
    cy.contains('Welcome back').should('be.visible');
    
    // Act: Click the household switcher in the header
    cy.get('header').within(() => {
      // The household switcher should show the current household name
      cy.contains('button', 'Smith Family').should('be.visible').click();
    });
    
    // Assert: Verify the dropdown displays all mocked households
    cy.get('[role="menu"]').should('be.visible').within(() => {
      cy.contains('Switch Household').should('be.visible');
      cy.contains('Smith Family').should('be.visible');
      cy.contains('Beach House').should('be.visible');
      cy.contains('Work Kitchen').should('be.visible');
    });
    
    // Act: Click a different household
    cy.get('[role="menu"]').within(() => {
      cy.contains('Beach House').click();
    });
    
    // Assert: Verify global state (e.g., in Zustand) is updated with the new activeHouseholdId
    // The household switcher button should now show the newly selected household
    cy.get('header').within(() => {
      cy.contains('button', 'Beach House').should('be.visible');
    });
    
    // Verify the state persists by reopening the dropdown
    cy.get('header').within(() => {
      cy.contains('button', 'Beach House').click();
    });
    
    // The Beach House option should have a checkmark
    cy.get('[role="menu"]').within(() => {
      // Look for the Beach House item and verify it has a check icon
      cy.contains('Beach House')
        .parent()
        .parent()
        .within(() => {
          cy.get('svg').should('exist'); // Check icon
        });
    });
  });
});