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

## [x] PHASE-INT-4: Real-Time Sync & Notifications Integration

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-INT-4 | Real-Time Sync & Notifications Integration |

> **As a** Fridgr Developer, **I want** to connect the frontend's real-time features and notification settings to the live Mock Backend, **so that** the UI reflects data changes from other users instantly and notification preferences are managed by a live service.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **INT-REQ-4.1** - Frontend MUST establish a real WebSocket connection with the mock backend.
    *   **Test Case ID:** `TC-INT-4.1`
        *   **Test Method Signature:** `InventorySync.cy.ts - it('should update an item in the UI when an event is broadcast from the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-4.1`. This test will use two browser contexts or a programmatic API call. 1) A Cypress test runner acts as "User A" viewing the inventory. 2) A script (or another Cypress command) acts as "User B" and makes a real `PATCH` API call to the mock backend to update an item. 3) Assert that the UI for User A updates automatically without a page refresh, as a result of the WebSocket event broadcast by the mock backend.
        *   **Required Proof of Passing:** The Cypress test runner output for the passing test must be saved to `/evidence/PHASE-INT-4/STORY-INT-4.1/task-2/test-output/TC-INT-4.1.log`.

*   **Requirement:** **INT-REQ-4.2** - Notification settings UI MUST be integrated with the mock backend.
    *   **Test Case ID:** `TC-INT-4.2`
        *   **Test Method Signature:** `NotificationSettings.cy.ts - it('should fetch and display settings from the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-4.3` (part 1). Remove the `cy.intercept()` for `GET /settings`. The test must log in, navigate to `/settings/notifications`, and assert that the form fields (e.g., "Expiration Warning Days") are populated with the default values served by the mock backend.
        *   **Required Proof of Passing:** The Cypress test runner output must be saved to `/evidence/PHASE-INT-4/STORY-INT-4.2/task-2/test-output/TC-INT-4.2.log`.
    *   **Test Case ID:** `TC-INT-4.3`
        *   **Test Method Signature:** `NotificationSettings.cy.ts - it('should update settings via the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-4.3` (part 2). Remove the `cy.intercept()` for `PUT /settings`. The test must change a value in the UI (e.g., "Expiration Warning Days" to 5), click save, and trigger a real `PUT` request. A subsequent reload of the page (or re-fetch) should show the value "5" persisted from the mock backend's in-memory store.
        *   **Required Proof of Passing:** The Cypress test runner output must be saved to `/evidence/PHASE-INT-4/STORY-INT-4.2/task-2/test-output/TC-INT-4.3.log`.

*   **Requirement:** **INT-REQ-4.3** - Telegram linking UI MUST be integrated with the mock backend.
    *   **Test Case ID:** `TC-INT-4.4`
        *   **Test Method Signature:** `TelegramLink.cy.ts - it('should link a telegram account via the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-4.4`. Remove the `cy.intercept()` for `POST /telegram/link`. The test must open the Telegram link modal, enter a verification code, and submit the form, triggering a real API call. Assert that the UI shows a success state based on the `200 OK` response from the mock backend.
        *   **Required Proof of Passing:** The Cypress test runner output must be saved to `/evidence/PHASE-INT-4/STORY-INT-4.2/task-2/test-output/TC-INT-4.4.log`.

---

### **3. Implementation Plan (The Execution)**

#### [x] STORY-INT-4.1: Integrate Real-Time WebSocket Communication

1.  **Task:** Refactor frontend WebSocket service and remove test mocks.
    *   **Instruction:** `Update the 'lib/realtime/signalr-service.ts' to correctly connect to the mock backend's socket.io server, ensuring it passes the JWT for authentication. Then, in 'cypress/e2e/InventorySync.cy.ts' and 'cypress/e2e/Notifications.cy.ts', remove all client-side event simulations (e.g., 'win.signalRService.emit(...)'). The tests should now expect events to come only from the server.`
    *   **Fulfills:** Prerequisite for **INT-REQ-4.1**.
    *   **Verification via Test Cases:** Verified by the successful execution of tests in the next task.

2.  **Task:** Refactor real-time tests to validate true end-to-end event broadcasting.
    *   **Instruction:** `Modify the 'InventorySync.cy.ts' test (TC-INT-4.1). Use 'cy.request()' to programmatically make a PATCH call to the mock backend's inventory endpoint, simulating another user's action. The main test body will then assert that the UI, running in the browser, updates in response to the WebSocket event triggered by that API call.`
    *   **Fulfills:** This task contributes to requirement **INT-REQ-4.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-4.1`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-4/STORY-INT-4.1/task-2/test-output/TC-INT-4.1.log`.

