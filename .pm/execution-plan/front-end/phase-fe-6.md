[ ] PHASE-FE-6: MVP Polish - Reporting, Filtering & Mobile UX

### **1. Phase Context (What & Why)**

| ID           | Title                                    |
| :----------- | :--------------------------------------- |
| PHASE-FE-6 | MVP Polish - Reporting, Filtering & Mobile UX |

> **As a** user, **I want** to analyze my consumption habits, easily find specific items in my inventory, and have a seamless experience on my mobile device, **so that** the application is both powerful and convenient for daily use.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **SYS-FUNC-017 / US-017** - View Waste Statistics ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-6.1`
        *   **Test Method Signature:** `Reports.cy.ts - it('should display waste statistics from the API')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept the API endpoint for household statistics/reports and return mock data (e.g., `wastedThisMonth: 15`). **Act:** Navigate to the `/reports` page. **Assert:** Verify that the "Food Waste Tracking" component renders and displays the value "15" from the mocked data.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **SYS-FUNC-019 / US-019** & **SYS-FUNC-020 / US-020** - Search & Filter Inventory ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-6.2`
        *   **Test Method Signature:** `InventoryFilter.cy.ts - it('should re-fetch the item list with a search query parameter')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept `GET /api/v1/households/{id}/items?search=Milk` and return a specific item ("Milk"). Intercept the initial load without a query to return a larger list. **Act:** Navigate to an inventory page. Type "Milk" into the search input field. **Assert:** Verify the API was called with the correct `search=Milk` query parameter. Verify that only the "Milk" item is now visible in the list.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.
    *   **Test Case ID:** `TC-FE-6.3`
        *   **Test Method Signature:** `InventoryFilter.cy.ts - it('should filter items by location')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept the API call with a `location=freezer` query parameter. **Act:** On the inventory page, click the "Freezer" filter button. **Assert:** Verify the API was called with the correct `location=freezer` parameter.
        *   **Required Proof of passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **SYS-PORT-002 / US-018** - PWA Mobile Experience ([Link to file](./system/mvp/SRS.md#portability-requirements))
    *   **Test Case ID:** `TC-FE-6.4`
        *   **Test Method Signature:** `MobileLayout.cy.ts - it('should display the bottom tab bar on a mobile viewport and hide the sidebar')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Set the Cypress viewport to a mobile size (e.g., `iphone-x`). **Act:** Navigate to the `/dashboard`. **Assert:** Verify the main sidebar navigation is not visible. Verify the mobile bottom tab bar, as designed in the UI specs, *is* visible.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.
    *   **Test Case ID:** `TC-FE-6.5`
        *   **Test Method Signature:** `PWA.cy.ts - it('should be installable with a service worker')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Load the application. **Act:** Check the browser's developer tools context (`window`). **Assert:** Verify that `navigator.serviceWorker` is available and a service worker is registered and activated for the application's scope.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-FE-6.1: Basic Reporting

1.  **Task:** Build the Reports Page UI.
    *   **Instruction:** `Create the static UI for the '/reports' page based on the design in [ui-ux-specifications.md#6-reports--analytics-page-reports](./ui-ux-specifications.md#6-reports--analytics-page-reports). Include placeholder components for the charts and statistics.`
    *   **Fulfills:** This is a prerequisite for **SYS-FUNC-017**.
    *   **Verification via Test Cases:** The UI is verified by the E2E test in the next task.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Add documentation for the new 'ReportsPage' and chart components to frontend/components/README.md.` **Evidence:** Provide a diff of the updated README.md.

2.  **Task:** Fetch and Display Reporting Data.
    *   **Instruction:** `Create a new react-query hook to fetch analytics data from the relevant API endpoint. Integrate this hook into the reports page to display dynamic data, replacing the placeholders.`
    *   **Fulfills:** This task contributes to requirement **SYS-FUNC-017**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-6.1`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-017', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update frontend/hooks/queries/README.md to include documentation for the new reporting/analytics hook.` **Evidence:** Provide a diff of the updated README.md.

---
> ### **Story Completion: STORY-FE-6.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(reports): Complete STORY-FE-6.1 - Basic Reporting"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-FE-6.2: Inventory Filtering and Search

1.  **Task:** Add Filter and Search Controls to Inventory UI.
    *   **Instruction:** `Add the search input and filter buttons/tabs (for location, status, etc.) to the inventory page, as designed in [ui-ux-specifications.md#4.1-inventory-list-view...](./ui-ux-specifications.md#4.1-inventory-list-view-inventoryfridge).`
    *   **Fulfills:** This is a prerequisite for **SYS-FUNC-019** & **SYS-FUNC-020**.
    *   **Verification via Test Cases:** The UI is verified by the E2E tests in the next task.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Add documentation for the 'InventoryToolbar' component to frontend/components/README.md.` **Evidence:** Provide a diff of the updated README.md.

2.  **Task:** Implement State Management and API Integration for Filtering.
    *   **Instruction:** `Use a component state (e.g., useState or a state management library) to hold the current filter and search term. Modify the inventory query hook to accept these values as parameters and pass them to the API. Use a debouncing mechanism on the search input to prevent excessive API calls.`
    *   **Fulfills:** This task contributes to requirements **SYS-FUNC-019** & **SYS-FUNC-020**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-6.2`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-019', add '(FE Verified)'.` **Evidence:** Provide a diff of the changed line.
        *   **Test Case `TC-FE-6.3`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-020', add '(FE Verified)'.` **Evidence:** Provide a diff of the changed line.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update the inventory query hook documentation in frontend/hooks/queries/README.md to include the new filter parameters.` **Evidence:** Provide a diff of the updated README.md.

---
> ### **Story Completion: STORY-FE-6.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(inventory): Complete STORY-FE-6.2 - Inventory Filtering and Search"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-FE-6.3: Mobile Experience & PWA Finalization

1.  **Task:** Implement Responsive Layouts and Mobile Navigation.
    *   **Instruction:** `Using Tailwind CSS's responsive prefixes, adapt all existing pages (Dashboard, Inventory, Settings, etc.) for mobile viewports. Implement the mobile-specific bottom tab bar navigation as designed in [ui-ux-specifications.md#8.1-mobile-navigation-bottom-tab-bar](./ui-ux-specifications.md#8.1-mobile-navigation-bottom-tab-bar), which should be hidden on desktop.`
    *   **Fulfills:** This task contributes to requirement **SYS-PORT-002 / US-018**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-6.4`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Create a new document at frontend/styles/RESPONSIVE.md explaining the responsive strategy and breakpoints used.` **Evidence:** Provide the content of the new file.

2.  **Task:** Configure and Verify PWA Service Worker.
    *   **Instruction:** `Finalize the configuration of the 'next-pwa' package. Ensure the service worker is correctly generated on build and provides basic offline caching for the application shell and static assets. Verify the web app manifest is correctly linked and configured.`
    *   **Fulfills:** This task contributes to requirement **SYS-PORT-002 / US-018**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-6.5`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-PORT-002', ensure it is marked as '(FE Verified)'.` **Evidence:** Confirm the status of SYS-PORT-002 in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Create a document at frontend/pwa/README.md explaining the PWA strategy, what is cached, and the expected offline behavior for the MVP.` **Evidence:** Provide the content of the new file.

---
> ### **Story Completion: STORY-FE-6.3**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(ux): Complete STORY-FE-6.3 - Mobile Experience & PWA Finalization"'.`
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

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-FE-6` to `[x] PHASE-FE-6`. This concludes your work on this phase file.