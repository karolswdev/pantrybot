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

## [x] PHASE-MBE-1: Foundation & Authentication Endpoints

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-MBE-1 | Foundation & Authentication Endpoints |

> **As a** Fridgr Frontend Engineer, **I want** a working mock back-end with a complete set of authentication endpoints, **so that** I can fully test the user registration, login, token refresh, and session management features of the UI.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **MBE-REQ-1.1** - System MUST provide a runnable Node.js server foundation.
    *   **Test Case ID:** `TC-MBE-1.1`
        *   **Test Method Signature:** `SystemVerification - CanRunServer`
        *   **Test Logic:** (Manual System Test) - From the `mock-backend` directory, run `npm start`. The command must complete without errors and log a message indicating the server is listening on a specific port. A `curl http://localhost:<port>/health` request must return a 200 OK with a JSON body `{"status": "ok"}`.
        *   **Required Proof of Passing:** The console output showing the server starting and the successful `curl` command must be saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.1/task-1/test-output/TC-MBE-1.1.log`.

*   **Requirement:** **MBE-REQ-1.2** - System MUST implement the User Registration endpoint (`SYS-FUNC-001`).
    *   **Test Case ID:** `TC-MBE-1.2`
        *   **Test Method Signature:** `AuthEndpoints - RegisterUser_WithValidData_Returns201AndTokens`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/auth/register` with a valid JSON body (email, password, displayName). Assert the HTTP status is `201 Created` and the response body matches the shape in `api-specifications.md`.
        *   **Required Proof of Passing:** The full `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.2.log`.
    *   **Test Case ID:** `TC-MBE-1.3`
        *   **Test Method Signature:** `AuthEndpoints - RegisterUser_WithDuplicateEmail_Returns409Conflict`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/auth/register` with a previously used email. Assert the HTTP status is `409 Conflict`.
        *   **Required Proof of Passing:** The full `curl` command and its response must be saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.3.log`.

*   **Requirement:** **MBE-REQ-1.3** - System MUST implement the User Login endpoint (`SYS-FUNC-002`).
    *   **Test Case ID:** `TC-MBE-1.4`
        *   **Test Method Signature:** `AuthEndpoints - LoginUser_WithValidCredentials_Returns200AndTokens`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/auth/login` with valid credentials. Assert the HTTP status is `200 OK` and the response body matches the shape in `api-specifications.md`.
        *   **Required Proof of Passing:** The full `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.4.log`.
    *   **Test Case ID:** `TC-MBE-1.5`
        *   **Test Method Signature:** `AuthEndpoints - LoginUser_WithInvalidCredentials_Returns401Unauthorized`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/auth/login` with an incorrect password. Assert the HTTP status is `401 Unauthorized`.
        *   **Required Proof of Passing:** The full `curl` command and its response must be saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.5.log`.

*   **Requirement:** **MBE-REQ-1.4** - System MUST implement the Token Refresh endpoint.
    *   **Test Case ID:** `TC-MBE-1.6`
        *   **Test Method Signature:** `AuthEndpoints - RefreshToken_WithValidToken_Returns200AndNewTokens`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/auth/refresh` with a valid `refreshToken`. Assert the HTTP status is `200 OK` and the response contains a new `accessToken` and a new `refreshToken`.
        *   **Required Proof of Passing:** The full `curl` command and its JSON response must be saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.6.log`.
    *   **Test Case ID:** `TC-MBE-1.7`
        *   **Test Method Signature:** `AuthEndpoints - RefreshToken_WithInvalidToken_Returns401Unauthorized`
        *   **Test Logic:** (API Test) - Send a `POST` request to `/api/v1/auth/refresh` with an invalid `refreshToken`. Assert the HTTP status is `401 Unauthorized`.
        *   **Required Proof of Passing:** The full `curl` command and its response must be saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.7.log`.

---

### **3. Implementation Plan (The Execution)**

#### [x] STORY-MBE-1.1: Project Initialization & Server Setup

1.  **Task:** Initialize Node.js project, install dependencies, and create a basic Express server.
    *   **Instruction:** `Create a new root directory named 'mock-backend'. Inside, run 'npm init -y'. Install dependencies: 'npm install express cors jsonwebtoken bcryptjs uuid'. Install dev dependencies: 'npm install --save-dev nodemon'. Create an 'index.js' file with a basic Express server using 'cors' and 'express.json()' middleware. Add a GET '/health' endpoint that responds 200 with {"status": "ok"}. Configure the server to listen on port 8080. Add a "start" script to package.json: "start": "nodemon index.js".`
    *   **Fulfills:** This task contributes to requirement **MBE-REQ-1.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-1.1`:**
            *   [x] **Test Method Passed:** Checked after the test passes. **Evidence:** The console log and curl output have been saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.1/task-1/test-output/TC-MBE-1.1.log`.

