describe('Authentication', () => {
  beforeEach(() => {
    // Clear any authentication tokens before each test
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  it('should redirect unauthenticated users from protected routes to /login', () => {
    // Ensure no auth tokens are in local storage
    cy.window().then((win) => {
      expect(win.localStorage.getItem('accessToken')).to.be.null
      expect(win.localStorage.getItem('refreshToken')).to.be.null
    })

    // Attempt to navigate directly to a protected route
    cy.visit('/dashboard', { failOnStatusCode: false })
    
    // Assert that the current route is now /login
    cy.url().should('include', '/login')
    cy.location('pathname').should('eq', '/login')
  })

  it('should allow access to public routes without authentication', () => {
    // Test accessing the home page
    cy.visit('/')
    cy.url().should('include', '/')
    cy.location('pathname').should('eq', '/')
    
    // Test accessing the login page
    cy.visit('/login')
    cy.url().should('include', '/login')
    cy.location('pathname').should('eq', '/login')
    
    // Test accessing the signup page
    cy.visit('/signup')
    cy.url().should('include', '/signup')
    cy.location('pathname').should('eq', '/signup')
  })

  it('should protect multiple routes', () => {
    const protectedRoutes = [
      '/dashboard',
      '/inventory/fridge',
      '/inventory/freezer',
      '/inventory/pantry',
      '/shopping',
      '/reports',
      '/settings'
    ]

    protectedRoutes.forEach(route => {
      cy.visit(route, { failOnStatusCode: false })
      cy.url().should('include', '/login')
    })
  })
})