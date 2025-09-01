describe('Shopping List Detail', () => {
  beforeEach(() => {
    // Set up authentication
    window.localStorage.setItem('accessToken', 'test-token');
    window.localStorage.setItem('refreshToken', 'test-refresh-token');
    window.localStorage.setItem('householdStore', JSON.stringify({
      state: {
        activeHouseholdId: 'household-123',
        households: [{ id: 'household-123', name: 'Test Household', role: 'admin' }]
      }
    }));
  });

  // TC-FE-5.4: Should add an item to the list
  it('should add an item to the list', () => {
    // Navigate to shopping list detail page
    cy.visit('/shopping/list-1');
    
    // Wait for page to load
    cy.contains('Weekly Groceries').should('be.visible');
    
    // Verify initial items are shown (from mock data)
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Bread');
    
    // Use the "Add item" input field
    cy.get('[data-testid="add-item-input"]').type('Bananas');
    cy.get('[data-testid="add-item-button"]').click();
    
    // Since we're using mock data that generates items with timestamp IDs,
    // we just need to verify the item appears
    cy.get('[data-testid="to-buy-section"]').within(() => {
      cy.contains('Bananas').should('exist');
    });
  });

  // TC-FE-5.5: Should check and uncheck an item
  it('should check and uncheck an item', () => {
    // Navigate to shopping list detail page
    cy.visit('/shopping/list-1');
    
    // Wait for page to load and verify initial state
    cy.contains('Weekly Groceries').should('be.visible');
    
    // Verify initial state: Milk in "To Buy", Apples in "Bought"
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
    cy.get('[data-testid="bought-section"]').should('contain', 'Apples');
    
    // Click the checkbox for Milk (id=1) in "To Buy" section
    cy.get('[data-testid="to-buy-section"]')
      .find('[data-testid="checkbox-1"]')
      .click();
    
    // Wait for the optimistic update to complete
    cy.wait(500);
    
    // Verify Milk moved to "Bought" section using flexible assertion
    cy.get('[data-testid="bought-section"]', { timeout: 5000 }).should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('not.contain', 'Milk');
    
    // Click the checkbox for Milk in the "Bought" section to uncheck it
    cy.get('[data-testid="bought-section"]')
      .find('[data-testid="checkbox-1"]')
      .click();
    
    // Wait for the optimistic update to complete
    cy.wait(500);
    
    // Verify Milk moved back to "To Buy"
    cy.get('[data-testid="to-buy-section"]', { timeout: 5000 }).should('contain', 'Milk');
    cy.get('[data-testid="bought-section"]').should('not.contain', 'Milk');
  });

  // TC-FE-5.3: Should check off an item when a WebSocket event is received
  it('should check off an item when a WebSocket event is received', () => {
    // Navigate to shopping list detail page
    cy.visit('/shopping/list-1');
    
    // Wait for page to load and verify initial state
    cy.contains('Weekly Groceries').should('be.visible');
    
    // Verify Milk is initially in "To Buy" section (unchecked)
    cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
    cy.get('[data-testid="bought-section"]').should('not.contain', 'Milk');
    
    // Simulate the server pushing a 'shoppinglist.item.updated' event
    // Access the signalRService exposed to window for testing
    cy.window().then((win) => {
      // Simulate a WebSocket event for item being marked as complete
      const mockEvent = {
        type: 'shoppinglist.item.updated',
        householdId: 'household-123',
        shoppingListId: 'list-1',
        payload: {
          itemId: '1',
          item: {
            id: '1',
            shoppingListId: 'list-1',
            name: 'Milk',
            quantity: 1,
            unit: 'gal',
            category: 'Dairy',
            isCompleted: true,
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        }
      };
      
      // Emit the event through the SignalR service
      if ((win as any).signalRService) {
        (win as any).signalRService.emit('shoppinglist.item.updated', mockEvent);
      }
    });
    
    // Wait for the UI to update
    cy.wait(500);
    
    // Verify the item moves to the "Bought" section without a page refresh
    cy.get('[data-testid="bought-section"]').should('contain', 'Milk');
    cy.get('[data-testid="to-buy-section"]').should('not.contain', 'Milk');
  });
});