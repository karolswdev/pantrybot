# Test Method for Task 2

## TC-FE-5.3: Should check off an item when a WebSocket event is received

```typescript
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
```