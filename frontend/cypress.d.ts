/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to select DOM element by data-cy attribute.
     * @example cy.dataCy('greeting')
     */
    dataCy(value: string): Chainable<Element>
  }
}

// Extend Window interface for Cypress flag and SignalR service
interface Window {
  Cypress?: boolean | typeof Cypress;
  signalRService?: {
    emit: (event: string, data: Record<string, unknown>) => void;
    on: (event: string, handler: (data: unknown) => void) => void;
    off: (event: string, handler: (data: unknown) => void) => void;
    connect: (token: string, householdId: string) => Promise<void>;
    isConnected: () => boolean;
  };
}