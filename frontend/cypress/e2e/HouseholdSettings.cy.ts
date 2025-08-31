describe('HouseholdSettings - TC-FE-2.3', () => {
  beforeEach(() => {
    // Set up authentication with different roles for testing
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'mock-token');
    });
  });

  it('should display household settings page with member list and conditionally show invite button based on role', () => {
    // Test as ADMIN user
    cy.window().then((win) => {
      const adminAuthData = {
        user: {
          id: 'user-1',
          email: 'admin@example.com',
          displayName: 'Admin User',
          activeHouseholdId: 'household-1'
        },
        households: [{
          id: 'household-1',
          name: 'Smith Family',
          role: 'admin',
          memberCount: 4
        }],
        currentHouseholdId: 'household-1'
      };
      win.localStorage.setItem('auth-storage', JSON.stringify({ state: adminAuthData }));
    });

    // Visit the household settings page
    cy.visit('/settings/households');
    
    // Verify page loads with household name
    cy.contains('h1', 'Household Settings').should('be.visible');
    cy.contains('Smith Family').should('be.visible');
    
    // Verify members list is displayed
    cy.get('[data-testid="members-list"]').should('be.visible');
    cy.get('[data-testid="members-list"]').within(() => {
      // Check that multiple members are displayed
      cy.get('[data-testid^="member-"]').should('have.length.at.least', 2);
    });
    
    // ADMIN: Verify Invite Member button is visible
    cy.get('[data-testid="invite-member-button"]').should('be.visible');
    
    // Click the invite button to open modal
    cy.get('[data-testid="invite-member-button"]').click();
    
    // Verify invite modal opens
    cy.get('[data-testid="invite-member-modal"]').should('be.visible');
    cy.get('[data-testid="invite-member-modal"]').within(() => {
      cy.contains('Invite New Member').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('select').should('be.visible');
      cy.contains('button', 'Send Invitation').should('be.visible');
    });
    
    // Close the modal
    cy.contains('button', 'Cancel').click();
    cy.get('[data-testid="invite-member-modal"]').should('not.exist');
    
    // Now test as MEMBER user
    cy.window().then((win) => {
      const memberAuthData = {
        user: {
          id: 'user-2',
          email: 'member@example.com',
          displayName: 'Member User',
          activeHouseholdId: 'household-1'
        },
        households: [{
          id: 'household-1',
          name: 'Smith Family',
          role: 'member',
          memberCount: 4
        }],
        currentHouseholdId: 'household-1'
      };
      win.localStorage.setItem('auth-storage', JSON.stringify({ state: memberAuthData }));
    });
    
    // Reload the page with member role
    cy.reload();
    
    // Verify page still loads
    cy.contains('h1', 'Household Settings').should('be.visible');
    
    // MEMBER: Verify Invite Member button is NOT visible
    cy.get('[data-testid="invite-member-button"]').should('not.exist');
    
    // Verify member list is still visible
    cy.get('[data-testid="members-list"]').should('be.visible');
    
    // Verify household information section
    cy.contains('Household Information').should('be.visible');
    cy.contains('Your Role').should('be.visible');
    cy.contains('member').should('be.visible');
    
    // Verify Danger Zone is NOT visible for members
    cy.contains('Danger Zone').should('not.exist');
  });
});