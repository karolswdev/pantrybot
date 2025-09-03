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

      /**
       * Custom command to login via API
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>
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

// Login via API
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request('POST', 'http://localhost:8080/api/v1/auth/login', {
    email,
    password
  }).then((response) => {
    expect(response.status).to.eq(200)
    const { accessToken, refreshToken, userId, households } = response.body
    
    // Get the first household ID from the user's households
    const firstHouseholdId = households && households.length > 0 ? households[0].id : 'household-123'
    
    // Set tokens in localStorage
    window.localStorage.setItem('access_token', accessToken)
    window.localStorage.setItem('refresh_token', refreshToken)
    window.localStorage.setItem('token_expiry', (Date.now() + 900000).toString())
    
    // Set auth store data  
    const authState = {
      state: {
        isAuthenticated: true,
        user: {
          id: userId || 'user-123',
          email: email,
          displayName: response.body.displayName || 'Test User',
          defaultHouseholdId: firstHouseholdId
        },
        households: households || [],
        currentHouseholdId: firstHouseholdId,
        tokens: {
          accessToken: accessToken,
          refreshToken: refreshToken
        }
      },
      version: 0
    }
    window.localStorage.setItem('auth-storage', JSON.stringify(authState))
  })
})

export {}