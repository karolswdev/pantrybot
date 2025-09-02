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

## [x] PHASE-MBE-3: Core Inventory Management (CRUD) Endpoints

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-MBE-3 | Core Inventory Management (CRUD) Endpoints |

> **As a** Fridgr Frontend Engineer, **I want** mock back-end endpoints for inventory item CRUD operations, **so that** I can implement and test the core functionality of adding, viewing, editing, and deleting inventory items.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **MBE-REQ-3.1** - Inventory endpoints MUST be protected and require authentication.
    *   **Test Case ID:** `TC-MBE-3.1`
        *   **Test Method Signature:** `AuthMiddleware - AccessInventoryEndpoint_WithoutToken_Returns401`
        *   **Test Logic:** (API Test) - Send a `GET` request to `/api/v1/households/{householdId}/items` without an `Authorization` header. Assert the HTTP status is `401 Unauthorized`.
        *   **Required Proof of Passing:** The `curl` command and its response must be saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-1/test-output/TC-MBE-3.1.log`.

*   **Requirement:** **MBE-REQ-3.2** - System MUST implement the List Items endpoint (`SYS-FUNC-010`, `SYS-FUNC-016`).
    *   **Test Case ID:** `TC-MBE-3.2`
        *   **Test Method Signature:** `InventoryEndpoints - ListItems_WithValidTokenAndHousehold_Returns200AndItems`
        *   **Test Logic:** (API Test) - After registering a user and creating a household, send a `GET` request to `/api/v1/households/{householdId}/items` with a valid Bearer token. Seed the in-memory DB with a few items for the household. Assert the HTTP status is `200 OK`. Assert the response body contains an array of items matching the `ItemResponse` DTO, including `daysUntilExpiration` and `expirationStatus`.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-2/test-output/TC-MBE-3.2.log`.

*   **Requirement:** **MBE-REQ-3.3** - System MUST implement the Add Item endpoint (`SYS-FUNC-010`).
    *   **Test Case ID:** `TC-MBE-3.3`
        *   **Test Method Signature:** `InventoryEndpoints - AddItem_WithValidData_Returns201AndItem`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/households/{householdId}/items` with a valid Bearer token and a `CreateItemRequest` body. Assert the HTTP status is `201 Created`. Assert the response body contains the newly created item's details, matching the `ItemResponse` DTO.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-2/test-output/TC-MBE-3.3.log`.

*   **Requirement:** **MBE-REQ-3.4** - System MUST implement the Edit Item endpoint with optimistic concurrency (`SYS-FUNC-012`, `SYS-FUNC-028`).
    *   **Test Case ID:** `TC-MBE-3.4`
        *   **Test Method Signature:** `InventoryEndpoints - UpdateItem_WithValidDataAndCorrectETag_Returns200`
        *   **Test Logic:** (API Test) - First, `GET` an item to retrieve its ETag (simulated by a `rowVersion` or similar identifier in the mock response). Then, send a `PATCH` request to `/api/v1/households/{householdId}/items/{itemId}` with the correct `If-Match` header and updated item data. Assert the HTTP status is `200 OK`.
        *   **Required Proof of Passing:** The `curl` commands for `GET` and `PATCH`, along with the responses, must be saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.2/task-1/test-output/TC-MBE-3.4.log`.
    *   **Test Case ID:** `TC-MBE-3.5`
        *   **Test Method Signature:** `InventoryEndpoints - UpdateItem_WithStaleETag_Returns409Conflict`
        *   **Test Logic:** (API Test) - Send a `PATCH` request to `/api/v1/households/{householdId}/items/{itemId}` with an invalid or stale `If-Match` header. Assert the HTTP status is `409 Conflict`.
        *   **Required Proof of Passing:** The `curl` command and its response must be saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.2/task-1/test-output/TC-MBE-3.5.log`.

