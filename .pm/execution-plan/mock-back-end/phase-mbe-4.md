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

## [ ] PHASE-MBE-4: Real-Time Sync & Notifications Endpoints

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-MBE-4 | Real-Time Sync & Notifications Endpoints |

> **As a** Fridgr Frontend Engineer, **I want** a mock back-end that supports WebSocket connections for real-time events and provides endpoints for managing notification preferences, **so that** I can test the collaborative, real-time features of the inventory and the notification settings UI.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **MBE-REQ-4.1** - System MUST provide a WebSocket server for real-time communication.
    *   **Test Case ID:** `TC-MBE-4.1`
        *   **Test Method Signature:** `WebSocket - Connection_WithValidToken_Succeeds`
        *   **Test Logic:** (WebSocket Test) - Using a WebSocket client, attempt to connect to the server, passing a valid JWT as part of the connection handshake. Assert that the connection is established successfully.
        *   **Required Proof of Passing:** Console logs from a test script showing a successful connection event must be saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.1/task-2/test-output/TC-MBE-4.1.log`.
    *   **Test Case ID:** `TC-MBE-4.2`
        *   **Test Method Signature:** `WebSocket - Connection_WithInvalidToken_Fails`
        *   **Test Logic:** (WebSocket Test) - Using a WebSocket client, attempt to connect to the server with an invalid or missing JWT. Assert that the connection is rejected or immediately closed by the server.
        *   **Required Proof of Passing:** Console logs from a test script showing a connection error or rejection event must be saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.1/task-2/test-output/TC-MBE-4.2.log`.

*   **Requirement:** **MBE-REQ-4.2** - System MUST broadcast inventory changes to relevant clients (`SYS-FUNC-027`).
    *   **Test Case ID:** `TC-MBE-4.3`
        *   **Test Method Signature:** `WebSocket - ItemUpdate_TriggersBroadcast`
        *   **Test Logic:** (Integration Test) - Connect two WebSocket clients (Client A, Client B) authenticated as members of the same household. Have Client A make a `PATCH` request to an inventory item endpoint. Assert that Client B receives an `item.updated` WebSocket event with the correct payload, matching the shape in `api-specifications.md`.
        *   **Required Proof of Passing:** Logs from the test script showing Client B receiving the event after Client A's action must be saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.1/task-3/test-output/TC-MBE-4.3.log`.

*   **Requirement:** **MBE-REQ-4.3** - System MUST implement endpoints for managing notification settings (`SYS-FUNC-019`).
    *   **Test Case ID:** `TC-MBE-4.4`
        *   **Test Method Signature:** `NotificationEndpoints - GetSettings_ReturnsUserSettings`
        *   **Test Logic:** (API Test) - Send a `GET` request to `/api/v1/notifications/settings` with a valid Bearer token. Assert the HTTP status is `200 OK`. Assert the response body matches the shape defined in `api-specifications.md`, containing default or previously set preferences.
        *   **Required Proof of Passing:** The `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/task-1/test-output/TC-MBE-4.4.log`.
    *   **Test Case ID:** `TC-MBE-4.5`
        *   **Test Method Signature:** `NotificationEndpoints - UpdateSettings_SavesNewPreferences`
        *   **Test Logic:** (API Test) - Send a `PUT` request to `/api/v1/notifications/settings` with a valid Bearer token and a body containing updated preferences. Assert the HTTP status is `200 OK`. Follow up with a `GET` request to the same endpoint to verify the changes were persisted in the mock DB.
        *   **Required Proof of Passing:** The `curl` commands for `PUT` and `GET`, along with their responses, must be saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/task-1/test-output/TC-MBE-4.5.log`.

*   **Requirement:** **MBE-REQ-4.4** - System MUST implement the Telegram linking endpoint (`SYS-FUNC-023`).
    *   **Test Case ID:** `TC-MBE-4.6`
        *   **Test Method Signature:** `NotificationEndpoints - LinkTelegram_WithValidCode_Returns200`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/notifications/telegram/link` with a valid Bearer token and a `verificationCode`. Assert the HTTP status is `200 OK` and the response indicates a successful link.
        *   **Required Proof of Passing:** The `curl` command and its response must be saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/task-2/test-output/TC-MBE-4.6.log`.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-MBE-4.1: WebSocket (SignalR Mock) Hub Implementation

1.  **Task:** Install `socket.io` and integrate it with the Express server.
    *   **Instruction:** `Install the socket.io library: 'npm install socket.io'. Update 'index.js' to initialize a socket.io server attached to the existing Express HTTP server. Create a 'socket.js' file to contain all WebSocket-related logic.`
    *   **Fulfills:** This is a prerequisite for requirement **MBE-REQ-4.1**.
    *   **Verification via Test Cases:** The success of this task is a prerequisite for the next task.

2.  **Task:** Implement WebSocket authentication and household-based rooms.
    *   **Instruction:** `In 'socket.js', create a socket.io middleware to handle authentication. This middleware will extract and verify the JWT passed in 'socket.handshake.auth.token'. If valid, proceed; otherwise, disconnect the client. Upon successful authentication, use the user's household memberships to make the socket 'join' a room for each household (e.g., 'household-<uuid>').`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-4.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-4.1`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.1/task-2/test-output/TC-MBE-4.1.log`.
        *   **Test Case `TC-MBE-4.2`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.1/task-2/test-output/TC-MBE-4.2.log`.

3.  **Task:** Integrate event broadcasting with existing REST endpoints.
    *   **Instruction:** `Pass the initialized socket.io server instance to the inventory router ('inventoryRoutes.js'). Modify the existing inventory endpoints (e.g., PATCH for item update, POST for item add, DELETE for item remove). After successfully updating the in-memory DB, use the socket.io instance to 'emit' the corresponding event (e.g., 'item.updated', 'item.added') to the correct household room.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-4.2**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-4.3`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.1/task-3/test-output/TC-MBE-4.3.log`.