3.  **Task:** Update Traceability Matrix for Real-Time Integration.
    *   **Instruction:** `Update '.pm/system/common/traceability.md' for requirement SYS-FUNC-027, appending the integration verification status.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-INT-4/STORY-INT-4.1/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-027 | Real-time updates | MVP | SVC-inventory-FUNC-014 (FE Verified: TC-FE-3.7, TC-FE-4.3) (MBE Verified: TC-MBE-4.3) |
            +| SYS-FUNC-027 | Real-time updates | MVP | SVC-inventory-FUNC-014 (FE Verified: TC-FE-3.7, TC-FE-4.3) (MBE Verified: TC-MBE-4.3) (INT Verified: TC-INT-4.1) |
            ```

---
> ### **Story Completion: STORY-INT-4.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the entire Cypress suite against the full stack running in Docker.`
>     *   **Evidence:** The summary output has been saved to `/evidence/PHASE-INT-4/STORY-INT-4.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-INT-4.1 - Integrate Real-Time WebSocket Communication"'.`
>     *   **Evidence:** Commit hash: d2c59ab
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [x] STORY-INT-4.2: Integrate Notification Settings Endpoints

1.  **Task:** Remove API mocking from notification settings E2E tests.
    *   **Instruction:** `In 'cypress/e2e/NotificationSettings.cy.ts' and 'cypress/e2e/TelegramLink.cy.ts', remove all 'cy.intercept()' calls that mock the '/api/v1/notifications/*' endpoints.`
    *   **Fulfills:** Prerequisite for **INT-REQ-4.2** and **INT-REQ-4.3**.
    *   **Verification via Test Cases:** Verified by the successful execution of tests in the next task.

2.  **Task:** Refactor notification hooks and tests to pass against the live mock backend.
    *   **Instruction:** `Run the updated Cypress tests for notification settings. Debug and fix the frontend code, primarily in the React Query hooks ('hooks/queries/useNotificationSettings.ts', 'hooks/mutations/useUpdateNotificationSettings.ts', 'hooks/mutations/useLinkTelegram.ts'), to correctly fetch, display, and update data against the running mock backend.`
    *   **Fulfills:** This task contributes to requirements **INT-REQ-4.2** and **INT-REQ-4.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-4.2`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-4/STORY-INT-4.2/task-2/test-output/TC-INT-4.2-4.3.log`.
        *   **Test Case `TC-INT-4.3`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-4/STORY-INT-4.2/task-2/test-output/TC-INT-4.2-4.3.log`.
        *   **Test Case `TC-INT-4.4`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-4/STORY-INT-4.2/task-2/test-output/TC-INT-4.4.log`.

3.  **Task:** Update Traceability Matrix for Notification Settings Integration.
    *   **Instruction:** `Update the '.pm/system/common/traceability.md' file for requirements SYS-FUNC-019 and SYS-FUNC-023, appending the integration verification status.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-INT-4/STORY-INT-4.2/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-019 | Customize warning period | MVP | SVC-notifications-FUNC-004 (FE Verified - Search: TC-FE-6.4) (MBE Verified: TC-MBE-4.5, TC-MBE-6.2) |
            +| SYS-FUNC-019 | Customize warning period | MVP | SVC-notifications-FUNC-004 (FE Verified - Search: TC-FE-6.4) (MBE Verified: TC-MBE-4.5, TC-MBE-6.2) (INT Verified: TC-INT-4.3) |
            -| SYS-FUNC-023 | Link Telegram accounts | MVP | SVC-notifications-FUNC-008 (FE Verified: TC-FE-4.4, TC-FE-7.4) (MBE Verified: TC-MBE-4.6) |
            +| SYS-FUNC-023 | Link Telegram accounts | MVP | SVC-notifications-FUNC-008 (FE Verified: TC-FE-4.4, TC-FE-7.4) (MBE Verified: TC-MBE-4.6) (INT Verified: TC-INT-4.4) |
            ```

---
> ### **Story Completion: STORY-INT-4.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the entire Cypress suite against the full stack running in Docker.`
>     *   **Evidence:** The summary output has been saved to `/evidence/PHASE-INT-4/STORY-INT-4.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-INT-4.2 - Integrate Notification Settings Endpoints"'.`
>     *   **Evidence:** Commit hash: 8edc7a4
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-INT` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [x] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute the full Cypress test suite one last time within the Docker Compose environment.`
    *   **Evidence:** A final summary log confirming that all tests for this phase (TC-INT-4.1 through TC-INT-4.4) pass has been saved to `/evidence/PHASE-INT-4/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-INT-4` to `[x] PHASE-INT-4`. This concludes your work on this phase file.