*   **Requirement:** **MBE-REQ-3.5** - System MUST implement Consume and Waste endpoints (`SYS-FUNC-013`, `SYS-FUNC-014`).
    *   **Test Case ID:** `TC-MBE-3.6`
        *   **Test Method Signature:** `InventoryEndpoints - ConsumeItem_WithValidQuantity_Returns200`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/households/{householdId}/items/{itemId}/consume` with a valid Bearer token and a `ConsumeItemRequest` body. Assert the HTTP status is `200 OK`. Verify the item's quantity in the mock DB is updated.
        *   **Required Proof of Passing:** The `curl` command and its response must be saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.3/task-1/test-output/TC-MBE-3.6.log`.
    *   **Test Case ID:** `TC-MBE-3.7`
        *   **Test Method Signature:** `InventoryEndpoints - WasteItem_WithValidQuantityAndReason_Returns200`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/households/{householdId}/items/{itemId}/waste` with a valid Bearer token, quantity, and reason. Assert the HTTP status is `200 OK`. Verify the item's quantity is updated (or removed) in the mock DB and waste stats are incremented.
        *   **Required Proof of Passing:** The `curl` command and its response must be saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.3/task-1/test-output/TC-MBE-3.7.log`.

*   **Requirement:** **MBE-REQ-3.6** - System MUST implement the Delete Item endpoint (`SYS-FUNC-012`).
    *   **Test Case ID:** `TC-MBE-3.8`
        *   **Test Method Signature:** `InventoryEndpoints - DeleteItem_WithValidId_Returns204`
        *   **Test Logic:** (API Test) - Send a `DELETE` request to `/api/v1/households/{householdId}/items/{itemId}` with a valid Bearer token. Assert the HTTP status is `204 No Content`. Verify the item is removed from the mock DB.
        *   **Required Proof of Passing:** The `curl` command and its response must be saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.3/task-2/test-output/TC-MBE-3.8.log`.

---

### **3. Implementation Plan (The Execution)**

#### [x] STORY-MBE-3.1: Implement Item Listing and Creation

1.  **Task:** Create mock in-memory data store for items and history.
    *   **Instruction:** `Update 'db.js' to include 'inventoryItems' and 'itemHistory' arrays. Define a mock schema for these, including fields like id, householdId, name, quantity, expirationDate, createdBy, and basic history fields. Ensure generated IDs are UUIDs.`
    *   **Fulfills:** Prerequisite for inventory endpoint implementation.
    *   **Documentation:**
        *   [x] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** The updated `db.js` content has been saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-1/documentation/db.js`.

2.  **Task:** Implement `GET /households/{householdId}/items` and `POST /households/{householdId}/items`.
    *   **Instruction:** `Create a new file 'inventoryRoutes.js'.
        1.  **GET /**: Implement logic to retrieve items associated with the provided `householdId`. Filter and populate `daysUntilExpiration` and `expirationStatus` fields based on the current date and `expirationDate` (mock these calculations). Respond with 200 and the list of items.
        2.  **POST /**: Create a new item object with a UUID, current timestamp, and add it to the 'inventoryItems' array. Assign `created_by` based on the authenticated user. Respond with 201 and the new item's details.`
    *   **Fulfills:** This task contributes to requirements **MBE-REQ-3.1**, **MBE-REQ-3.2**, and **MBE-REQ-3.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-3.1`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-2/test-output/TC-MBE-3.1.log`.
        *   **Test Case `TC-MBE-3.2`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-2/test-output/TC-MBE-3.2.log`.
        *   **Test Case `TC-MBE-3.3`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-2/test-output/TC-MBE-3.3.log`.

