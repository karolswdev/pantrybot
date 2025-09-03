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

## [ ] PHASE-INT-5: Collaborative Shopping Lists Integration

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-INT-5 | Collaborative Shopping Lists Integration |

> **As a** Fridgr Developer, **I want** to connect the Shopping List UI to the mock backend's API and WebSocket hub, **so that** users can create, manage, and collaborate on shared shopping lists with real-time updates.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **INT-REQ-5.1** - Shopping list management MUST be integrated with the mock backend.
    *   **Test Case ID:** `TC-INT-5.1`
        *   **Test Method Signature:** `ShoppingLists.cy.ts - it('should display shopping lists from the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-5.1`. Remove `cy.intercept()`. After login, seed the mock backend with shopping lists using a setup script. Navigate to `/shopping` and assert the UI displays the lists from the backend.
        *   **Required Proof of Passing:** The Cypress test output must be saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.1.log`.
    *   **Test Case ID:** `TC-INT-5.2`
        *   **Test Method Signature:** `ShoppingLists.cy.ts - it('should create a new shopping list via the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-5.2`. Remove `cy.intercept()`. The test must use the UI to create a new list, triggering a real `POST` request, and assert the new list appears after a successful response.
        *   **Required Proof of Passing:** The Cypress test output must be saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.2.log`.

*   **Requirement:** **INT-REQ-5.2** - Shopping list item management MUST be integrated with the mock backend.
    *   **Test Case ID:** `TC-INT-5.3`
        *   **Test Method Signature:** `ShoppingListDetail.cy.ts - it('should add an item to the list via the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-5.4`. Remove `cy.intercept()`. On a shopping list detail page, use the UI to add an item, triggering a real `POST` request, and assert the item appears in the "To Buy" list.
        *   **Required Proof of Passing:** The Cypress test output must be saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.3.log`.
    *   **Test Case ID:** `TC-INT-5.4`
        *   **Test Method Signature:** `ShoppingListDetail.cy.ts - it('should check and uncheck an item via the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-5.5`. Remove `cy.intercept()`. Use the UI to check an item, triggering a `PATCH` request. Assert the item moves to the "Bought" section. Then, uncheck it and assert it moves back.
        *   **Required Proof of Passing:** The Cypress test output must be saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.4.log`.

*   **Requirement:** **INT-REQ-5.3** - Real-time synchronization for shopping lists MUST be integrated.
    *   **Test Case ID:** `TC-INT-5.5`
        *   **Test Method Signature:** `ShoppingListDetail.cy.ts - it('should update the list when a WebSocket event is received from the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-5.3`. Use `cy.request()` to programmatically add an item to a shopping list (simulating another user). Assert that the UI on the main test browser receives a `shoppinglist.item.added` event and updates instantly.
        *   **Required Proof of Passing:** The Cypress test output must be saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.5.log`.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-INT-5.1: Integrate All Shopping List Features

1.  **Task:** Remove API mocking from all shopping list E2E tests.
    *   **Instruction:** `Go through 'cypress/e2e/ShoppingLists.cy.ts' and 'cypress/e2e/ShoppingListDetail.cy.ts'. Remove all 'cy.intercept()' calls that mock the '/api/v1/households/{householdId}/shopping-lists*' endpoints. Also, remove any client-side WebSocket event simulations for shopping lists.`
    *   **Fulfills:** Prerequisite for all integrated testing in this phase.
    *   **Verification via Test Cases:** Verified by the successful execution of tests in the next task.

2.  **Task:** Refactor shopping list hooks and tests to pass against the live mock backend.
    *   **Instruction:** `Run the updated Cypress tests for shopping lists. Debug and fix the frontend code, primarily in the React Query hooks (e.g., 'useShoppingLists', 'useAddShoppingListItem') and the UI components, until all shopping list E2E tests pass against the mock backend. This includes both REST API interactions and WebSocket event handling.`
    *   **Fulfills:** This task contributes to requirements **INT-REQ-5.1**, **INT-REQ-5.2**, and **INT-REQ-5.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-5.1`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.1.log`.
        *   **Test Case `TC-INT-5.2`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.2.log`.
        *   **Test Case `TC-INT-5.3`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.3.log`.
        *   **Test Case `TC-INT-5.4`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.4.log`.
        *   **Test Case `TC-INT-5.5`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-2/test-output/TC-INT-5.5.log`.

3.  **Task:** Update Traceability Matrix for Shopping List Integration.
    *   **Instruction:** `Update the '.pm/system/common/traceability.md' file for requirements SYS-FUNC-024 and SYS-FUNC-025, appending the integration verification status.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-024 | Shared shopping lists | MVP | SVC-inventory-FUNC-011 (FE Verified: TC-FE-5.1, TC-FE-5.2) (MBE Verified: TC-MBE-5.1, TC-MBE-5.2) |
            +| SYS-FUNC-024 | Shared shopping lists | MVP | SVC-inventory-FUNC-011 (FE Verified: TC-FE-5.1, TC-FE-5.2) (MBE Verified: TC-MBE-5.1, TC-MBE-5.2) (INT Verified: TC-INT-5.1, TC-INT-5.2) |
            -| SYS-FUNC-025 | Real-time shopping list sync | MVP | SVC-inventory-FUNC-012 (FE Verified: TC-FE-5.3, TC-FE-5.5, TC-FE-7.5) (MBE Verified: TC-MBE-5.5, TC-MBE-5.6) |
            +| SYS-FUNC-025 | Real-time shopping list sync | MVP | SVC-inventory-FUNC-012 (FE Verified: TC-FE-5.3, TC-FE-5.5, TC-FE-7.5) (MBE Verified: TC-MBE-5.5, TC-MBE-5.6) (INT Verified: TC-INT-5.5) |
            ```

---
> ### **Story Completion: STORY-INT-5.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the entire Cypress suite against the full stack running in Docker.`
>     *   **Evidence:** A summary of the Cypress run, confirming that all integrated tests up to this phase are passing, has been saved to `/evidence/PHASE-INT-5/STORY-INT-5.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-INT-5.1 - Integrate All Shopping List Features"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-INT` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [ ] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute the full Cypress test suite one last time within the Docker Compose environment.`
    *   **Evidence:** A final summary log confirming that all tests for this phase (TC-INT-5.1 through TC-INT-5.5) pass has been saved to `/evidence/PHASE-INT-5/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-INT-5` to `[x] PHASE-INT-5`. This concludes your work on this phase file.