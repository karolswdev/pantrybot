[ ] PHASE-FE-2: Dashboard & Household Management
### **1. Phase Context (What & Why)**

| ID           | Title                        |
| :----------- | :--------------------------- |
| PHASE-FE-2 | Dashboard & Household Management |

> **As a** logged-in user, **I want** to see a dashboard overview of my inventory and manage my household members and settings, **so that** I can get a quick status update and collaborate effectively with others.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **SYS-FUNC-005** & **SYS-FUNC-006** - Users MUST be able to create and belong to multiple households ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-2.1`
        *   **Test Method Signature:** `HouseholdSwitcher.cy.ts - it('should list all user households and allow switching')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Mock `GET /api/v1/households` to return a list of 2+ households. **Act:** Click the household switcher in the header. **Assert:** Verify the dropdown displays all mocked households. Click a different household. **Assert:** Verify a global state (e.g., in Zustand) is updated with the new `activeHouseholdId`.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.
    *   **Test Case ID:** `TC-FE-2.2`
        *   **Test Method Signature:** `CreateHousehold.cy.ts - it('should successfully create a new household and refresh the list')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept `POST /api/v1/households` for a successful response. Intercept `GET /api/v1/households` to be called again after creation. **Act:** Open the "Create Household" modal from the household settings page, fill the form, and submit. **Assert:** Verify the `POST` was called with the correct data. Verify the modal closes and a success notification appears. Verify the household list is refetched.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **SYS-FUNC-007** & **SYS-FUNC-008** - System MUST support three role levels & admins MUST be able to invite members ([Link to file](./system/mvp/SRS.md#functional-requirements))
    *   **Test Case ID:** `TC-FE-2.3`
        *   **Test Method Signature:** `HouseholdSettings.cy.ts - it('should show invite button for admins but not for members')`
        *   **Test Logic:** (E2E Test) - **Scenario 1 (Admin):** Mock `GET /api/v1/households/{id}` with the user's role as 'admin'. Navigate to `/settings/households`. **Assert:** The "Invite Member" button is visible. **Scenario 2 (Member):** Mock the same endpoint but with the role as 'member'. Navigate to the page. **Assert:** The "Invite Member" button is *not* visible.
        *   **Required Proof of Passing:** Cypress test runner output showing both scenarios pass.
    *   **Test Case ID:** `TC-FE-2.4`
        *   **Test Method Signature:** `InviteMember.cy.ts - it('should successfully send a member invitation')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Intercept `POST /api/v1/households/{id}/members` for a successful response. **Act:** As an admin, navigate to the household settings, open the "Invite Member" modal, fill in an email and select a role, and submit. **Assert:** Verify the `POST` was called with the correct email and role. Verify the modal closes and a success message is shown.
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.

