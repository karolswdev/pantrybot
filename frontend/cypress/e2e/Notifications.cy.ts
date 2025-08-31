describe("Notifications", () => {
  beforeEach(() => {
    // Set up auth state for Cypress
    cy.window().then((win) => {
      win.localStorage.setItem("accessToken", "test-token");
      win.localStorage.setItem("refreshToken", "test-refresh-token");
      win.localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            isAuthenticated: true,
            token: "test-token",
            refreshToken: "test-refresh-token",
            user: {
              id: "test-user-id",
              email: "test@example.com",
              displayName: "Test User",
            },
            activeHouseholdId: "test-household-id",
            households: [
              {
                id: "test-household-id",
                name: "Test Household",
                role: "admin",
              },
            ],
          },
          version: 0,
        })
      );
    });

    // Visit dashboard which includes the AppShell with notification components
    cy.visit("/dashboard");
  });

  it("should display a new notification and update the badge count", () => {
    // Test Case TC-FE-4.2
    // Arrange: Ensure the notification bell is visible initially with no badge
    cy.get('[data-testid="notification-bell"]').should("be.visible");
    cy.get('[data-testid="notification-badge"]').should("not.exist");

    // Act: Simulate the server pushing a notification.new event
    // We'll access the SignalR service exposed to window and emit an event
    cy.window().then((win) => {
      const signalRService = (win as any).signalRService;
      if (signalRService) {
        // Emit a notification.new event
        signalRService.emit("notification.new", {
          id: "test-notification-1",
          type: "expiring",
          title: "Items Expiring Soon",
          message: "3 items are expiring in the next 2 days",
          timestamp: new Date().toISOString(),
          metadata: {
            items: ["Milk", "Bread", "Yogurt"],
          },
        });
      }
    });

    // Assert: Verify that the notification bell now displays a badge with count "1"
    cy.get('[data-testid="notification-badge"]')
      .should("be.visible")
      .and("contain", "1");

    // Click the bell to open the dropdown
    cy.get('[data-testid="notification-bell"]').click();

    // Assert: Verify the dropdown is visible
    cy.get('[data-testid="notification-dropdown"]').should("be.visible");

    // Assert: Verify the notification message is displayed
    cy.get('[data-testid="notification-dropdown"]')
      .should("contain", "Items Expiring Soon")
      .and("contain", "3 items are expiring in the next 2 days");

    // Simulate another notification
    cy.window().then((win) => {
      const signalRService = (win as any).signalRService;
      if (signalRService) {
        signalRService.emit("notification.new", {
          id: "test-notification-2",
          type: "household",
          title: "New Member Joined",
          message: "Jane Doe has joined your household",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Close dropdown to see updated badge
    cy.get("body").click(0, 0); // Click outside to close

    // Assert: Badge should show "2" now
    cy.get('[data-testid="notification-badge"]')
      .should("be.visible")
      .and("contain", "2");

    // Open dropdown again
    cy.get('[data-testid="notification-bell"]').click();

    // Both notifications should be visible
    cy.get('[data-testid="notification-dropdown"]')
      .should("contain", "Items Expiring Soon")
      .and("contain", "New Member Joined");

    // Wait for auto-mark as read (1 second delay)
    cy.wait(1100);

    // Close and reopen to verify badge is gone
    cy.get("body").click(0, 0);
    cy.wait(100);
    
    // Badge should be gone after marking as read
    cy.get('[data-testid="notification-badge"]').should("not.exist");
  });

  it("should display toast notifications for immediate feedback", () => {
    // Test that toasts appear when notifications are received
    cy.window().then((win) => {
      const signalRService = (win as any).signalRService;
      if (signalRService) {
        // Emit an expired item notification (should show error toast)
        signalRService.emit("notification.new", {
          id: "test-notification-expired",
          type: "expired",
          title: "Item Expired",
          message: "Milk has expired",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Verify toast appears
    cy.get('[data-testid="toast-container"]').should("be.visible");
    cy.get('[data-testid="toast-error"]')
      .should("be.visible")
      .and("contain", "Item Expired")
      .and("contain", "Milk has expired");

    // Test warning toast for expiring items
    cy.window().then((win) => {
      const signalRService = (win as any).signalRService;
      if (signalRService) {
        signalRService.emit("notification.new", {
          id: "test-notification-expiring",
          type: "expiring",
          title: "Items Expiring Soon",
          message: "Bread expires tomorrow",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Verify warning toast appears
    cy.get('[data-testid="toast-warning"]')
      .should("be.visible")
      .and("contain", "Items Expiring Soon");
  });

  it("should handle multiple notifications and display count correctly", () => {
    // Test badge shows "9+" for more than 9 notifications
    cy.window().then((win) => {
      const signalRService = (win as any).signalRService;
      if (signalRService) {
        // Send 12 notifications
        for (let i = 1; i <= 12; i++) {
          signalRService.emit("notification.new", {
            id: `test-notification-${i}`,
            type: "info",
            title: `Notification ${i}`,
            message: `This is notification number ${i}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    });

    // Badge should show "9+" for more than 9 unread
    cy.get('[data-testid="notification-badge"]')
      .should("be.visible")
      .and("contain", "9+");

    // Open dropdown
    cy.get('[data-testid="notification-bell"]').click();

    // Should only show 10 notifications in dropdown (max limit)
    cy.get('[data-testid="notification-dropdown"]')
      .find('[data-testid^="notification-item-"]')
      .should("have.length.lte", 10);

    // Should have a "View all notifications" link
    cy.get('[data-testid="notification-dropdown"]')
      .should("contain", "View all notifications");
  });

  it("should persist notifications across page refreshes", () => {
    // Send a notification
    cy.window().then((win) => {
      const signalRService = (win as any).signalRService;
      if (signalRService) {
        signalRService.emit("notification.new", {
          id: "persistent-notification",
          type: "household",
          title: "Persistent Notification",
          message: "This should persist",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Verify badge shows
    cy.get('[data-testid="notification-badge"]')
      .should("be.visible")
      .and("contain", "1");

    // Reload the page
    cy.reload();

    // Badge should still be visible after reload (due to Zustand persistence)
    cy.get('[data-testid="notification-badge"]')
      .should("be.visible")
      .and("contain", "1");

    // Open dropdown to verify notification is still there
    cy.get('[data-testid="notification-bell"]').click();
    cy.get('[data-testid="notification-dropdown"]')
      .should("contain", "Persistent Notification");
  });
});