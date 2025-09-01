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

## [x] PHASE-MBE-2: Dashboard & Household Management Endpoints

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-MBE-2 | Dashboard & Household Management Endpoints |

> **As a** Fridgr Frontend Engineer, **I want** a mock back-end that provides endpoints for creating, viewing, and managing households, **so that** I can build and test the dashboard, household switcher, and member invitation features of the UI.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **MBE-REQ-2.1** - System MUST protect household endpoints, requiring authentication.
    *   **Test Case ID:** `TC-MBE-2.1`
        *   **Test Method Signature:** `AuthMiddleware - AccessProtectedEndpoint_WithoutToken_Returns401`
        *   **Test Logic:** (API Test) - Send a `GET` request to `/api/v1/households` without an `Authorization` header. Assert the HTTP status is `401 Unauthorized`.
        *   **Required Proof of Passing:** The `curl` command and its response must be saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/task-1/test-output/TC-MBE-2.1.log`.

*   **Requirement:** **MBE-REQ-2.2** - System MUST implement endpoints for listing and creating households (`SYS-FUNC-005`, `SYS-FUNC-006`).
    *   **Test Case ID:** `TC-MBE-2.2`
        *   **Test Method Signature:** `HouseholdEndpoints - ListHouseholds_WithValidToken_Returns200AndUserHouseholds`
        *   **Test Logic:** (API Test) - After logging in, send a `GET` request to `/api/v1/households` with a valid Bearer token. Assert the HTTP status is `200 OK`. Assert the response is a JSON object containing a `households` array, which includes the user's default household created during registration.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/task-2/test-output/TC-MBE-2.2.log`.
    *   **Test Case ID:** `TC-MBE-2.3`
        *   **Test Method Signature:** `HouseholdEndpoints - CreateHousehold_WithValidData_Returns201AndNewHousehold`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/households` with a valid Bearer token and a JSON body containing `name` and `timezone`. Assert the HTTP status is `201 Created`. Assert the response body contains the details of the newly created household, matching the shape in `api-specifications.md`.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/task-2/test-output/TC-MBE-2.3.log`.

*   **Requirement:** **MBE-REQ-2.3** - System MUST implement an endpoint for getting detailed household information (`US-002`).
    *   **Test Case ID:** `TC-MBE-2.4`
        *   **Test Method Signature:** `HouseholdEndpoints - GetHouseholdDetails_WithValidId_Returns200AndDetails`
        *   **Test Logic:** (API Test) - Send a `GET` request to `/api/v1/households/{householdId}` with a valid Bearer token and household ID. Assert the HTTP status is `200 OK`. Assert the response body contains detailed information, including `id`, `name`, `members`, and a `statistics` object, as defined in `api-specifications.md`.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/task-2/test-output/TC-MBE-2.4.log`.

*   **Requirement:** **MBE-REQ-2.4** - System MUST implement an endpoint for inviting members (`SYS-FUNC-008`).
    *   **Test Case ID:** `TC-MBE-2.5`
        *   **Test Method Signature:** `MemberEndpoints - InviteMember_WithValidData_Returns201AndInvitation`
        *   **Test Logic:** (API Test) - As a household admin, send a `POST` request to `/api/v1/households/{householdId}/members` with a valid Bearer token and a JSON body containing `email` and `role`. Assert the HTTP status is `201 Created`. Assert the response body contains the pending invitation details.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.2/task-1/test-output/TC-MBE-2.5.log`.
    *   **Test Case ID:** `TC-MBE-2.6`
        *   **Test Method Signature:** `MemberEndpoints - InviteMember_AsNonAdmin_Returns403Forbidden`
        *   **Test Logic:** (API Test) - Create and log in as a second user. Invite them to a household and ensure their role is 'member'. As this second user, attempt to send a `POST` request to invite another member to the same household. Assert the HTTP status is `403 Forbidden`.
        *   **Required Proof of Passing:** The `curl` command and its response must be saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.2/task-1/test-output/TC-MBE-2.6.log`.

---

### **3. Implementation Plan (The Execution)**

#### [x] STORY-MBE-2.1: Implement Household Endpoints

1.  **Task:** Create an authentication middleware.
    *   **Instruction:** `Create a file named 'authMiddleware.js'. This middleware will extract the JWT from the 'Authorization: Bearer <token>' header, verify it using 'jsonwebtoken', and attach the decoded user payload to the request object (e.g., req.user). If the token is missing or invalid, it must respond with a 401 Unauthorized status. Apply this middleware to a new router for household endpoints.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-2.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-2.1`:**
            *   [x] **Test Method Passed:** Checked after the test passes. **Evidence:** The `curl` output showing a 401 response has been saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/task-1/test-output/TC-MBE-2.1.log`.