3.  **Task:** Update Documentation and Traceability Matrix.
    *   **Instruction:** `First, update 'mock-backend/README.md' to document the new inventory listing and creation endpoints. Second, update 'system/common/traceability.md' for requirements SYS-FUNC-010 and SYS-FUNC-016, adding the 'MBE Verified' status and corresponding Test Case IDs.`
    *   **Fulfills:** Documentation and traceability requirements.
    *   **Documentation:**
        *   [x] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** A diff of the `mock-backend/README.md` file has been saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-3/documentation/readme-update.diff`.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of the `traceability.md` file has been saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-010 | Add inventory items | MVP | SVC-inventory-FUNC-002 |
            +| SYS-FUNC-010 | Add inventory items | MVP | SVC-inventory-FUNC-002 (MBE Verified: TC-MBE-3.3) |
            -| SYS-FUNC-016 | Calculate days until expiration | MVP | SVC-inventory-FUNC-008 |
            +| SYS-FUNC-016 | Calculate days until expiration | MVP | SVC-inventory-FUNC-008 (MBE Verified: TC-MBE-3.2) |
            ```

---
> ### **Story Completion: STORY-MBE-3.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute tests TC-MBE-1.1 through TC-MBE-1.7 (from Phase 1) and TC-MBE-2.1 through TC-MBE-2.4 (from Phase 2), and now TC-MBE-3.1 through TC-MBE-3.3.`
>     *   **Evidence:** A summary log confirming all 14 test cases have passed has been saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-3.1 - Implement Item Listing and Creation"'.`
>     *   **Evidence:** Full commit hash: 367859ec0f291498c83844b6f3769c3aab228cff
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [x] STORY-MBE-3.2: Implement Item Update and Deletion

1.  **Task:** Implement `PATCH /households/{householdId}/items/{itemId}` with ETag support.
    *   **Instruction:** `In 'inventoryRoutes.js', add a handler for the PATCH endpoint. Simulate ETag by adding a 'rowVersion' field to mock items (start with 1). When an item is retrieved, include 'ETag: W/"1"' in the response headers. For PATCH requests, check 'If-Match' header against the item's rowVersion. If mismatch or missing, return 409 or 428. On success, increment the rowVersion and update the item's fields. Simulate a simple validation rule (e.g., quantity cannot be negative).`
    *   **Fulfills:** This task contributes to requirements **MBE-REQ-3.1**, **MBE-REQ-3.4**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-3.4`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.2/task-1/test-output/TC-MBE-3.4.log`.
        *   **Test Case `TC-MBE-3.5`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.2/task-1/test-output/TC-MBE-3.5.log`.

2.  **Task:** Implement `DELETE /households/{householdId}/items/{itemId}`.
    *   **Instruction:** `Add a handler for the DELETE endpoint. Find the item, remove it from the 'inventoryItems' array, and respond with 204 No Content.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-3.6**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-3.8`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.2/task-2/test-output/TC-MBE-3.8.log`.

---
> ### **Story Completion: STORY-MBE-3.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API tests from Phase 1, Phase 2, and Story MBE-3.1, and now TC-MBE-3.4, TC-MBE-3.5, TC-MBE-3.8.`
>     *   **Evidence:** A summary log confirming all 17 test cases have passed has been saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-3.2 - Implement Item Update and Deletion"'.`
>     *   **Evidence:** Full commit hash: e4413417da3a921349800738a47f94e4f7b339d9
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [x] STORY-MBE-3.3: Implement Consume and Waste Actions

1.  **Task:** Implement `POST /households/{householdId}/items/{itemId}/consume`.
    *   **Instruction:** `In 'inventoryRoutes.js', add a handler for the POST /consume endpoint. Find the item, adjust its quantity based on the request, and potentially remove it if the quantity reaches zero or less. Log the consumption action in the mock 'itemHistory' array. Respond with 200 and updated item details.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-3.5**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-3.6`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.3/task-1/test-output/TC-MBE-3.6.log`.

2.  **Task:** Implement `POST /households/{householdId}/items/{itemId}/waste`.
    *   **Instruction:** `Add a handler for the POST /waste endpoint. Find the item, adjust its quantity (or remove it), log the waste action with the provided reason in 'itemHistory', and potentially update mock waste statistics (if implemented in db.js). Respond with 200 and updated item details.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-3.5**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-3.7`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.3/task-1/test-output/TC-MBE-3.7.log`.

