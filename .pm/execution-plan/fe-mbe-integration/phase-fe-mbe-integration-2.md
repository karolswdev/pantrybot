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

## [x] PHASE-INT-2: Dashboard & Household Management Integration

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-INT-2 | Dashboard & Household Management Integration |

> **As a** Fridgr Developer, **I want** to connect the Dashboard and Household Management UIs to the live Mock Backend, **so that** users can see real-time (mocked) household data and manage their households without relying on frontend mocks.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **INT-REQ-2.1** - Dashboard UI MUST display data fetched from the mock backend.
    *   **Test Case ID:** `TC-INT-2.1`
        *   **Test Method Signature:** `Dashboard.cy.ts - it('should display summary statistics from the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-2.5`. Remove the `cy.intercept()` for `/api/v1/households/{id}`. The test must log in, navigate to `/dashboard`, and trigger a real HTTP request. Assert that the statistic cards in the UI display the hardcoded values returned by the mock backend's statistics object.
        *   **Required Proof of Passing:** The Cypress test runner output for the passing test must be saved to `/evidence/PHASE-INT-2/STORY-INT-2.1/task-2/test-output/TC-INT-2.1.log`.

*   **Requirement:** **INT-REQ-2.2** - Household management UI MUST use the mock backend for data and actions.
    *   **Test Case ID:** `TC-INT-2.2`
        *   **Test Method Signature:** `HouseholdSwitcher.cy.ts - it('should list households from the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-2.1`. Remove the `cy.intercept()` for `/api/v1/households`. After login, the test must click the household switcher and assert that the dropdown is populated with the exact list of households provided by the mock backend for that user.
        *   **Required Proof of Passing:** The Cypress test runner output must be saved to `/evidence/PHASE-INT-2/STORY-INT-2.1/task-2/test-output/TC-INT-2.2.log`.
    *   **Test Case ID:** `TC-INT-2.3`
        *   **Test Method Signature:** `CreateHousehold.cy.ts - it('should create a new household via the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-2.2`. Remove the `cy.intercept()` for `POST /api/v1/households`. The test must trigger the "Create Household" UI, submit the form, and assert that the UI shows a success state after the mock backend returns a `201 Created` response.
        *   **Required Proof of Passing:** The Cypress test runner output must be saved to `/evidence/PHASE-INT-2/STORY-INT-2.2/task-2/test-output/TC-INT-2.3.log`.
    *   **Test Case ID:** `TC-INT-2.4`
        *   **Test Method Signature:** `InviteMember.cy.ts - it('should send a member invitation via the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-2.4`. Remove the `cy.intercept()` for `POST /api/v1/households/{id}/members`. The test must, as an admin user, open the invite modal, submit a valid email, and assert that the UI shows a success state after the mock backend returns a `201 Created` response.
        *   **Required Proof of Passing:** The Cypress test runner output must be saved to `/evidence/PHASE-INT-2/STORY-INT-2.2/task-2/test-output/TC-INT-2.4.log`.

---

### **3. Implementation Plan (The Execution)**

#### [x] STORY-INT-2.1: Integrate Dashboard & Household Data Fetching

1.  **Task:** Remove API mocking from data fetching E2E tests.
    *   **Instruction:** `In the following Cypress test files, remove all 'cy.intercept()' calls that mock GET requests to '/api/v1/households' and '/api/v1/households/{id}':
        - 'cypress/e2e/Dashboard.cy.ts'
        - 'cypress/e2e/HouseholdSwitcher.cy.ts'`
    *   **Fulfills:** Prerequisite for integrated testing.
    *   **Verification via Test Cases:** Verified by the successful execution of tests in the next task.