---
> ### **Story Completion: STORY-MBE-4.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API tests from previous phases (TC-MBE-1.1 through TC-MBE-3.8) and all new WebSocket tests for this story (TC-MBE-4.1 through TC-MBE-4.3).`
>     *   **Evidence:** A summary log confirming all 22 test cases have passed has been saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-4.1 - WebSocket (SignalR Mock) Hub Implementation"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-MBE-4.2: Implement Notification Settings Endpoints

1.  **Task:** Implement `GET /notifications/settings` and `PUT /notifications/settings`.
    *   **Instruction:** `Create a new 'notificationRoutes.js' file. Add handlers for the GET and PUT endpoints. Use a new 'notification_preferences' in-memory array in 'db.js' to store data. The GET handler should return a user's preferences or a default set if none exist. The PUT handler should update or create a preference record for the authenticated user.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-4.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-4.4`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/task-1/test-output/TC-MBE-4.4.log`.
        *   **Test Case `TC-MBE-4.5`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/task-1/test-output/TC-MBE-4.5.log`.

2.  **Task:** Implement `POST /notifications/telegram/link`.
    *   **Instruction:** `In 'notificationRoutes.js', add a handler for the POST endpoint. The mock logic should simply accept a 'verificationCode', validate its presence, and return a 200 OK response with a mock successful link payload as defined in 'api-specifications.md'.`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-4.4**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-4.6`:**
            *   [ ] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/task-2/test-output/TC-MBE-4.6.log`.

3.  **Task:** Update Documentation and Traceability Matrix.
    *   **Instruction:** `First, update 'mock-backend/README.md' to document the new notification and WebSocket functionalities. Second, update 'system/common/traceability.md' for requirements SYS-FUNC-027, SYS-FUNC-019, and SYS-FUNC-023 with the 'MBE Verified' status and corresponding Test Case IDs.`
    *   **Fulfills:** Documentation and traceability requirements.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** A diff of the `mock-backend/README.md` file has been saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/task-3/documentation/readme-update.diff`.
    *   **Traceability:**
        *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of the `traceability.md` file has been saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-027 | Real-time updates | MVP | SVC-inventory-FUNC-014 (FE Verified: TC-FE-3.7, TC-FE-4.3) |
            +| SYS-FUNC-027 | Real-time updates | MVP | SVC-inventory-FUNC-014 (FE Verified: TC-FE-3.7, TC-FE-4.3) (MBE Verified: TC-MBE-4.3) |
            -| SYS-FUNC-019 | Customize warning period | MVP | SVC-notifications-FUNC-004 (FE Verified - Search: TC-FE-6.4) |
            +| SYS-FUNC-019 | Customize warning period | MVP | SVC-notifications-FUNC-004 (FE Verified - Search: TC-FE-6.4) (MBE Verified: TC-MBE-4.5) |
            -| SYS-FUNC-023 | Link Telegram accounts | MVP | SVC-notifications-FUNC-008 (FE Verified: TC-FE-4.4, TC-FE-7.4) |
            +| SYS-FUNC-023 | Link Telegram accounts | MVP | SVC-notifications-FUNC-008 (FE Verified: TC-FE-4.4, TC-FE-7.4) (MBE Verified: TC-MBE-4.6) |
            ```

---
> ### **Story Completion: STORY-MBE-4.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API and WebSocket tests from all previous phases and the current story (TC-MBE-1.1 through TC-MBE-4.6).`
>     *   **Evidence:** A summary log confirming all 25 test cases have passed has been saved to `/evidence/PHASE-MBE-4/STORY-MBE-4.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-4.2 - Implement Notification Settings Endpoints"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-MBE` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [ ] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute all API and WebSocket test cases (TC-MBE-1.1 through TC-MBE-4.6) one last time to ensure full functionality.`
    *   **Evidence:** A final summary log confirming that all 25 test cases pass has been saved to `/evidence/PHASE-MBE-4/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-MBE-4` to `[x] PHASE-MBE-4`. This concludes your work on this phase file.