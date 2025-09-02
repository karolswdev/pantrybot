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

## [ ] PHASE-MBE-5: Collaborative Shopping Lists Endpoints

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-MBE-5 | Collaborative Shopping Lists Endpoints |

> **As a** Fridgr Frontend Engineer, **I want** a mock back-end that provides a full suite of endpoints and real-time events for managing shared shopping lists, **so that** I can build and test the collaborative shopping list features.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **MBE-REQ-5.1** - System MUST implement endpoints for listing and creating shopping lists (`SYS-FUNC-024`).
    *   **Test Case ID:** `TC-MBE-5.1`
        *   **Test Method Signature:** `ShoppingListEndpoints - ListLists_ReturnsHouseholdLists`
        *   **Test Logic:** (API Test) - Send a `GET` request to `/api/v1/households/{householdId}/shopping-lists` with a valid Bearer token. Assert the HTTP status is `200 OK` and the response contains an array of shopping lists for that household.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.1/task-2/test-output/TC-MBE-5.1.log`.
    *   **Test Case ID:** `TC-MBE-5.2`
        *   **Test Method Signature:** `ShoppingListEndpoints - CreateList_ReturnsNewList`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/households/{householdId}/shopping-lists` with a valid Bearer token and a JSON body containing a `name`. Assert the HTTP status is `201 Created` and the response contains the new list's details.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.1/task-2/test-output/TC-MBE-5.2.log`.

*   **Requirement:** **MBE-REQ-5.2** - System MUST implement endpoints for managing items within a shopping list.
    *   **Test Case ID:** `TC-MBE-5.3`
        *   **Test Method Signature:** `ShoppingListItemEndpoints - AddItem_ReturnsNewItem`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/households/{householdId}/shopping-lists/{listId}/items` with a valid Bearer token and a JSON body containing the item's `name`. Assert the HTTP status is `201 Created`.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-1/test-output/TC-MBE-5.3.log`.
    *   **Test Case ID:** `TC-MBE-5.4`
        *   **Test Method Signature:** `ShoppingListItemEndpoints - UpdateItem_TogglesCompletedStatus`
        *   **Test Logic:** (API Test) - Send a `PATCH` request to `/api/v1/households/{householdId}/shopping-lists/{listId}/items/{itemId}` with a valid Bearer token and a body `{"completed": true}`. Assert the HTTP status is `200 OK`. Verify the item's completed status is updated in the mock DB.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-1/test-output/TC-MBE-5.4.log`.

*   **Requirement:** **MBE-REQ-5.3** - System MUST broadcast shopping list changes via WebSockets (`SYS-FUNC-025`).
    *   **Test Case ID:** `TC-MBE-5.5`
        *   **Test Method Signature:** `WebSocket - ShoppingListItemAdd_TriggersBroadcast`
        *   **Test Logic:** (Integration Test) - Connect two WebSocket clients (A, B) to the same household. Have Client A send a `POST` request to add an item to a shopping list. Assert that Client B receives a `shoppinglist.item.added` event with the correct payload.
        *   **Required Proof of Passing:** Logs showing Client B receiving the event must be saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-2/test-output/TC-MBE-5.5.log`.
    *   **Test Case ID:** `TC-MBE-5.6`
        *   **Test Method Signature:** `WebSocket - ShoppingListItemUpdate_TriggersBroadcast`
        *   **Test Logic:** (Integration Test) - With the same setup, have Client A send a `PATCH` request to update an item (e.g., mark as complete). Assert that Client B receives a `shoppinglist.item.updated` event with the correct payload.
        *   **Required Proof of Passing:** Logs showing Client B receiving the event must be saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-2/test-output/TC-MBE-5.6.log`.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-MBE-5.1: Shopping List Management

