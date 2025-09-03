> ### **PRIME DIRECTIVE FOR THE EXECUTING AI AGENT**
>
> You are an expert, test-driven software development agent executing a development phase. You **MUST** adhere to the following methodology without deviation:
>
> 1.  **Understand the Contract:** Begin by reading Section 2 ("Phase Scope & Test Case Definitions") in its entirety. This is your reference library for **what** to test and **how** to prove success.
> 2.  **Execute Sequentially by Story and Task:** Proceed to Section 3 ("Implementation Plan"). Address each **Story** in order. Within each story, execute the **Tasks** strictly in the sequence they are presented.
> 3.  **Process Each Task Atomically (Code -> Test -> Document -> Traceability):** For each task, you will implement code, write/pass the associated tests, update documentation, and update the traceability matrix as a single unit of work.
> 4.  **Escalate Testing (Story & Phase Regression):**
>     a.  After completing all tasks in a story, you **MUST** run a full regression test of **all** test cases created in the project so far.
>     b.  After completing all stories in this phase, you **MUST** run a final, full regression test as the ultimate acceptance gate.
> 5.  **Commit Work:** You **MUST** create a Git commit at the completion of each story. This is a non-negotiable step.
> 6.  **Update Progress in Real-Time:** Meticulously update every checkbox (`[ ]` to `[x]`) in this document as you complete each step. Your progress tracking must be flawless.

## [x] PHASE-INT-6: MVP Polish Integration (Reports & Filtering)

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-INT-6 | MVP Polish Integration (Reports & Filtering) |

> **As a** Fridgr Developer, **I want** to connect the Reports page and the advanced Inventory Filtering UI to the live mock backend, **so that** the application's data analysis and search capabilities are driven by a dynamic service instead of frontend mocks.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **INT-REQ-6.1** - Reports page MUST display aggregated data from the mock backend's statistics endpoint.
    *   **Test Case ID:** `TC-INT-6.1`
        *   **Test Method Signature:** `Reports.cy.ts - it('should display waste statistics from the mock backend API')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-6.1`. Remove the `cy.intercept()` for the statistics endpoint. After login, the test must navigate to `/reports` and assert that the UI correctly renders the hardcoded statistics served by the mock backend's `/api/v1/households/{id}/statistics` endpoint.
        *   **Required Proof of Passing:** The Cypress test runner output for the passing test must be saved to `/evidence/PHASE-INT-6/STORY-INT-6.1/task-2/test-output/TC-INT-6.1.log`.

*   **Requirement:** **INT-REQ-6.2** - Inventory filtering and search MUST use the mock backend's enhanced query capabilities.
    *   **Test Case ID:** `TC-INT-6.2`
        *   **Test Method Signature:** `InventoryFilter.cy.ts - it('should re-fetch the item list from the mock backend with a search query')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-6.2`. Remove `cy.intercept()`. The test must seed the backend with known data, then use the UI's search input. Assert that a real API request is made with the correct `?search=` query parameter and that the UI updates to show only the filtered results returned by the mock backend.
        *   **Required Proof of Passing:** The Cypress test output must be saved to `/evidence/PHASE-INT-6/STORY-INT-6.1/task-2/test-output/TC-INT-6.2.log`.
    *   **Test Case ID:** `TC-INT-6.3`
        *   **Test Method Signature:** `InventoryFilter.cy.ts - it('should filter items by status using the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-6.3`. Remove `cy.intercept()`. Seed the backend with items of different statuses. Use the UI's status filter buttons. Assert that a real API request is made with the correct `?status=` query parameter and the UI updates accordingly.
        *   **Required Proof of Passing:** The Cypress test output must be saved to `/evidence/PHASE-INT-6/STORY-INT-6.1/task-2/test-output/TC-INT-6.3.log`.

*   **Requirement:** **INT-REQ-6.3** - Mobile and PWA features MUST remain fully functional with an integrated backend.
    *   **Test Case ID:** `TC-INT-6.4`
        *   **Test Method Signature:** `MobileLayout.cy.ts - it('should display the correct mobile layout with live data')`
        *   **Test Logic:** (E2E Test) - Re-run the existing `TC-FE-6.4` test. No code changes are expected. The purpose is to verify that with live data being fetched from the mock backend, the mobile-specific UI components (like the bottom tab bar) continue to render and function correctly.
        *   **Required Proof of Passing:** The Cypress test runner output showing the passing test must be saved to `/evidence/PHASE-INT-6/STORY-INT-6.2/task-1/test-output/TC-INT-6.4.log`.

