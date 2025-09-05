describe('HouseholdSettings - TC-FE-2.3', () => {
  beforeEach(() => {
    // Register and login a test user with proper backend data
    const uniqueEmail = `household-test-${Date.now()}@example.com`;
    
    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: uniqueEmail,
      password: 'Password123',
      displayName: 'Admin User'
    }).then((response) => {
      const { accessToken, refreshToken, userId, defaultHouseholdId } = response.body;
      
      // Set up authentication
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString());
      });
    });
  });

  it('should display household settings page with member list and conditionally show invite button based on role', () => {
    // Register an admin user and set up their auth state
    const adminEmail = `admin-${Date.now()}@example.com`;
    
    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: adminEmail,
      password: 'Password123',
      displayName: 'Admin User'
    }).then((response) => {
      const { accessToken, refreshToken, userId, defaultHouseholdId } = response.body;
      
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString());
        
        const adminAuthData = {
          state: {
            user: {
              id: userId,
              email: adminEmail,
              displayName: 'Admin User',
              activeHouseholdId: defaultHouseholdId,
              defaultHouseholdId: defaultHouseholdId
            },
            households: [{
              id: defaultHouseholdId,
              name: "Admin User's Home",
              role: 'admin',
              memberCount: 1
            }],
            currentHouseholdId: defaultHouseholdId,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            token: accessToken,
            refreshToken: refreshToken
          },
          version: 0
        };
        win.localStorage.setItem('auth-storage', JSON.stringify(adminAuthData));
      });
    });

    // Visit the household settings page
    cy.visit('/settings/households');
    
    // Verify page loads with household name
    cy.contains('h1', 'Household Settings').should('be.visible');
    // The household name will be "Admin User's Home" from registration
    cy.contains("Admin User's Home").should('be.visible');
    
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
    
    // Now test as MEMBER user - register a new user
    const memberEmail = `member-${Date.now()}@example.com`;
    
    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: memberEmail,
      password: 'Password123',
      displayName: 'Member User'
    }).then((response) => {
      const { accessToken, refreshToken, userId, defaultHouseholdId } = response.body;
      
      cy.window().then((win) => {
        win.localStorage.setItem('access_token', accessToken);
        win.localStorage.setItem('refresh_token', refreshToken);
        
        const memberAuthData = {
          state: {
            user: {
              id: userId,
              email: memberEmail,
              displayName: 'Member User',
              activeHouseholdId: defaultHouseholdId
            },
            households: [{
              id: defaultHouseholdId,
              name: "Member User's Home",
              role: 'member',
              memberCount: 1
            }],
            currentHouseholdId: defaultHouseholdId,
            isAuthenticated: true,
            token: accessToken,
            refreshToken: refreshToken
          },
          version: 0
        };
        win.localStorage.setItem('auth-storage', JSON.stringify(memberAuthData));
      });
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