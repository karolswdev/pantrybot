/// <reference types="cypress" />

// Custom commands for Cypress tests

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to mock authentication state
       * @example cy.mockAuth()
       */
      mockAuth(): Chainable<void>
      
      /**
       * Custom command to reset mock backend state
       * @example cy.resetBackendState()
       */
      resetBackendState(): Chainable<void>
    }
  }
}

// Mock authentication for tests
Cypress.Commands.add('mockAuth', () => {
  // Set tokens with correct keys
  window.localStorage.setItem('access_token', 'mock-access-token')
  window.localStorage.setItem('refresh_token', 'mock-refresh-token')
  window.localStorage.setItem('token_expiry', (Date.now() + 900000).toString()) // 15 minutes from now
  
  // Set auth store data
  const authState = {
    state: {
      isAuthenticated: true,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        defaultHouseholdId: 'household-123'
      },
      tokens: {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      }
    },
    version: 0
  }
  window.localStorage.setItem('auth-storage', JSON.stringify(authState))
})

// Reset mock backend state
Cypress.Commands.add('resetBackendState', () => {
  cy.request('POST', 'http://localhost:8080/debug/reset-state').then((response) => {
    expect(response.status).to.eq(200)
  })
})

export {}