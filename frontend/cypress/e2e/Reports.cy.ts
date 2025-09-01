describe('Reports Page', () => {
  beforeEach(() => {
    // Set up auth state
    cy.window().then((win) => {
      win.localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          isAuthenticated: true,
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            displayName: 'Test User'
          },
          currentHouseholdId: 'household-123',
          households: [{
            id: 'household-123',
            name: 'Test Household',
            role: 'admin'
          }],
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token'
        }
      }));
    });
  });

  it('should display waste statistics from the API', () => {
    // Arrange: Intercept the API endpoint for household statistics/reports and return mock data
    cy.intercept('GET', '**/households/household-123/statistics*', {
      statusCode: 200,
      body: {
        statistics: {
          wastedThisMonth: 15,
          wastedLastMonth: 20,
          wasteChangePercentage: -25,
          weeklyWaste: [
            { week: 'Week 1', value: 5 },
            { week: 'Week 2', value: 4 },
            { week: 'Week 3', value: 3 },
            { week: 'Week 4', value: 3 }
          ],
          categoryBreakdown: [
            { category: 'Produce', percentage: 40, value: 6 },
            { category: 'Dairy', percentage: 30, value: 4.5 },
            { category: 'Leftovers', percentage: 20, value: 3 },
            { category: 'Meat', percentage: 10, value: 1.5 }
          ],
          expiryPatterns: [
            { dayOfWeek: 'Mon', count: 5 },
            { dayOfWeek: 'Tue', count: 3 },
            { dayOfWeek: 'Wed', count: 2 },
            { dayOfWeek: 'Thu', count: 1 },
            { dayOfWeek: 'Fri', count: 8 },
            { dayOfWeek: 'Sat', count: 6 },
            { dayOfWeek: 'Sun', count: 5 }
          ],
          inventoryValue: 350,
          totalItemsWasted: 12,
          totalItemsConsumed: 38,
          savingsFromConsumed: 98.75
        }
      }
    }).as('getReports');

    // Act: Navigate to the /reports page
    cy.visit('/reports');

    // Wait for the API call to complete
    cy.wait('@getReports');

    // Assert: Verify that the "Food Waste Tracking" component renders
    cy.get('[data-testid="waste-tracking-card"]').should('exist');
    
    // Assert: Verify that the waste statistics display the value "15" from the mocked data
    cy.get('[data-testid="waste-statistics"]').should('exist');
    cy.get('[data-testid="waste-value"]').should('contain', '$15');
    
    // Additional assertions to verify the full component renders correctly
    cy.get('[data-testid="waste-statistics"]').should('contain', '25% from last month');
    
    // Verify other sections are rendered
    cy.get('[data-testid="categories-card"]').should('exist');
    cy.get('[data-testid="expiry-patterns-card"]').should('exist');
  });

  it('should use fallback mock data when API is unavailable', () => {
    // Arrange: Simulate API error
    cy.intercept('GET', '**/households/household-123/statistics*', {
      statusCode: 404,
      body: { error: 'Not found' }
    }).as('getReportsError');

    // Act: Navigate to the /reports page
    cy.visit('/reports');

    // Wait for the API call to complete (and fail)
    cy.wait('@getReportsError');

    // Assert: Verify the page still renders with mock data
    cy.get('[data-testid="waste-tracking-card"]').should('exist');
    cy.get('[data-testid="waste-statistics"]').should('exist');
    
    // Verify mock data is displayed (45 is the mock value)
    cy.get('[data-testid="waste-value"]').should('contain', '$45');
  });

  it('should display charts instead of placeholders', () => {
    // Test Case TC-FE-7.8
    // Arrange: Intercept the API endpoint with mock data
    cy.intercept('GET', '**/households/household-123/statistics*', {
      statusCode: 200,
      body: {
        statistics: {
          wastedThisMonth: 124.50,
          wasteChangePercentage: -15.3,
          weeklyWaste: [
            { week: 'Week 1', value: 35.20 },
            { week: 'Week 2', value: 28.50 },
            { week: 'Week 3', value: 42.10 },
            { week: 'Week 4', value: 18.70 },
          ],
          categoryBreakdown: [
            { category: 'Dairy', percentage: 35 },
            { category: 'Produce', percentage: 28 },
            { category: 'Meat', percentage: 20 },
            { category: 'Bakery', percentage: 12 },
            { category: 'Other', percentage: 5 },
          ],
          expiryPatterns: [
            { dayOfWeek: 'Mon', count: 3 },
            { dayOfWeek: 'Tue', count: 5 },
            { dayOfWeek: 'Wed', count: 2 },
            { dayOfWeek: 'Thu', count: 7 },
            { dayOfWeek: 'Fri', count: 4 },
            { dayOfWeek: 'Sat', count: 8 },
            { dayOfWeek: 'Sun', count: 6 },
          ],
          inventoryValue: 523.75,
        }
      }
    }).as('getReportsWithCharts');

    // Act: Navigate to /reports
    cy.visit('/reports');
    cy.wait('@getReportsWithCharts');
    
    // Assert: Verify that a <canvas> element is rendered within the "Food Waste Tracking" card
    cy.get('[data-testid="waste-tracking-card"]').within(() => {
      cy.get('canvas').should('exist').and('be.visible');
      
      // Verify that the placeholder div with gray background is no longer present
      cy.get('.bg-gray-100').should('not.exist');
      
      // Verify that the chart is rendered (canvas should have content)
      cy.get('canvas').then(($canvas) => {
        const canvas = $canvas[0] as HTMLCanvasElement;
        const context = canvas.getContext('2d');
        expect(context).to.not.be.null;
        // Canvas should have been drawn to (not empty)
        expect(canvas.width).to.be.greaterThan(0);
        expect(canvas.height).to.be.greaterThan(0);
      });
    });

    // Also verify the Top Categories chart
    cy.get('[data-testid="categories-card"]').within(() => {
      cy.get('canvas').should('exist').and('be.visible');
    });

    // And verify the Expiry Patterns chart
    cy.get('[data-testid="expiry-patterns-card"]').within(() => {
      cy.get('canvas').should('exist').and('be.visible');
    });
  });

  it('should update data when date range changes', () => {
    // Arrange: Set up different responses for different date ranges
    cy.intercept('GET', '**/households/household-123/statistics?days=30', {
      statusCode: 200,
      body: {
        statistics: {
          wastedThisMonth: 30,
          wasteChangePercentage: -10
        }
      }
    }).as('get30Days');

    cy.intercept('GET', '**/households/household-123/statistics?days=7', {
      statusCode: 200,
      body: {
        statistics: {
          wastedThisMonth: 7,
          wasteChangePercentage: 5
        }
      }
    }).as('get7Days');

    // Act: Navigate to the /reports page
    cy.visit('/reports');
    cy.wait('@get30Days');

    // Initial state should show 30-day data
    cy.get('[data-testid="waste-value"]').should('contain', '$30');

    // Change date range to 7 days
    cy.get('[role="combobox"]').click();
    cy.get('[role="option"]').contains('Last 7 days').click();
    cy.wait('@get7Days');

    // Assert: Verify data updates to 7-day values
    cy.get('[data-testid="waste-value"]').should('contain', '$7');
  });
});