3.  **Task:** Update Documentation and Traceability Matrix.
    *   **Instruction:** `First, update 'mock-backend/README.md' to document the new consume and waste endpoints. Second, update 'system/common/traceability.md' for requirements SYS-FUNC-013 and SYS-FUNC-014, adding the 'MBE Verified' status and corresponding Test Case IDs.`
    *   **Fulfills:** Documentation and traceability requirements.
    *   **Documentation:**
        *   [x] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** A diff of the `mock-backend/README.md` file has been saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.3/task-3/documentation/readme-update.diff`.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of the `traceability.md` file has been saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.3/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-013 | Mark items as consumed | MVP | SVC-inventory-FUNC-005 |
            +| SYS-FUNC-013 | Mark items as consumed | MVP | SVC-inventory-FUNC-005 (MBE Verified: TC-MBE-3.6) |
            -| SYS-FUNC-014 | Mark items as wasted | MVP | SVC-inventory-FUNC-006 |
            +| SYS-FUNC-014 | Mark items as wasted | MVP | SVC-inventory-FUNC-006 (MBE Verified: TC-MBE-3.7) |
            ```

---
> ### **Story Completion: STORY-MBE-3.3**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API tests from Phase 1, Phase 2, Story MBE-3.1, and now TC-MBE-3.6 and TC-MBE-3.7.`
>     *   **Evidence:** A summary log confirming all 19 test cases have passed has been saved to `/evidence/PHASE-MBE-3/STORY-MBE-3.3/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-3.3 - Implement Consume and Waste Actions"'.`
>     *   **Evidence:** Full commit hash: 542ce67f15f14bdc454a095b5ac8faad20e1b4eb
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-MBE` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [x] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute all API test cases (TC-MBE-1.1 through TC-MBE-3.8) one last time to ensure full functionality.`
    *   **Evidence:** A final summary log confirming that all 19 test cases pass has been saved to `/evidence/PHASE-MBE-3/phase-regression-test.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-MBE-3` to `[x] PHASE-MBE-3`. This concludes your work on this phase file.

---

### QA VERDICT

**Verdict:** GREEN ✅  
**Timestamp:** 2025-09-02T00:55:00Z  
**QA Report:** [./evidence/PHASE-MBE-3-FINAL/QA/phase-report.md](/home/karol/dev/code/fridgr/evidence/PHASE-MBE-3-FINAL/QA/phase-report.md)  
**QA Summary:** [./evidence/PHASE-MBE-3-FINAL/QA/phase-summary.json](/home/karol/dev/code/fridgr/evidence/PHASE-MBE-3-FINAL/QA/phase-summary.json)

**FINAL QA VERIFICATION - ALL ISSUES RESOLVED**

✅ **Phase MBE-3 Tests:** 8/8 PASSED (100%)
- TC-MBE-3.1 through TC-MBE-3.8 all passing
- TC-MBE-3.5: FIXED - Now correctly returns HTTP 409 for stale ETags
- TC-MBE-3.8: FIXED - Test script corrected, deletion works properly

✅ **Regression Tests:** 11/11 PASSED (100%)
- Phase MBE-1: 7/7 tests passing (including fixed TC-MBE-1.1 health check)
- Phase MBE-2: 4/4 tests passing

✅ **Total:** 19/19 tests PASSED (100% success rate)

**Previously Identified Issues - ALL RESOLVED:**
1. ✅ TC-MBE-3.5: Fixed to return HTTP 409 for stale ETags (was returning 400)
2. ✅ TC-MBE-3.8: Fixed test script for proper item ID extraction
3. ✅ TC-MBE-1.1: Health check confirmed working at /health endpoint

**Conclusion:** Phase MBE-3 has been successfully completed with all requirements met, all tests passing, and all previously identified issues resolved. The mock backend now provides complete CRUD operations for inventory management with proper authentication, optimistic concurrency control, and comprehensive error handling.