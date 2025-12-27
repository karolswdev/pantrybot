/**
 * E2E tests for Voice Input feature
 *
 * Note: Since Web Speech API isn't available in Cypress's browser,
 * we mock SpeechRecognition to test the UI behavior and integration.
 */
describe('Voice Input E2E Tests', () => {
  interface AuthData {
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
    displayName: string;
    defaultHouseholdId: string;
  }

  let authData: AuthData;
  let householdId: string;

  // Mock SpeechRecognition for browser testing
  const mockSpeechRecognition = () => {
    cy.window().then((win) => {
      class MockSpeechRecognition {
        continuous = false;
        interimResults = false;
        lang = 'en-US';
        onstart: ((ev: Event) => void) | null = null;
        onresult: ((ev: unknown) => void) | null = null;
        onerror: ((ev: unknown) => void) | null = null;
        onend: ((ev: Event) => void) | null = null;

        start() {
          if (this.onstart) {
            this.onstart(new Event('start'));
          }
        }

        stop() {
          if (this.onend) {
            this.onend(new Event('end'));
          }
        }

        abort() {
          if (this.onend) {
            this.onend(new Event('end'));
          }
        }
      }

      // @ts-expect-error - Adding mock to window
      win.SpeechRecognition = MockSpeechRecognition;
      // @ts-expect-error - Adding mock to window
      win.webkitSpeechRecognition = MockSpeechRecognition;
    });
  };

  beforeEach(() => {
    cy.clearLocalStorage();

    // Register a test user
    const uniqueEmail = `voice-test-${Date.now()}@example.com`;

    cy.request('POST', 'http://localhost:8080/api/v1/auth/register', {
      email: uniqueEmail,
      password: 'password123',
      displayName: 'Voice Test User'
    }).then((response) => {
      authData = response.body as AuthData;
      householdId = authData.defaultHouseholdId;

      cy.window().then((win) => {
        win.localStorage.setItem('access_token', authData.accessToken);
        win.localStorage.setItem('refresh_token', authData.refreshToken);
        win.localStorage.setItem('token_expiry', (Date.now() + 900000).toString());

        const authState = {
          state: {
            user: {
              id: authData.userId,
              email: uniqueEmail,
              displayName: 'Voice Test User',
              activeHouseholdId: householdId,
              defaultHouseholdId: householdId
            },
            households: [{
              id: householdId,
              name: "Voice Test User's Home",
              role: 'admin'
            }],
            currentHouseholdId: householdId,
            isAuthenticated: true,
            isLoading: false,
            error: null
          },
          version: 0
        };
        win.localStorage.setItem('auth-storage', JSON.stringify(authState));
      });
    });
  });

  describe('Voice Button Visibility', () => {
    it('should show voice input button when LLM is configured', () => {
      // Mock LLM status as available
      cy.intercept('GET', '**/api/v1/llm/status', {
        statusCode: 200,
        body: { available: true, provider: 'ollama' }
      }).as('llmStatus');

      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // The chat input with voice button should be visible
      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 }).should('exist');
    });

    it('should hide chat input when LLM is not configured', () => {
      cy.intercept('GET', '**/api/v1/llm/status', {
        statusCode: 200,
        body: { available: false }
      }).as('llmStatus');

      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Chat input should not be visible
      cy.get('[data-testid="voice-input-button"]').should('not.exist');
    });
  });

  describe('Voice Button Interaction', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/llm/status', {
        statusCode: 200,
        body: { available: true, provider: 'ollama' }
      }).as('llmStatus');
    });

    it('should show microphone icon in idle state', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 })
        .should('exist')
        .find('svg')
        .should('exist');
    });

    it('should change appearance when recording starts', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Click the voice button to start recording
      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 }).click();

      // Button should show recording state (red background)
      cy.get('[data-testid="voice-input-button"]')
        .should('have.class', 'bg-danger-500');
    });

    it('should show recording indicator when recording', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Click to start recording
      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 }).click();

      // Recording indicator should appear
      cy.get('[data-testid="voice-recording-indicator"]', { timeout: 5000 })
        .should('exist')
        .and('contain.text', 'Listening');
    });

    it('should stop recording on second click', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Start recording
      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 }).click();
      cy.get('[data-testid="voice-recording-indicator"]').should('exist');

      // Stop recording
      cy.get('[data-testid="voice-input-button"]').click();

      // Recording indicator should disappear
      cy.get('[data-testid="voice-recording-indicator"]').should('not.exist');
    });
  });

  describe('Voice Input with Text Input Integration', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/llm/status', {
        statusCode: 200,
        body: { available: true, provider: 'ollama' }
      }).as('llmStatus');
    });

    it('should have both voice and text input available', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Voice button should exist
      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 }).should('exist');

      // Text input should exist
      cy.get('input[placeholder*="groceries"]').should('exist');

      // Send button should exist
      cy.get('button').contains('svg').should('exist');
    });

    it('should allow text input while voice is not recording', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      cy.get('input[placeholder*="groceries"]', { timeout: 10000 })
        .type('I bought some milk')
        .should('have.value', 'I bought some milk');
    });

    it('should show suggestions when input is focused and empty', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Focus on the input
      cy.get('input[placeholder*="groceries"]', { timeout: 10000 }).focus();

      // Wait for suggestions to appear
      cy.contains('Try saying...', { timeout: 5000 }).should('be.visible');
      cy.contains('I bought milk and eggs').should('be.visible');
    });

    it('should hide suggestions when recording starts', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Focus to show suggestions
      cy.get('input[placeholder*="groceries"]', { timeout: 10000 }).focus();
      cy.contains('Try saying...', { timeout: 5000 }).should('be.visible');

      // Start recording
      cy.get('[data-testid="voice-input-button"]').click();

      // Suggestions should be hidden, recording indicator shown
      cy.contains('Try saying...').should('not.exist');
      cy.get('[data-testid="voice-recording-indicator"]').should('exist');
    });
  });

  describe('Voice Input Error Handling', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/llm/status', {
        statusCode: 200,
        body: { available: true, provider: 'ollama' }
      }).as('llmStatus');
    });

    it('should show error tooltip when speech recognition is not supported', () => {
      // Don't mock SpeechRecognition to simulate unsupported browser
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Click voice button
      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 }).click();

      // Should show error tooltip about not supported
      cy.get('[data-testid="voice-error-tooltip"]', { timeout: 5000 })
        .should('exist')
        .and('contain.text', 'not supported');
    });

    it('should dismiss error tooltip after delay', () => {
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 }).click();

      // Error tooltip appears
      cy.get('[data-testid="voice-error-tooltip"]').should('exist');

      // Wait for auto-dismiss (3 seconds)
      cy.wait(3500);
      cy.get('[data-testid="voice-error-tooltip"]').should('not.exist');
    });
  });

  describe('Voice Input Submit Flow', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/llm/status', {
        statusCode: 200,
        body: { available: true, provider: 'ollama' }
      }).as('llmStatus');

      // Mock LLM process endpoint
      cy.intercept('POST', '**/api/v1/llm/process', {
        statusCode: 200,
        body: {
          intent: {
            action: 'add',
            response: 'Added milk to your inventory!'
          },
          executed: true,
          result: {
            itemsProcessed: 1,
            errors: []
          }
        }
      }).as('llmProcess');
    });

    it('should submit text message and show response', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Type a message
      cy.get('input[placeholder*="groceries"]', { timeout: 10000 })
        .type('I bought milk{enter}');

      // Wait for the process request
      cy.wait('@llmProcess');

      // Response bubble should appear
      cy.contains('Added milk to your inventory!', { timeout: 5000 }).should('be.visible');
    });

    it('should show success response bubble with checkmark', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      cy.get('input[placeholder*="groceries"]', { timeout: 10000 })
        .type('I bought eggs{enter}');

      cy.wait('@llmProcess');

      // Success bubble should have green styling
      cy.get('.bg-primary-50').should('exist');
    });

    it('should auto-dismiss response after timeout', () => {
      mockSpeechRecognition();
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      cy.get('input[placeholder*="groceries"]', { timeout: 10000 })
        .type('I bought cheese{enter}');

      cy.wait('@llmProcess');

      // Response should be visible
      cy.contains('Added milk to your inventory!').should('be.visible');

      // Wait for auto-dismiss (5 seconds)
      cy.wait(5500);
      cy.contains('Added milk to your inventory!').should('not.exist');
    });
  });

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      cy.intercept('GET', '**/api/v1/llm/status', {
        statusCode: 200,
        body: { available: true, provider: 'ollama' }
      }).as('llmStatus');
    });

    it('should display voice input properly on mobile viewport', () => {
      mockSpeechRecognition();
      cy.viewport('iphone-x');
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Chat input should be at bottom
      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 })
        .should('exist')
        .and('be.visible');

      // Input should be visible and functional
      cy.get('input[placeholder*="groceries"]')
        .should('exist')
        .and('be.visible');
    });

    it('should handle touch interactions for voice button', () => {
      mockSpeechRecognition();
      cy.viewport('iphone-x');
      cy.visit('http://localhost:3003/dashboard');
      cy.wait('@llmStatus');

      // Touch/click should start recording
      cy.get('[data-testid="voice-input-button"]', { timeout: 10000 })
        .trigger('touchstart')
        .trigger('touchend');

      // Check for recording state or indicator
      cy.get('[data-testid="voice-input-button"]')
        .should('have.class', 'bg-danger-500');
    });
  });
});
