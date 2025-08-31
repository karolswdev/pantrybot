describe('HouseholdSwitcher', () => {
  beforeEach(() => {
    // Mock GET /api/v1/households to return multiple households
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
    
    // Mock authentication by setting up auth store data
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        // Set authentication token
        win.localStorage.setItem('accessToken', 'mock-token');
        
        // Set up auth store data with multiple households
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
      }
    });
    
    // Wait for the page to load
    // Don't wait for the API call initially as it might not be triggered immediately
  });

  it('should list all user households and allow switching', () => {
    // Arrange: Households are already mocked in beforeEach
    
    // Act: Click the household switcher in the header
    // The household switcher should be visible with the current household name
    cy.get('[data-testid="household-switcher-trigger"]').should('be.visible');
    cy.get('[data-testid="household-switcher-trigger"]').should('contain', 'Smith Family');
    cy.get('[data-testid="household-switcher-trigger"]').click();
    
    // Assert: Verify the dropdown displays all mocked households
    cy.get('[data-testid="household-option-household-1"]').should('be.visible');
    cy.get('[data-testid="household-option-household-2"]').should('be.visible');
    cy.get('[data-testid="household-option-household-3"]').should('be.visible');
    
    // Verify household details are displayed
    cy.get('[data-testid="household-option-household-1"]').within(() => {
      cy.contains('Smith Family').should('be.visible');
      cy.contains('admin').should('be.visible');
      cy.contains('4 members').should('be.visible');
    });
    
    cy.get('[data-testid="household-option-household-2"]').within(() => {
      cy.contains('Beach House').should('be.visible');
      cy.contains('member').should('be.visible');
      cy.contains('2 members').should('be.visible');
    });
    
    // Act: Click a different household
    cy.get('[data-testid="household-option-household-2"]').click();
    
    // Assert: Verify global state is updated with new activeHouseholdId
    // The household switcher should now show the selected household
    cy.get('[data-testid="household-switcher-trigger"]').should('contain', 'Beach House');
    
    // Verify that the state persists (reopen dropdown to check checkmark)
    cy.get('[data-testid="household-switcher-trigger"]').click();
    cy.get('[data-testid="household-option-household-2"]').within(() => {
      // Should have a checkmark indicating it's selected
      cy.get('svg').should('exist'); // Check icon
    });
    
    // Verify other households don't have checkmark
    cy.get('[data-testid="household-option-household-1"]').within(() => {
      cy.get('svg').should('not.exist');
    });
  });
});