1.  **Task:** Update in-memory DB to support shopping lists.
    *   **Instruction:** `Update 'db.js' by adding two new in-memory arrays: 'shoppingLists' and 'shoppingListItems'. Define and comment on the mock schema for these, including fields like id, householdId, name, completed, addedBy, etc.`
    *   **Fulfills:** Prerequisite for all shopping list features.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** The updated `db.js` content has been saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.1/task-1/documentation/db.js`.

2.  **Task:** Implement `GET /shopping-lists` and `POST /shopping-lists`.
    *   **Instruction:** `Create a new 'shoppingListRoutes.js' file.
        1.  **GET /**: Implement logic to retrieve all shopping lists associated with the `householdId` from the URL.
        2.  **POST /**: Implement logic to create a new shopping list for the given household, linking it to the authenticated user as the creator.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-5.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-5.1`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.1/task-2/test-output/TC-MBE-5.1.log`.
        *   **Test Case `TC-MBE-5.2`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.1/task-2/test-output/TC-MBE-5.2.log`.

3.  **Task:** Update Documentation and Traceability Matrix.
    *   **Instruction:** `Update 'mock-backend/README.md' to document the new endpoints for creating and listing shopping lists. Then, update 'system/common/traceability.md' for requirement SYS-FUNC-024 with the 'MBE Verified' status.`
    *   **Fulfills:** Documentation and traceability requirements.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** A diff of the `mock-backend/README.md` has been saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.1/task-3/documentation/readme-update.diff`.
    *   **Traceability:**
        *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.1/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-024 | Shared shopping lists | MVP | SVC-inventory-FUNC-011 (FE Verified: TC-FE-5.1, TC-FE-5.2) |
            +| SYS-FUNC-024 | Shared shopping lists | MVP | SVC-inventory-FUNC-011 (FE Verified: TC-FE-5.1, TC-FE-5.2) (MBE Verified: TC-MBE-5.1, TC-MBE-5.2) |
            ```

---
> ### **Story Completion: STORY-MBE-5.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API and WebSocket tests from previous phases (TC-MBE-1.1 through TC-MBE-4.6) and the new tests for this story (TC-MBE-5.1, TC-MBE-5.2).`
>     *   **Evidence:** A summary log confirming all 27 test cases have passed has been saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-5.1 - Shopping List Management"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-MBE-5.2: Shopping List Item Management & Real-time Sync

1.  **Task:** Implement `POST /items` and `PATCH /items/{itemId}` on a shopping list.
    *   **Instruction:** `In 'shoppingListRoutes.js', add handlers for adding and updating items within a specific list.
        1.  **POST /{listId}/items**: Create a new item and associate it with the `listId`.
        2.  **PATCH /{listId}/items/{itemId}**: Find the specified item and update its properties (e.g., 'completed' status).`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-5.2**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-5.3`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-1/test-output/TC-MBE-5.3.log`.
        *   **Test Case `TC-MBE-5.4`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-1/test-output/TC-MBE-5.4.log`.

2.  **Task:** Integrate WebSocket broadcasting for shopping list item changes.
    *   **Instruction:** `Pass the socket.io server instance to the shopping list router. Modify the new POST and PATCH item handlers to emit 'shoppinglist.item.added' and 'shoppinglist.item.updated' events to the appropriate household room after the DB is updated.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-5.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-5.5`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-2/test-output/TC-MBE-5.5.log`.
        *   **Test Case `TC-MBE-5.6`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-2/test-output/TC-MBE-5.6.log`.

3.  **Task:** Update Documentation and Traceability Matrix.
    *   **Instruction:** `Update 'mock-backend/README.md' to document the new item management endpoints for shopping lists. Then, update 'system/common/traceability.md' for requirement SYS-FUNC-025 with the 'MBE Verified' status.`
    *   **Fulfills:** Documentation and traceability requirements.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** A diff of the `mock-backend/README.md` has been saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-3/documentation/readme-update.diff`.
    *   **Traceability:**
        *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-025 | Real-time shopping list sync | MVP | SVC-inventory-FUNC-012 (FE Verified: TC-FE-5.3, TC-FE-5.5, TC-FE-7.5) |
            +| SYS-FUNC-025 | Real-time shopping list sync | MVP | SVC-inventory-FUNC-012 (FE Verified: TC-FE-5.3, TC-FE-5.5, TC-FE-7.5) (MBE Verified: TC-MBE-5.5, TC-MBE-5.6) |
            ```

---
> ### **Story Completion: STORY-MBE-5.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API and WebSocket tests from all previous phases and the current story (TC-MBE-1.1 through TC-MBE-5.6).`
>     *   **Evidence:** A summary log confirming all 31 test cases have passed has been saved to `/evidence/PHASE-MBE-5/STORY-MBE-5.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-5.2 - Shopping List Item Management & Real-time Sync"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-MBE` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [ ] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute all API and WebSocket test cases (TC-MBE-1.1 through TC-MBE-5.6) one last time to ensure full functionality.`
    *   **Evidence:** A final summary log confirming that all 31 test cases pass has been saved to `/evidence/PHASE-MBE-5/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-MBE-5` to `[x] PHASE-MBE-5`. This concludes your work on this phase file.