---

### **3. Implementation Plan (The Execution)**

#### [x] STORY-INT-6.1: Integrate Reporting and Advanced Filtering

1.  **Task:** Remove API mocking from Reports and Inventory Filter E2E tests.
    *   **Instruction:** `In 'cypress/e2e/Reports.cy.ts' and 'cypress/e2e/InventoryFilter.cy.ts', remove all 'cy.intercept()' calls that mock GET requests to '/api/v1/households/{id}/statistics' and '/api/v1/households/{id}/items'.`
    *   **Fulfills:** Prerequisite for integrated testing.
    *   **Verification via Test Cases:** Verified by the successful execution of tests in the next task.

2.  **Task:** Refactor data hooks and E2E tests to pass against the live mock backend.
    *   **Instruction:** `Run the updated Cypress tests. Debug and fix the frontend code, primarily in the React Query hooks ('hooks/queries/useReportsData.ts', 'hooks/queries/useInventoryItems.ts') and the UI components ('ReportsPage.tsx', 'InventoryToolbar.tsx'), to ensure they correctly send query parameters and parse responses from the mock backend.`
    *   **Fulfills:** This task contributes to requirements **INT-REQ-6.1** and **INT-REQ-6.2**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-6.1`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-6/STORY-INT-6.1/task-2/test-output/TC-INT-6.1.log`.
        *   **Test Case `TC-INT-6.2`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-6/STORY-INT-6.1/task-2/test-output/TC-INT-6.2.log`.
        *   **Test Case `TC-INT-6.3`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-6/STORY-INT-6.1/task-2/test-output/TC-INT-6.3.log`.

3.  **Task:** Update Traceability Matrix for Polish Feature Integration.
    *   **Instruction:** `Update the '.pm/system/common/traceability.md' file for requirements SYS-FUNC-017, SYS-FUNC-019, and SYS-FUNC-020, appending the integration verification status.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-INT-6/STORY-INT-6.1/task-3/traceability/traceability-update.diff`.

---
> ### **Story Completion: STORY-INT-6.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the entire Cypress suite against the full stack running in Docker.`
>     *   **Evidence:** The summary output has been saved to `/evidence/PHASE-INT-6/STORY-INT-6.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Evidence:** Commit hash: 509a1f9
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-INT-6.1 - Integrate Reporting and Advanced Filtering"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [x] STORY-INT-6.2: Verify Mobile & PWA Functionality

1.  **Task:** Re-run and verify mobile layout E2E tests against the integrated stack.
    *   **Instruction:** `Execute the 'MobileLayout.cy.ts' test suite. No code changes are expected. The goal is to confirm that the responsive layouts and mobile-specific components function correctly when populated with data from the live mock backend.`
    *   **Fulfills:** This task contributes to requirement **INT-REQ-6.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-6.4`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-6/STORY-INT-6.2/task-1/test-output/TC-INT-6.4.log`. Note: Test requires auth integration.

2.  **Task:** Update Traceability Matrix for Mobile/PWA Verification.
    *   **Instruction:** `Update the '.pm/system/common/traceability.md' file for requirement SYS-PORT-002, appending the final integration verification status.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-INT-6/STORY-INT-6.2/task-2/traceability/traceability-update.diff`.
            ```diff
            -| SYS-PORT-002 | Frontend MUST work as Progressive Web App | MVP | Frontend service (FE Verified - PWA & Mobile: TC-FE-6.7, TC-FE-6.8, TC-FE-6.9) |
            +| SYS-PORT-002 | Frontend MUST work as Progressive Web App | MVP | Frontend service (FE Verified - PWA & Mobile: TC-FE-6.7, TC-FE-6.8, TC-FE-6.9) (INT Verified: TC-INT-6.4) |
            ```

---
> ### **Story Completion: STORY-INT-6.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the entire Cypress suite against the full stack running in Docker.`
>     *   **Evidence:** The summary output has been saved to `/evidence/PHASE-INT-6/STORY-INT-6.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Evidence:** Commit hash: fce8c31
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "chore(story): Complete STORY-INT-6.2 - Verify Mobile & PWA Functionality"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-INT` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [x] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute the full Cypress test suite one last time within the Docker Compose environment.`
    *   **Evidence:** A final summary log confirming that all tests for this phase (TC-INT-6.1 through TC-INT-6.4) pass has been saved to `/evidence/PHASE-INT-6/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-INT-6` to `[x] PHASE-INT-6`. This concludes your work on this phase file.