2.  **Task:** Implement `GET /households`, `POST /households`, and `GET /households/{id}`.
    *   **Instruction:** `Create a new file 'householdRoutes.js'.
        1.  **GET /**: Using the authenticated user's ID from 'req.user', find all household memberships in the in-memory 'household_members' table. Use these to retrieve the full household objects from the 'households' table. Respond with the 200 shape from api-specifications.md.
        2.  **POST /**: Create a new household object and a new membership link for the authenticated user, giving them the 'admin' role. Respond with 201 and the new household's data.
        3.  **GET /{id}**: Verify the authenticated user is a member of the requested household ID. If not, return 403. Otherwise, return the household details, including a list of members and a hardcoded 'statistics' object matching the API specification.`
    *   **Fulfills:** This task contributes to requirements **MBE-REQ-2.2** and **MBE-REQ-2.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-2.2`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/task-2/test-output/TC-MBE-2.2.log`.
        *   **Test Case `TC-MBE-2.3`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/task-2/test-output/TC-MBE-2.3.log`.
        *   **Test Case `TC-MBE-2.4`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/task-2/test-output/TC-MBE-2.4.log`.

---
> ### **Story Completion: STORY-MBE-2.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API tests defined in Phase 1 and Story MBE-2.1 (TC-MBE-1.1 through TC-MBE-1.7 and TC-MBE-2.1 through TC-MBE-2.4).`
>     *   **Evidence:** A summary log confirming all 11 test cases have passed has been saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-2.1 - Implement Household Endpoints"'.`
>     *   **Evidence:** Commit hash: 343068bffd4ef44b3393bfc12cf47d5f195d933f
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [x] STORY-MBE-2.2: Implement Member Management Endpoint

1.  **Task:** Implement `POST /households/{id}/members`.
    *   **Instruction:** `In 'householdRoutes.js', add a handler for this endpoint. First, verify the authenticated user is an 'admin' of the specified household. If not, return 403. If the invited email already corresponds to an existing member, return 409. Otherwise, create a pending invitation record (this can be a simple object in a new in-memory 'invitations' array) and respond with 201 and the invitation details.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-2.4**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-2.5`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.2/task-1/test-output/TC-MBE-2.5.log`.
        *   **Test Case `TC-MBE-2.6`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.2/task-1/test-output/TC-MBE-2.6.log`.

2.  **Task:** Update Documentation and Traceability Matrix.
    *   **Instruction:** `First, update 'mock-backend/README.md' to document the four new household-related endpoints. Second, update 'system/common/traceability.md' for requirements SYS-FUNC-005, SYS-FUNC-006, and SYS-FUNC-008, adding the 'MBE Verified' status and corresponding Test Case IDs.`
    *   **Fulfills:** Documentation and traceability requirements.
    *   **Documentation:**
        *   [x] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** A diff of the `mock-backend/README.md` file has been saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.2/task-2/documentation/readme-update.diff`.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of the `traceability.md` file has been saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.2/task-2/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-005 | Create multiple households | MVP | SVC-users-FUNC-005 |
            +| SYS-FUNC-005 | Create multiple households | MVP | SVC-users-FUNC-005 (MBE Verified: TC-MBE-2.3) |
            -| SYS-FUNC-006 | Users belong to multiple households | MVP | SVC-users-FUNC-006 |
            +| SYS-FUNC-006 | Users belong to multiple households | MVP | SVC-users-FUNC-006 (MBE Verified: TC-MBE-2.2) |
            -| SYS-FUNC-008 | Invite members via email | MVP | SVC-users-FUNC-008, SVC-notifications-FUNC-002 |
            +| SYS-FUNC-008 | Invite members via email | MVP | SVC-users-FUNC-008, SVC-notifications-FUNC-002 (MBE Verified: TC-MBE-2.5, TC-MBE-2.6) |
            ```

---
> ### **Story Completion: STORY-MBE-2.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API tests from Phase 1 and Phase 2 (TC-MBE-1.1 through TC-MBE-2.6).`
>     *   **Evidence:** A summary log confirming all 13 test cases have passed has been saved to `/evidence/PHASE-MBE-2/STORY-MBE-2.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-2.2 - Implement Member Management Endpoint"'.`
>     *   **Evidence:** Commit hash: acf9b0d06347f00c46b9cf26499e74ce8b06ea06
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-MBE` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [x] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute all API test cases (TC-MBE-1.1 through TC-MBE-2.6) one last time to ensure full functionality.`
    *   **Evidence:** A final summary log confirming that all 13 test cases pass has been saved to `/evidence/PHASE-MBE-2/phase-regression-test.log`.

*   **Final Instruction:** Once the `Final Full Regression Test