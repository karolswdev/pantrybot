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

## [ ] PHASE-MBE-6: Reporting & Advanced Filtering Endpoints

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-MBE-6 | Reporting & Advanced Filtering Endpoints |

> **As a** Fridgr Frontend Engineer, **I want** a mock back-end that provides an endpoint for aggregated statistics and supports advanced filtering on the inventory list, **so that** I can build and test the reports page and the inventory search/filter toolbar.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **MBE-REQ-6.1** - System MUST provide an endpoint for aggregated household statistics (`SYS-FUNC-017`).
    *   **Test Case ID:** `TC-MBE-6.1`
        *   **Test Method Signature:** `StatisticsEndpoints - GetStatistics_ReturnsAggregatedData`
        *   **Test Logic:** (API Test) - Send a `GET` request to `/api/v1/households/{householdId}/statistics` with a valid Bearer token. Assert the HTTP status is `200 OK`. Assert the response body contains a `statistics` object with keys like `totalItems`, `expiringItems`, and `wastedThisMonth`, matching the shape in `api-specifications.md`.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/task-1/test-output/TC-MBE-6.1.log`.

*   **Requirement:** **MBE-REQ-6.2** - System MUST enhance the List Items endpoint to support advanced filtering (`SYS-FUNC-019`, `SYS-FUNC-020`).
    *   **Test Case ID:** `TC-MBE-6.2`
        *   **Test Method Signature:** `InventoryEndpoints - ListItems_WithSearchQuery_ReturnsFilteredResults`
        *   **Test Logic:** (API Test) - Seed the mock DB with several items (e.g., "Milk", "Almond Milk", "Cheese"). Send a `GET` request to `/api/v1/households/{householdId}/items?search=Milk`. Assert the HTTP status is `200 OK` and the response array only contains items whose names include "Milk".
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/task-2/test-output/TC-MBE-6.2.log`.
    *   **Test Case ID:** `TC-MBE-6.3`
        *   **Test Method Signature:** `InventoryEndpoints - ListItems_WithStatusQuery_ReturnsFilteredResults`
        *   **Test Logic:** (API Test) - Seed the mock DB with items in various expiration states. Send a `GET` request to `/api/v1/households/{householdId}/items?status=expiring_soon`. Assert the HTTP status is `200 OK` and the response array only contains items with the "expiring_soon" status.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/task-2/test-output/TC-MBE-6.3.log`.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-MBE-6.1: Implement Data Aggregation and Filtering

1.  **Task:** Implement the `GET /households/{householdId}/statistics` endpoint.
    *   **Instruction:** `In 'householdRoutes.js', add a new endpoint at '/{householdId}/statistics'. The handler should be protected by the authentication middleware. It should calculate mock statistics by iterating over the in-memory 'inventoryItems' and 'itemHistory' arrays for the given householdId. Return a 200 OK with a JSON object that matches the `statistics` object shape in the `Get Household Details` response in 'api-specifications.md'.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-6.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-6.1`:**
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** The `curl` command and response have been saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/task-1/test-output/TC-MBE-6.1.log`.

2.  **Task:** Enhance the `GET /households/{householdId}/items` endpoint.
    *   **Instruction:** `In 'inventoryRoutes.js', modify the handler for listing items. Add logic to check for 'search' and 'status' query parameters from 'req.query'. If present, apply the appropriate filtering logic to the in-memory 'inventoryItems' array before sending the response. The 'search' should be case-insensitive and match against the item name. The 'status' filter should match the 'expirationStatus' field you mocked in Phase 3.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-6.2**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-6.2`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/task-2/test-output/TC-MBE-6.2.log`.
        *   **Test Case `TC-MBE-6.3`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/task-2/test-output/TC-MBE-6.3.log`.

3.  **Task:** Update Documentation and Traceability Matrix.
    *   **Instruction:** `First, update 'mock-backend/README.md'. Document the new statistics endpoint. Enhance the documentation for the 'GET /items' endpoint to include the new optional query parameters ('search', 'status'). Second, update 'system/common/traceability.md' for requirements SYS-FUNC-017, SYS-FUNC-019, and SYS-FUNC-020 with the 'MBE Verified' status.`
    *   **Fulfills:** Documentation and traceability requirements.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** A diff of the `mock-backend/README.md` file has been saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/task-3/documentation/readme-update.diff`.
    *   **Traceability:**
        *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-017 | Categorize items | MVP | SVC-inventory-FUNC-009 (FE Verified - Reports: TC-FE-6.1, TC-FE-7.8) |
            +| SYS-FUNC-017 | Categorize items | MVP | SVC-inventory-FUNC-009 (FE Verified - Reports: TC-FE-6.1, TC-FE-7.8) (MBE Verified: TC-MBE-6.1) |
            -| SYS-FUNC-019 | Customize warning period | MVP | SVC-notifications-FUNC-004 (FE Verified - Search: TC-FE-6.4) (MBE Verified: TC-MBE-4.5) |
            +| SYS-FUNC-019 | Customize warning period | MVP | SVC-notifications-FUNC-004 (FE Verified - Search: TC-FE-6.4) (MBE Verified: TC-MBE-4.5, TC-MBE-6.2) |
            -| SYS-FUNC-020 | Email notifications | MVP | SVC-notifications-FUNC-005 (FE Verified - Filter: TC-FE-6.5, TC-FE-6.6) |
            +| SYS-FUNC-020 | Email notifications | MVP | SVC-notifications-FUNC-005 (FE Verified - Filter: TC-FE-6.5, TC-FE-6.6) (MBE Verified: TC-MBE-6.3) |
            ```

---
> ### **Story Completion: STORY-MBE-6.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API and WebSocket tests from all previous phases (TC-MBE-1.1 through TC-MBE-5.6) and the new tests for this story (TC-MBE-6.1 through TC-MBE-6.3).`
>     *   **Evidence:** A summary log confirming all 34 test cases have passed has been saved to `/evidence/PHASE-MBE-6/STORY-MBE-6.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-6.1 - Implement Data Aggregation and Filtering"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-MBE` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [ ] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute all API and WebSocket test cases (TC-MBE-1.1 through TC-MBE-6.3) one last time to ensure full functionality.`
    *   **Evidence:** A final summary log confirming that all 34 test cases pass has been saved to `/evidence/PHASE-MBE-6/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-MBE-6` to `[x] PHASE-MBE-6`. This concludes your work on this phase file.