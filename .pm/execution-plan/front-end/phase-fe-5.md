[ ] PHASE-FE-5: Collaborative Shopping Lists

### **1. Phase Context (What & Why)**

| ID           | Title                        |
| :----------- | :--------------------------- |
| PHASE-FE-5 | Collaborative Shopping Lists |

> **As a** household member, **I want** to create and manage shared shopping lists in real-time with others, **so that** we can coordinate our grocery shopping efficiently and avoid duplicate purchases.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **SYS-FUNC-024** - Households MUST have shared shopping lists ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-5.1`
        *   **Test Method Signature:** `ShoppingLists.cy.ts - it('should display shopping lists for the active household')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept `GET /api/v1/households/{id}/shopping-lists` and return a mock array of 2 lists. **Act:** Navigate to the `/shopping` page. **Assert:** Verify that 2 shopping list components are rendered, and their names match the mocked data.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.
    *   **Test Case ID:** `TC-FE-5.2`
        *   **Test Method Signature:** `ShoppingLists.cy.ts - it('should successfully create a new shopping list')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept `POST /api/v1/households/{id}/shopping-lists`. **Act:** Click the "New List" button, enter a name in the modal, and submit. **Assert:** Verify the `POST` was called with the correct name. Verify the new list appears in the UI after a successful response.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **SYS-FUNC-025** - System MUST sync shopping lists in real-time ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-5.3`
        *   **Test Method Signature:** `ShoppingListDetail.cy.ts - it('should check off an item when a WebSocket event is received')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Load a shopping list detail view. Establish a mock SignalR connection. **Act:** Simulate the server pushing a `shoppinglist.item.updated` event for an unchecked item, marking it as complete. **Assert:** Verify the corresponding item's checkbox in the UI becomes checked, and the item moves to the "Bought" section without a page refresh.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **(Implied)** - Users must be able to add/remove/update items on a shopping list.
    *   **Test Case ID:** `TC-FE-5.4`
        *   **Test Method Signature:** `ShoppingListDetail.cy.ts - it('should add an item to the list')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept `POST /api/v1/households/{id}/shopping-lists/{listId}/items`. **Act:** On a shopping list detail view, use the "Add item" input field, type a name, and submit. **Assert:** Verify the `POST` was called with the correct item name. Verify the new item appears in the "To Buy" section.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.
    *   **Test Case ID:** `TC-FE-5.5`
        *   **Test Method Signature:** `ShoppingListDetail.cy.ts - it('should check and uncheck an item')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept the `PUT` or `PATCH` endpoint for updating a shopping list item's state. **Act:** Click the checkbox next to an item in the "To Buy" list. **Assert:** Verify the API was called to mark the item as complete. Verify the item moves to the "Bought" list. **Act Again:** Click the checkbox next to the same item in the "Bought" list. **Assert:** Verify the API was called to mark the item as incomplete. Verify the item moves back to the "To Buy" list.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-FE-5.1: Shopping List Overview

1.  **Task:** Build the Shopping List Page UI.
    *   **Instruction:** `Create the static UI for the main shopping list page ('/shopping') as designed in [ui-ux-specifications.md#5-shopping-list-page-shopping](./ui-ux-specifications.md#5-shopping-list-page-shopping). This includes the layout for displaying multiple lists and the "New List" button and its associated modal.`
    *   **Fulfills:** This is a prerequisite for **SYS-FUNC-024**.
    *   **Verification via Test Cases:** The UI is verified by E2E tests in the subsequent tasks.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Add documentation for the 'ShoppingListPage' and 'CreateListModal' components to frontend/components/README.md.` **Evidence:** Provide a diff of the updated README.md.

2.  **Task:** Fetch and Manage Shopping Lists.
    *   **Instruction:** `Create a new react-query hook to fetch all shopping lists from GET /api/v1/households/{householdId}/shopping-lists. Create a mutation hook for creating a new list (POST). On successful creation, invalidate the list query to trigger a UI refresh.`
    *   **Fulfills:** This task contributes to requirement **SYS-FUNC-024**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-5.1`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-024', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
        *   **Test Case `TC-FE-5.2`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update frontend/hooks/queries/README.md and frontend/hooks/mutations/README.md to include documentation for the new shopping list hooks.` **Evidence:** Provide diffs of the updated README files.

---
> ### **Story Completion: STORY-FE-5.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(shopping): Complete STORY-FE-5.1 - Shopping List Overview"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-FE-5.2: Real-Time Item Management

1.  **Task:** Implement Shopping List Item UI and State Management.
    *   **Instruction:** `Create the detailed view for a single shopping list. This includes the "To Buy" and "Bought" sections, and the "Add item" form. Fetch the specific list's items using a dedicated query hook. Implement the mutation hooks for adding an item and for updating an item's 'completed' status.`
    *   **Fulfills:** This task contributes to the implied requirements for item management.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-5.4`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
        *   **Test Case `TC-FE-5.5`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Add documentation for the 'ShoppingListDetail' and 'ShoppingListItem' components to frontend/components/README.md.` **Evidence:** Provide a diff of the updated README.md.

2.  **Task:** Integrate Real-Time Sync for Shopping List Items.
    *   **Instruction:** `Using the SignalR service, subscribe to shopping list events (e.g., 'shoppinglist.item.added', 'shoppinglist.item.updated'). When an event is received, update the react-query cache for the specific shopping list to reflect the changes in the UI instantly.`
    *   **Fulfills:** This task contributes to requirement **SYS-FUNC-025**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-5.3`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-025', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update frontend/lib/realtime/README.md to include details on the new shopping list events the service subscribes to.` **Evidence:** Provide a diff of the updated README.md.

---
> ### **Story Completion: STORY-FE-5.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(shopping): Complete STORY-FE-5.2 - Real-Time Item Management"'.`
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

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-FE-5` to `[x] PHASE-FE-5`. This concludes your work on this phase file.