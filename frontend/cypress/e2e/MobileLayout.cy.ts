describe('Mobile Layout', () => {
  beforeEach(() => {
    // Skip auth for testing
    cy.window().then((win) => {
      (win as Window & { Cypress?: boolean }).Cypress = true;
    });
  });

  it('should display the bottom tab bar on a mobile viewport and hide the sidebar', () => {
    // Arrange: Set the Cypress viewport to a mobile size
    cy.viewport('iphone-x');
    
    // Act: Navigate to the dashboard
    cy.visit('/dashboard');
    
    // Assert: Verify the main sidebar navigation is not visible
    cy.get('aside').should('not.be.visible');
    
    // Assert: Verify the mobile bottom tab bar is visible
    cy.get('nav[class*="fixed bottom-0"]').should('be.visible');
    
    // Verify all 5 tabs are present
    cy.get('nav[class*="fixed bottom-0"] a, nav[class*="fixed bottom-0"] button').should('have.length', 5);
    
    // Verify tab labels
    cy.get('nav[class*="fixed bottom-0"]').within(() => {
      cy.contains('Home').should('be.visible');
      cy.contains('Inventory').should('be.visible');
      cy.contains('Shopping').should('be.visible');
      cy.contains('Settings').should('be.visible');
    });
    
    // Verify the Add button is styled differently (has rounded background)
    cy.get('nav[class*="fixed bottom-0"] button[aria-label="Add"]')
      .find('div[class*="rounded-full"]')
      .should('have.class', 'bg-primary-500');
  });

  it('should hide the bottom tab bar on desktop viewport', () => {
    // Arrange: Set viewport to desktop size
    cy.viewport(1280, 720);
    
    // Act: Navigate to the dashboard
    cy.visit('/dashboard');
    
    // Assert: Verify the sidebar is visible on desktop
    cy.get('aside').should('be.visible');
    
    // Assert: Verify the mobile bottom tab bar is hidden on desktop
    cy.get('nav[class*="fixed bottom-0"]').should('not.be.visible');
  });

  it('should navigate between pages using mobile tab bar', () => {
    // Arrange: Set mobile viewport
    cy.viewport('iphone-x');
    cy.visit('/dashboard');
    
    // Act & Assert: Verify that navigation links have correct hrefs
    cy.get('nav[class*="fixed bottom-0"]').within(() => {
      // Find links by their text content and verify href attributes
      cy.get('a').contains('Home').parent('a').should('have.attr', 'href', '/dashboard');
      cy.get('a').contains('Inventory').parent('a').should('have.attr', 'href', '/inventory/fridge');
      cy.get('a').contains('Shopping').parent('a').should('have.attr', 'href', '/shopping');
      cy.get('a').contains('Settings').parent('a').should('have.attr', 'href', '/settings');
      
      // Verify the active state for current page (Dashboard/Home)
      cy.get('a[href="/dashboard"]').should('have.class', 'text-primary-600');
    });
  });

  it('should have proper spacing for content with bottom tab bar', () => {
    // Arrange: Set mobile viewport
    cy.viewport('iphone-x');
    cy.visit('/dashboard');
    
    // Assert: Main content should have bottom padding to avoid overlap with tab bar
    cy.get('main').should('have.css', 'padding-bottom');
    cy.get('main').then(($main) => {
      const paddingBottom = parseInt($main.css('padding-bottom'));
      expect(paddingBottom).to.be.at.least(64); // At least 4rem (16px * 4)
    });
  });
});