2.  **Task:** Create core documentation for the mock back-end.
    *   **Instruction:** `Create a README.md file in the 'mock-backend' directory. Add a "Getting Started" section explaining how to run 'npm install' and 'npm start'. Add an "API Endpoints" section with a placeholder for the endpoints that will be created in this phase.`
    *   **Fulfills:** This is a documentation and developer experience task.
    *   **Documentation:**
        *   [x] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** The initial `README.md` content has been created and saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.1/task-2/documentation/README.md`.

---
> ### **Story Completion: STORY-MBE-1.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'npm start' and then run 'curl http://localhost:8080/health'.`
>     *   **Evidence:** The summary output confirming the server starts and the health check passes has been saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-1.1 - Project Initialization & Server Setup"'.`
>     *   **Evidence:** Commit hash: 3c0e08465072ce25d8a174b2231ff3d0050e8b7b
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [x] STORY-MBE-1.2: Implement Authentication Endpoints

1.  **Task:** Create an in-memory data store.
    *   **Instruction:** `Create a file named 'db.js'. In this file, export three in-memory arrays: 'users', 'households', and 'household_members'. Also export a Set named 'validRefreshTokens'. Add comments explaining the purpose and schema of each data structure.`
    *   **Fulfills:** Prerequisite for auth endpoint implementation.
    *   **Documentation:**
        *   [x] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** The final content of `db.js` has been saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-1/documentation/db.js`.

2.  **Task:** Implement the Register, Login, and Refresh endpoints.
    *   **Instruction:** `Create an 'authRoutes.js' file. Implement the logic for the POST endpoints '/api/v1/auth/register', '/api/v1/auth/login', and '/api/v1/auth/refresh'. Ensure all request handling, data manipulation (using the in-memory DB), token generation/validation, and response shapes strictly adhere to the 'api-specifications.md' contract. Import and use these routes in 'index.js'.`
    *   **Fulfills:** This task contributes to requirements **MBE-REQ-1.2**, **MBE-REQ-1.3**, and **MBE-REQ-1.4**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-MBE-1.2`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.2.log`.
        *   **Test Case `TC-MBE-1.3`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.3.log`.
        *   **Test Case `TC-MBE-1.4`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.4.log`.
        *   **Test Case `TC-MBE-1.5`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.5.log`.
        *   **Test Case `TC-MBE-1.6`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.6.log`.
        *   **Test Case `TC-MBE-1.7`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-2/test-output/TC-MBE-1.7.log`.

3.  **Task:** Update Documentation and Traceability Matrix.
    *   **Instruction:** `First, update the 'mock-backend/README.md' file to document the three new authentication endpoints under the "API Endpoints" section. Include the method, path, a brief description, and example request/response bodies. Second, update the 'system/common/traceability.md' file. For requirements SYS-FUNC-001 and SYS-FUNC-002, add a status indicator signifying mock back-end completion.`
    *   **Fulfills:** Documentation and traceability requirements.
    *   **Documentation:**
        *   [x] **Documentation Updated:** Checked after the relevant documentation is updated. **Evidence:** A diff of the `mock-backend/README.md` file has been saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-3/documentation/readme-update.diff`.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Instruction:** `Update system/common/traceability.md for SYS-FUNC-001 and SYS-FUNC-002.` **Evidence:** A diff of the `traceability.md` file has been saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-001 | User registration with email/password | MVP | SVC-users-FUNC-001 |
            +| SYS-FUNC-001 | User registration with email/password | MVP | SVC-users-FUNC-001 (MBE Verified: TC-MBE-1.2, TC-MBE-1.3) |
            -| SYS-FUNC-002 | JWT authentication | MVP | SVC-users-FUNC-002 (FE Verified: TC-FE-1.5, TC-FE-7.2) |
            +| SYS-FUNC-002 | JWT authentication | MVP | SVC-users-FUNC-002 (FE Verified: TC-FE-1.5, TC-FE-7.2) (MBE Verified: TC-MBE-1.4, TC-MBE-1.5) |
            ```

---
> ### **Story Completion: STORY-MBE-1.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Manually execute all API tests defined in this phase (TC-MBE-1.1 through TC-MBE-1.7) using Postman or curl.`
>     *   **Evidence:** A summary log stating that all 7 test cases have been executed and passed has been saved to `/evidence/PHASE-MBE-1/STORY-MBE-1.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-MBE-1.2 - Implement Authentication Endpoints"'.`
>     *   **Evidence:** Commit hash: eaae477c979bc93f62e340d3b5e4f21736a647d7
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-MBE` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [x] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute all API test cases (TC-MBE-1.1 through TC-MBE-1.7) one last time to ensure full functionality.`
    *   **Evidence:** A final summary log confirming that all 7 test cases pass has been saved to `/evidence/PHASE-MBE-1/phase-regression-test.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-MBE-1` to `[x] PHASE-MBE-1`. This concludes your work on this phase file.

---

### QA VERDICT

**Verdict:** GREEN  
**Timestamp:** 2025-09-01T18:35:00Z  
**QA Artifacts:**
- Full Report: `/evidence/PHASE-MBE-1/QA/phase-report.md`
- Machine Summary: `/evidence/PHASE-MBE-1/QA/phase-qa-summary.json`

**Summary:** PHASE-MBE-1 has been independently verified and meets all acceptance criteria. All 7 test cases pass, complete evidence trail exists, and the mock backend is fully operational.