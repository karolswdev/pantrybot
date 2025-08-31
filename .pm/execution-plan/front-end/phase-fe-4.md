[ ] PHASE-FE-4: Real-Time Sync & Notifications

### **1. Phase Context (What & Why)**

| ID           | Title                         |
| :----------- | :---------------------------- |
| PHASE-FE-4 | Real-Time Sync & Notifications |

> **As a** household member, **I want** to see inventory changes from others in real-time and receive timely notifications about important events, **so that** our household can stay perfectly in sync and reduce food waste effectively.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **SYS-FUNC-027** - System MUST provide real-time updates across household members ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-4.1`
        *   **Test Method Signature:** `InventorySync.cy.ts - it('should update an item in the UI when a WebSocket event is received')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Load the inventory page with a list of items. Establish a mock SignalR connection. **Act:** Simulate the server pushing an `item.updated` event for a specific item with a new quantity. **Assert:** Verify that the corresponding item card in the UI updates to display the new quantity automatically, without a manual refresh or API polling.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **SYS-FUNC-021** - System MUST support in-app notifications ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-4.2`
        *   **Test Method Signature:** `Notifications.cy.ts - it('should display a new notification and update the badge count')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Load the main application shell. Establish a mock SignalR connection. **Act:** Simulate the server pushing a `notification.new` event. **Assert:** Verify that the notification bell icon in the header now displays a badge with the count "1". Verify that clicking the bell opens a dropdown that contains the new notification message.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **SYS-FUNC-012** & **SYS-FUNC-019** - Users can configure notification preferences & customize the warning period ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-4.3`
        *   **Test Method Signature:** `NotificationSettings.cy.ts - it('should successfully update notification preferences')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept `GET /api/v1/notifications/settings` to load initial settings. Intercept `PUT /api/v1/notifications/settings` to verify the update payload. **Act:** Navigate to `/settings/notifications`, change the "Expiration Warning Days" from 3 to 5, and click Save. **Assert:** Verify that the `PUT` request was called with `expirationWarningDays: 5` in its body.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **SYS-FUNC-023** - Users MUST be able to link Telegram accounts ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-4.4`
        *   **Test Method Signature:** `TelegramLink.cy.ts - it('should link a telegram account with a verification code')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept `POST /api/v1/notifications/telegram/link`. **Act:** Navigate to `/settings/notifications`, click the "Connect with Telegram" button, enter a verification code into the modal, and submit. **Assert:** Verify the `POST` was called with the correct verification code. Verify the UI updates to show a "Connected" status.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-FE-4.1: Real-time Inventory Synchronization

1.  **Task:** Implement SignalR Client Service.
    *   **Instruction:** `Install the @microsoft/signalr client library. Create a singleton service that manages the WebSocket connection lifecycle (start, stop, reconnect). This service should handle authentication by sending the JWT token upon connection as per the WebSocket contract.`
    *   **Fulfills:** This is a prerequisite for **SYS-FUNC-027**.
    *   **Verification via Test Cases:** The successful implementation of this service is implicitly tested by `TC-FE-4.1`.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Create a file at frontend/lib/realtime/README.md explaining how the SignalR service works, how to subscribe to events, and how it handles authentication and reconnections.` **Evidence:** Provide the content of the new README.md file.

2.  **Task:** Integrate Real-time Updates into Inventory State.
    *   **Instruction:** `In the main inventory component, use the SignalR service to subscribe to household-specific events like 'item.updated', 'item.added', and 'item.deleted'. When an event is received, use the react-query client to intelligently update the local cache (`queryClient.setQueryData`) instead of triggering a full re-fetch. This will provide a seamless, real-time experience.`
    *   **Fulfills:** This task contributes to requirement **SYS-FUNC-027**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-4.1`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-027', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update the frontend/hooks/queries/README.md to explain how real-time events interact with the query cache for the inventory list.` **Evidence:** Provide a diff of the updated README.md.

---
> ### **Story Completion: STORY-FE-4.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(realtime): Complete STORY-FE-4.1 - Real-time Inventory Synchronization"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-FE-4.2: In-App Notifications System

1.  **Task:** Build Notification UI Components.
    *   **Instruction:** `Create the UI components for the notification system as designed in [ui-ux-specifications.md#2.1-app-shell...](./ui-ux-specifications.md#2.1-app-shell-wrapper-for-all-authenticated-pages). This includes the bell icon with a badge in the header, and the dropdown/popover that lists recent notifications. Also, implement a global toast/snackbar system for immediate feedback.`
    *   **Fulfills:** This task is a prerequisite for **SYS-FUNC-021**.
    *   **Verification via Test Cases:** The UI components are visually verified by `TC-FE-4.2`.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Add documentation for the new 'NotificationBell' and 'Toast' components to frontend/components/README.md.` **Evidence:** Provide a diff of the updated README.md.

2.  **Task:** Implement Notification State Management and Real-time Handling.
    *   **Instruction:** `Create a new Zustand store for notifications to manage state (notifications list, unread count). Use the SignalR service to listen for 'notification.new' events. When an event is received, add the notification to the store, which will in turn update the bell badge and list, and trigger a toast message.`
    *   **Fulfills:** This task contributes to requirement **SYS-FUNC-021**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-4.2`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-021', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Create a file at frontend/stores/notifications/README.md that documents the new notification store's state and actions.` **Evidence:** Provide the content of the new README.md.

---
> ### **Story Completion: STORY-FE-4.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(notifications): Complete STORY-FE-4.2 - In-App Notification System"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-FE-4.3: User Notification Preferences

1.  **Task:** Build the Notification Settings Page UI.
    *   **Instruction:** `Create the '/settings/notifications' page according to the design in [ui-ux-specifications.md#7.3-notification-settings...](./ui-ux-specifications.md#7.3-notification-settings-settingsnotifications). Use a react-query hook to fetch current settings from GET /api/v1/notifications/settings and populate the form fields.`
    *   **Fulfills:** This is a prerequisite for **SYS-FUNC-012**, **SYS-FUNC-019**, **SYS-FUNC-023**.
    *   **Verification via Test Cases:** UI is verified via E2E tests in the next task.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Add documentation for the 'NotificationSettingsForm' component to frontend/components/README.md.` **Evidence:** Provide a diff of the updated README.md.

2.  **Task:** Implement Settings Update and Telegram Link Logic.
    *   **Instruction:** `Create mutation hooks for updating settings (PUT /api/v1/notifications/settings) and linking a Telegram account (POST /api/v1/notifications/telegram/link). Connect these mutations to the settings form and the "Connect with Telegram" modal respectively. On success, show a confirmation toast.`
    *   **Fulfills:** This task contributes to requirements **SYS-FUNC-012**, **SYS-FUNC-019**, and **SYS-FUNC-023**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-4.3`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement IDs 'SYS-FUNC-012' and 'SYS-FUNC-019', add '(FE Verified)'.` **Evidence:** Provide a diff of the changed lines.
        *   **Test Case `TC-FE-4.4`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-023', add '(FE Verified)'.` **Evidence:** Provide a diff of the changed line.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update frontend/hooks/mutations/README.md to include documentation for the new notification settings and telegram link mutations.` **Evidence:** Provide a diff of the updated README.md.

---
> ### **Story Completion: STORY-FE-4.3**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(settings): Complete STORY-FE-4.3 - User Notification Preferences"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-FE` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [ ] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute 'docker-compose exec frontend npm test' one last time.`
    *   **Evidence:** Provide the full, final summary output from the test runner, showing the grand total of tests for this phase and confirming that 100% have passed.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-FE-4` to `[x] PHASE-FE-4`. This concludes your work on this phase file.