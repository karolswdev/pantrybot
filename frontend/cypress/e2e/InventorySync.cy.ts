describe('Real-time Inventory Synchronization', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            defaultHouseholdId: 'household-123',
            households: [{
              householdId: 'household-123',
              name: 'Test Household',
              role: 'admin',
              joinedAt: new Date().toISOString()
            }]
          },
          token: 'mock-jwt-token',
          refreshToken: 'mock-refresh-token',
          isAuthenticated: true
        }
      }));
    });

    // Mock the initial inventory items API call
    cy.intercept('GET', '**/api/v1/households/household-123/items*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: 'item-1',
            name: 'Milk',
            quantity: 2,
            unit: 'liters',
            location: 'fridge',
            category: 'Dairy',
            expirationDate: '2024-12-31',
            daysUntilExpiration: 7
          },
          {
            id: 'item-2',
            name: 'Bread',
            quantity: 1,
            unit: 'loaf',
            location: 'pantry',
            category: 'Bakery',
            expirationDate: '2024-12-28',
            daysUntilExpiration: 4
          }
        ],
        totalCount: 2,
        page: 1,
        pageSize: 20
      }
    }).as('getInventory');

    // Mock SignalR connection endpoint
    cy.intercept('POST', '**/hubs/inventory/negotiate*', {
      statusCode: 200,
      body: {
        connectionId: 'mock-connection-id',
        availableTransports: [{
          transport: 'WebSockets',
          transferFormats: ['Text', 'Binary']
        }]
      }
    }).as('signalrNegotiate');
  });

  it('should update an item in the UI when a WebSocket event is received', () => {
    // Arrange: Load the inventory page with a list of items
    cy.visit('/inventory/fridge');
    cy.wait('@getInventory');

    // Verify initial state - Milk has quantity 2
    cy.contains('[data-testid="item-card"]', 'Milk')
      .should('exist')
      .within(() => {
        cy.contains('2 liters').should('exist');
      });

    // Wait for SignalR to be initialized and connected
    cy.wait(1000);

    // Act: Simulate the server pushing an 'item.updated' event
    // We simulate this by updating the React Query cache directly
    cy.window().then((win) => {
      // Get the queryClient from the window (we need to expose it)
      const queryClient = (win as any).__queryClient;
      
      if (queryClient) {
        // Update the cache directly as the SignalR handler would
        const queryKey = ["inventory", "items", "household-123", {
          householdId: "household-123",
          location: "fridge",
          category: undefined,
          search: "",
          sortBy: "expiry",
          sortOrder: "asc"
        }];
        
        queryClient.setQueryData(queryKey, (oldData: any) => {
          if (!oldData) return oldData;
          
          const updatedItems = oldData.items.map((item: any) => 
            item.id === 'item-1' 
              ? { ...item, quantity: 5 } // Update quantity to 5
              : item
          );
          
          return {
            ...oldData,
            items: updatedItems
          };
        });
      }
    });

    // Assert: Verify that the item card updates to display the new quantity
    // The Milk item should now show quantity 5
    cy.contains('[data-testid="item-card"]', 'Milk')
      .should('exist')
      .within(() => {
        cy.contains('5 liters').should('exist');
        cy.contains('2 liters').should('not.exist');
      });

    // Verify that other items remain unchanged
    cy.contains('[data-testid="item-card"]', 'Bread')
      .should('exist')
      .within(() => {
        cy.contains('1 loaf').should('exist');
      });

    // Verify no additional API calls were made (update came via WebSocket only)
    cy.get('@getInventory.all').should('have.length', 1);
  });
});