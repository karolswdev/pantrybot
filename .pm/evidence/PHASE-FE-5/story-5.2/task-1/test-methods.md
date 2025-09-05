# Test Methods for Task 1

## TC-FE-5.4: Should add an item to the list

```typescript
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
```

## TC-FE-5.5: Should check and uncheck an item

```typescript
// TC-FE-5.5: Should check and uncheck an item
it('should check and uncheck an item', () => {
  // Navigate to shopping list detail page
  cy.visit('/shopping/list-1');
  
  // Wait for page to load and verify initial state
  cy.contains('Weekly Groceries').should('be.visible');
  
  // Verify initial state: Milk in "To Buy", Apples in "Bought"
  cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
  cy.get('[data-testid="bought-section"]').should('contain', 'Apples');
  
  // Click the checkbox for the first item in "To Buy" (Milk)
  cy.get('[data-testid="checkbox-1"]').first().click();
  
  // Give time for optimistic update
  cy.wait(1000);
  
  // Verify Milk moved to "Bought" section
  cy.get('[data-testid="bought-section"]').should('contain', 'Milk');
  cy.get('[data-testid="to-buy-section"]').should('not.contain', 'Milk');
  
  // Click the checkbox for Milk in the "Bought" section to uncheck it
  // Since Milk is now in bought section, find its checkbox there
  cy.get('[data-testid="bought-section"]')
    .contains('Milk')
    .closest('[data-testid^="item-"]')
    .find('[data-testid="checkbox-1"]')
    .click();
  
  // Give time for optimistic update
  cy.wait(1000);
  
  // Verify Milk moved back to "To Buy"
  cy.get('[data-testid="to-buy-section"]').should('contain', 'Milk');
  cy.get('[data-testid="bought-section"]').should('not.contain', 'Milk');
});
```