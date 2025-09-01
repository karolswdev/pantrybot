describe('Inventory Filtering and Search', () => {
  beforeEach(() => {
    // Mock auth state for testing
    cy.window().then((win) => {
      (win as Window & { Cypress?: boolean }).Cypress = true;
    });
    
    // Visit an inventory page
    cy.visit('/inventory/fridge');
  });

  it('should re-fetch the item list with a search query parameter', () => {
    // Intercept initial load without query
    cy.intercept('GET', '/api/v1/households/household-123/items?*', (req) => {
      if (!req.url.includes('search=')) {
        req.reply({
          statusCode: 200,
          body: {
            items: [
              {
                id: '1',
                name: 'Organic Whole Milk',
                quantity: 1,
                unit: 'gallon',
                location: 'fridge',
                category: 'Dairy',
                expirationDate: new Date().toISOString()
              },
              {
                id: '2',
                name: 'Fresh Salad',
                quantity: 1,
                unit: 'bag',
                location: 'fridge',
                category: 'Produce',
                expirationDate: new Date(Date.now() + 86400000).toISOString()
              },
              {
                id: '3',
                name: 'Cheddar Cheese',
                quantity: 200,
                unit: 'g',
                location: 'fridge',
                category: 'Dairy',
                expirationDate: new Date(Date.now() + 5 * 86400000).toISOString()
              }
            ],
            totalCount: 3,
            page: 1,
            pageSize: 20
          }
        });
      }
    }).as('getItems');

    // Intercept the search query
    cy.intercept('GET', '/api/v1/households/household-123/items?*search=Milk*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: '1',
            name: 'Organic Whole Milk',
            quantity: 1,
            unit: 'gallon',
            location: 'fridge',
            category: 'Dairy',
            expirationDate: new Date().toISOString()
          }
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20
      }
    }).as('searchItems');

    // Wait for initial load
    cy.wait('@getItems');

    // Verify initial items are visible
    cy.contains('Organic Whole Milk').should('be.visible');
    cy.contains('Fresh Salad').should('be.visible');
    cy.contains('Cheddar Cheese').should('be.visible');

    // Type in the search input
    cy.get('[data-testid="inventory-search-input"]').type('Milk');

    // Wait for the debounced search request (300ms debounce + buffer)
    cy.wait(500);
    
    // Verify the API was called with the correct search parameter
    cy.wait('@searchItems').then((interception) => {
      expect(interception.request.url).to.include('search=Milk');
    });

    // Verify that only the Milk item is now visible
    cy.contains('Organic Whole Milk').should('be.visible');
    cy.contains('Fresh Salad').should('not.exist');
    cy.contains('Cheddar Cheese').should('not.exist');
  });

  it('should filter items by location', () => {
    // Stay on the fridge page for this test
    // The test will use the "All" filter first, then switch to "Freezer"
    // Intercept the initial API call
    cy.intercept('GET', '/api/v1/households/household-123/items?*', (req) => {
      if (!req.url.includes('location=freezer')) {
        req.reply({
          statusCode: 200,
          body: {
            items: [
              {
                id: '1',
                name: 'Milk',
                quantity: 1,
                unit: 'gallon',
                location: 'fridge',
                category: 'Dairy',
                expirationDate: new Date().toISOString()
              },
              {
                id: '2',
                name: 'Ice Cream',
                quantity: 1,
                unit: 'pint',
                location: 'freezer',
                category: 'Desserts',
                expirationDate: new Date(Date.now() + 30 * 86400000).toISOString()
              }
            ],
            totalCount: 2,
            page: 1,
            pageSize: 20
          }
        });
      }
    }).as('getInitialItems');

    // Intercept the filtered API call with location=freezer
    cy.intercept('GET', '/api/v1/households/household-123/items?*location=freezer*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: '2',
            name: 'Ice Cream',
            quantity: 1,
            unit: 'pint',
            location: 'freezer',
            category: 'Desserts',
            expirationDate: new Date(Date.now() + 30 * 86400000).toISOString()
          }
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20
      }
    }).as('getFilteredItems');

    // Wait for initial load
    cy.wait('@getInitialItems');

    // First click "All" to enable all location filters
    cy.get('[data-testid="location-filter-all"]').click();
    
    // Now click the Freezer filter button - it should be enabled after selecting "All"
    cy.get('[data-testid="location-filter-freezer"]').click();

    // Verify the API was called with the correct location parameter
    cy.wait('@getFilteredItems').then((interception) => {
      expect(interception.request.url).to.include('location=freezer');
    });

    // Verify only freezer items are shown
    cy.contains('Ice Cream').should('be.visible');
    cy.contains('Milk').should('not.exist');
  });

  it('should filter items by expiration status', () => {
    const now = new Date();
    const expired = new Date(now.getTime() - 86400000); // Yesterday
    const expiringSoon = new Date(now.getTime() + 86400000); // Tomorrow
    const fresh = new Date(now.getTime() + 10 * 86400000); // 10 days from now

    // Mock initial data with different expiration states
    cy.intercept('GET', '/api/v1/households/household-123/items?*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: '1',
            name: 'Expired Milk',
            quantity: 1,
            unit: 'gallon',
            location: 'fridge',
            category: 'Dairy',
            expirationDate: expired.toISOString()
          },
          {
            id: '2',
            name: 'Expiring Salad',
            quantity: 1,
            unit: 'bag',
            location: 'fridge',
            category: 'Produce',
            expirationDate: expiringSoon.toISOString()
          },
          {
            id: '3',
            name: 'Fresh Cheese',
            quantity: 200,
            unit: 'g',
            location: 'fridge',
            category: 'Dairy',
            expirationDate: fresh.toISOString()
          }
        ],
        totalCount: 3,
        page: 1,
        pageSize: 20
      }
    }).as('getAllItems');

    // Wait for initial load
    cy.wait('@getAllItems');

    // Test "Expiring Soon" filter
    cy.get('[data-testid="status-filter-expiring"]').click();
    
    // Verify only expiring soon items are visible (client-side filtering)
    cy.contains('Expiring Salad').should('be.visible');
    cy.contains('Expired Milk').should('not.exist');
    cy.contains('Fresh Cheese').should('not.exist');

    // Test "Expired" filter
    cy.get('[data-testid="status-filter-expired"]').click();
    
    // Verify only expired items are visible
    cy.contains('Expired Milk').should('be.visible');
    cy.contains('Expiring Salad').should('not.exist');
    cy.contains('Fresh Cheese').should('not.exist');

    // Test "All" filter (reset)
    cy.get('[data-testid="status-filter-all"]').click();
    
    // Verify all items are visible again
    cy.contains('Expired Milk').should('be.visible');
    cy.contains('Expiring Salad').should('be.visible');
    cy.contains('Fresh Cheese').should('be.visible');
  });

  it('should clear all filters when clear button is clicked', () => {
    // Set up initial state with filters
    cy.intercept('GET', '/api/v1/households/household-123/items?*', {
      statusCode: 200,
      body: {
        items: [
          {
            id: '1',
            name: 'Test Item',
            quantity: 1,
            unit: 'piece',
            location: 'fridge',
            category: 'Test',
            expirationDate: new Date().toISOString()
          }
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20
      }
    }).as('getItems');

    cy.wait('@getItems');

    // Apply some filters
    cy.get('[data-testid="inventory-search-input"]').type('Test');
    cy.get('[data-testid="status-filter-expiring"]').click();

    // Wait for debounce
    cy.wait(500);

    // Verify filters are active by checking for active filter badges
    cy.contains('Search: Test').should('be.visible');
    cy.contains('Status: Expiring Soon').should('be.visible');

    // Click clear filters
    cy.contains('Clear Filters').click();

    // Verify all filters are cleared
    cy.get('[data-testid="inventory-search-input"]').should('have.value', '');
    cy.contains('Search: Test').should('not.exist');
    cy.contains('Status: Expiring Soon').should('not.exist');
  });
});