2.  **Task:** Refactor data fetching hooks and E2E tests to pass against the mock backend.
    *   **Instruction:** `Run the updated Cypress tests. Debug and fix the frontend code, primarily in the React Query hooks ('hooks/queries/useHouseholdData.ts', 'hooks/queries/useHouseholds.ts') and the components themselves ('Dashboard.tsx', 'HouseholdSwitcher.tsx'), to correctly fetch and display data from the running mock backend.`
    *   **Fulfills:** This task contributes to requirements **INT-REQ-2.1** and **INT-REQ-2.2**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-2.1`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-2/STORY-INT-2.1/task-2/test-output/TC-INT-2.1.log`.
        *   **Test Case `TC-INT-2.2`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-2/STORY-INT-2.1/task-2/test-output/TC-INT-2.2.log`.

3.  **Task:** Update Traceability Matrix for Data Fetching Integration.
    *   **Instruction:** `Update the '.pm/system/common/traceability.md' file. For requirement SYS-FUNC-006, append the integration verification status.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-INT-2/STORY-INT-2.1/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-006 | Users belong to multiple households | MVP | SVC-users-FUNC-006 (MBE Verified: TC-MBE-2.2) |
            +| SYS-FUNC-006 | Users belong to multiple households | MVP | SVC-users-FUNC-006 (MBE Verified: TC-MBE-2.2) (INT Verified: TC-INT-2.2) |
            ```

---
> ### **Story Completion: STORY-INT-2.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the entire Cypress suite against the full stack running in Docker. Pay close attention to the auth tests from Phase 1 and the new dashboard/switcher tests.`
>     *   **Evidence:** The summary output has been saved to `/evidence/PHASE-INT-2/STORY-INT-2.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Evidence:** Commit hash: 9bef0ce
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-INT-2.1 - Integrate Dashboard & Household Data Fetching"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [x] STORY-INT-2.2: Integrate Household Creation & Member Invitation

1.  **Task:** Remove API mocking from data mutation E2E tests.
    *   **Instruction:** `In the following Cypress test files, remove all 'cy.intercept()' calls that mock POST requests to household and member endpoints:
        - 'cypress/e2e/CreateHousehold.cy.ts'
        - 'cypress/e2e/InviteMember.cy.ts'`
    *   **Fulfills:** Prerequisite for integrated testing.
    *   **Verification via Test Cases:** Verified by the successful execution of tests in the next task.

2.  **Task:** Refactor mutation hooks and E2E tests to pass against the mock backend.
    *   **Instruction:** `Run the updated Cypress tests. Debug and fix the frontend code, primarily in the React Query mutation hooks ('hooks/mutations/useHouseholdMutations.ts') and the relevant UI components, to correctly send data to and handle responses from the mock backend.`
    *   **Fulfills:** This task contributes to requirement **INT-REQ-2.2**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-2.3`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-2/STORY-INT-2.2/task-2/test-output/TC-INT-2.3.log`.
        *   **Test Case `TC-INT-2.4`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-2/STORY-INT-2.2/task-2/test-output/TC-INT-2.4.log`.

3.  **Task:** Update Traceability Matrix for Data Mutation Integration.
    *   **Instruction:** `Update the '.pm/system/common/traceability.md' file. For requirements SYS-FUNC-005 and SYS-FUNC-008, append the integration verification status.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-INT-2/STORY-INT-2.2/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-005 | Create multiple households | MVP | SVC-users-FUNC-005 (MBE Verified: TC-MBE-2.3) |
            +| SYS-FUNC-005 | Create multiple households | MVP | SVC-users-FUNC-005 (MBE Verified: TC-MBE-2.3) (INT Verified: TC-INT-2.3) |
            -| SYS-FUNC-008 | Invite members via email | MVP | SVC-users-FUNC-008, SVC-notifications-FUNC-002 (MBE Verified: TC-MBE-2.5, TC-MBE-2.6) |
            +| SYS-FUNC-008 | Invite members via email | MVP | SVC-users-FUNC-008, SVC-notifications-FUNC-002 (MBE Verified: TC-MBE-2.5, TC-MBE-2.6) (INT Verified: TC-INT-2.4) |
            ```

---
> ### **Story Completion: STORY-INT-2.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the entire Cypress suite against the full stack running in Docker.`
>     *   **Evidence:** The summary output has been saved to `/evidence/PHASE-INT-2/STORY-INT-2.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Evidence:** Commit hash: 8e69818
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-INT-2.2 - Integrate Household Creation & Member Invitation"'.`
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
    *   **Evidence:** A final summary log confirming that all tests for this phase (TC-INT-2.1 through TC-INT-2.4) pass has been saved to `/evidence/PHASE-INT-2/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-INT-2` to `[x] PHASE-INT-2`. This concludes your work on this phase file.