*   **Requirement:** **US-002** - User sees household dashboard after login ([Link to file](./user-stories.md#us-002-user-login))
    *   **Test Case ID:** `TC-FE-2.5`
        *   **Test Method Signature:** `Dashboard.cy.ts - it('should display summary statistics from the API')`
        *   **Test Logic:** (E2E Test) - **Arrange:** Mock `GET /api/v1/households/{id}` to return specific statistics (e.g., totalItems: 47, expiringItems: 5). **Act:** Navigate to the `/dashboard`. **Assert:** Verify the summary cards on the dashboard display the exact numbers "47" and "5".
        *   **Required Proof of Passing:** Cypress test runner output showing the test passes.
    *   **Test Case ID:** `TC-FE-2.6`
        *   **Test Method Signature:** `Dashboard.test.tsx - it('should show a loading skeleton while fetching data')`
        *   **Test Logic:** (Component Test) - **Arrange:** Render the Dashboard component with a mocked API hook that is in a 'loading' state. **Assert:** Verify that placeholder/skeleton components are rendered instead of the data cards.
        *   **Required Proof of Passing:** Jest/RTL test output showing the test passes.
    *   **Test Case ID:** `TC-FE-2.7`
        *   **Test Method Signature:** `Dashboard.test.tsx - it('should show an empty state when there are no items')`
        *   **Test Logic:** (Component Test) - **Arrange:** Render the Dashboard component with a mocked API hook that returns a household with 0 items. **Assert:** Verify that the empty state component, as defined in the UI specs, is rendered.
        *   **Required Proof of Passing:** Jest/RTL test output showing the test passes.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-FE-2.1: Implement the Main Dashboard View

1.  **Task:** Build Static Dashboard UI Components.
    *   **Instruction:** `Create the static React components for the Dashboard page based on the design in [ui-ux-specifications.md#3-dashboard-page-dashboard](./ui-ux-specifications.md#3-dashboard-page-dashboard). Include components for summary cards, the "Expiring Soon" list, quick actions, and recent activity, using placeholder data. Implement the loading skeletons and empty states as designed in [ui-ux-specifications.md#9.1-empty-inventory](./ui-ux-specifications.md#9.1-empty-inventory) and [#10.1-loading-state](./ui-ux-specifications.md#10.1-loading-state).`
    *   **Fulfills:** This task contributes to requirement **US-002**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-2.6`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
        *   **Test Case `TC-FE-2.7`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Add a section to frontend/components/README.md for the new Dashboard components, detailing their props and usage.` **Evidence:** Provide a diff of the updated README.md.

2.  **Task:** Fetch and Display Dynamic Household Data on the Dashboard.
    *   **Instruction:** `Using @tanstack/react-query, create a hook to fetch data from the GET /api/v1/households/{householdId} endpoint. Integrate this hook into the Dashboard page to replace placeholder data with live data. Ensure loading, error, and success states are handled correctly.`
    *   **Fulfills:** This task contributes to requirement **US-002**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-2.5`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Since User Stories are not in the matrix, confirm that all functional requirements linked to US-002 (e.g., SYS-FUNC-002) are marked as verified.` **Evidence:** Confirm the status of SYS-FUNC-002 in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Create a file at frontend/hooks/queries/README.md explaining the new household data query hook.` **Evidence:** Provide the content of the new README.md.

---
> ### **Story Completion: STORY-FE-2.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(dashboard): Complete STORY-FE-2.1 - Implement the Main Dashboard View"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-FE-2.2: Implement Household Context and Management UI

1.  **Task:** Implement Household State and Switcher Component.
    *   **Instruction:** `Extend the Zustand store to manage the active household ID. Create a 'Household Switcher' component in the main header as designed in [ui-ux-specifications.md#2.1-app-shell...](./ui-ux-specifications.md#2.1-app-shell-wrapper-for-all-authenticated-pages). This component will use a new query hook to fetch from GET /api/v1/households and update the global state on selection.`
    *   **Fulfills:** This task contributes to requirement **SYS-FUNC-006**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-2.1`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-006', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update frontend/stores/auth/README.md to include documentation for the new active household state.` **Evidence:** Provide a diff of the updated README.md.

2.  **Task:** Build the Household Settings Page and Invite Member UI.
    *   **Instruction:** `Create the '/settings/households' page based on the design in [ui-ux-specifications.md#7.2-household-management...](./ui-ux-specifications.md#7.2-household-management-settingshouseholds). Fetch and display the list of current members. Implement the 'Invite Member' modal. Critically, use the user's role from the household data to conditionally render the 'Invite' button.`
    *   **Fulfills:** This task contributes to requirements **SYS-FUNC-007** and **SYS-FUNC-008**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-2.3`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-007', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Add a section to frontend/components/README.md for the new Household Settings and Invite Member components.` **Evidence:** Provide a diff of the updated README.md.

3.  **Task:** Implement Member Invitation and Household Creation Logic.
    *   **Instruction:** `Create mutation hooks for inviting members (POST /api/v1/households/{id}/members) and creating new households (POST /api/v1/households). Connect these mutations to the forms created in the previous task. On success, invalidate the relevant queries (household list, household details) to trigger an automatic UI refresh.`
    *   **Fulfills:** This task contributes to requirements **SYS-FUNC-005** and **SYS-FUNC-008**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-FE-2.2`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-005', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
        *   **Test Case `TC-FE-2.4`:**
            *   [ ] **Test Method Created:** Checked after the test method is written. **Evidence:** Provide the complete code for the test method.
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** Provide the console output from the test runner proving the specific test passed.
            *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md. For Requirement ID 'SYS-FUNC-008', add a status indicator like '(FE Verified)'.` **Evidence:** Provide a diff of the changed line in traceability.md.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Create a file at frontend/hooks/mutations/README.md explaining the new household mutation hooks.` **Evidence:** Provide the content of the new README.md.

---
> ### **Story Completion: STORY-FE-2.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose exec frontend npm test'.`
>     *   **Evidence:** Provide the full summary output from the test runner, showing the total number of tests executed and confirming all have passed.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(households): Complete STORY-FE-2.2 - Implement Household Context and Management UI"'.`
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

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-FE-2` to `[x] PHASE-FE-2`. This concludes your work on this phase file.