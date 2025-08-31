describe('Project Setup', () => {
  it('should have correct PWA manifest properties', () => {
    // Visit the application root
    cy.visit('/')
    
    // Find the manifest link in the head
    cy.document().then((doc) => {
      const manifestLink = doc.querySelector('link[rel="manifest"]')
      expect(manifestLink).to.exist
      
      const manifestUrl = manifestLink?.getAttribute('href')
      expect(manifestUrl).to.equal('/manifest.json')
      
      // Fetch and verify the manifest file
      cy.request('/manifest.json').then((response) => {
        expect(response.status).to.equal(200)
        expect(response.body).to.have.property('name', 'Fridgr - Food Inventory Management')
        expect(response.body).to.have.property('short_name', 'Fridgr')
        expect(response.body).to.have.property('start_url', '/')
        expect(response.body).to.have.property('display', 'standalone')
        expect(response.body).to.have.property('background_color', '#ffffff')
        expect(response.body).to.have.property('theme_color', '#22c55e')
        expect(response.body).to.have.property('orientation', 'portrait-primary')
        expect(response.body.icons).to.be.an('array')
        expect(response.body.icons).to.have.length.at.least(1)
      })
    })
  })
})