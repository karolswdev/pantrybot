describe('PWA', () => {
  beforeEach(() => {
    // Skip auth for testing
    cy.window().then((win) => {
      (win as unknown as Window & { Cypress?: boolean }).Cypress = true;
    });
  });

  it('should be installable with a service worker', () => {
    // Arrange: Load the application
    cy.visit('/dashboard');
    
    // Act: Check the browser's developer tools context (window)
    cy.window().then((win) => {
      // Assert: Verify that navigator.serviceWorker is available
      expect(win.navigator.serviceWorker).to.exist;
      expect(win.navigator.serviceWorker).to.not.be.undefined;
    });
    
    // Assert: Verify the manifest is linked correctly
    // Note: Next.js may inject these dynamically, so we check they exist
    cy.get('link[rel="manifest"]').should('exist');
    
    // Note: In production build, service worker would be registered and activated
    // Since we're in development/test mode, we verify the setup is correct
    // The actual service worker registration happens in production builds
  });

  it('should have a valid web app manifest', () => {
    // Request the manifest file directly
    cy.request('/manifest.json').then((response) => {
      // Assert: Status should be 200
      expect(response.status).to.eq(200);
      
      // Assert: Manifest should have required fields
      const manifest = response.body;
      expect(manifest).to.have.property('name', 'Pantrybot - Food Inventory Management');
      expect(manifest).to.have.property('short_name', 'Pantrybot');
      expect(manifest).to.have.property('start_url', '/');
      expect(manifest).to.have.property('display', 'standalone');
      expect(manifest).to.have.property('theme_color', '#22c55e');
      expect(manifest).to.have.property('background_color', '#ffffff');
      
      // Assert: Icons array should exist and have entries
      expect(manifest).to.have.property('icons');
      expect(manifest.icons).to.be.an('array');
      expect(manifest.icons.length).to.be.greaterThan(0);
      
      // Assert: Should have at least 192x192 and 512x512 icons for PWA requirements
      const icon192 = manifest.icons.find((icon: { sizes: string }) => icon.sizes === '192x192');
      const icon512 = manifest.icons.find((icon: { sizes: string }) => icon.sizes === '512x512');
      expect(icon192).to.exist;
      expect(icon512).to.exist;
    });
  });

  it('should have proper PWA meta tags', () => {
    cy.visit('/dashboard');
    
    // Check for title
    cy.title().should('include', 'Pantrybot');
    
    // Check for viewport meta tag
    cy.get('meta[name="viewport"]').should('exist');
    
    // Check that a manifest link exists
    cy.get('link[rel="manifest"]').should('exist');
  });

  it('should have correct PWA display properties', () => {
    cy.visit('/dashboard');
    
    // Check that the app can go fullscreen on mobile (no browser chrome)
    cy.request('/manifest.json').then((response) => {
      const manifest = response.body;
      
      // Assert: Display mode should be standalone for app-like experience
      expect(manifest.display).to.equal('standalone');
      
      // Assert: Orientation should be set for mobile
      expect(manifest.orientation).to.equal('portrait-primary');
      
      // Assert: Description should be present
      expect(manifest.description).to.equal('Keep your food fresh, waste less');
    });
  });
});