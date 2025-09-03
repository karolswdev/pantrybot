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

## [x] PHASE-INT-1: Integration Foundation & User Authentication

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-INT-1 | Integration Foundation & User Authentication |

> **As a** Fridgr Developer, **I want** to connect the Frontend application to the Mock Backend and integrate the full user authentication flow, **so that** the UI is no longer reliant on mocked API calls for user session management and protected routes.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **INT-REQ-1.1** - System MUST run as a multi-container application using Docker Compose.
    *   **Test Case ID:** `TC-INT-1.1`
        *   **Test Method Signature:** `SystemVerification - CanRunFullStackInDocker`
        *   **Test Logic:** (System Test) - From the project root, run `docker-compose up --build`. The command must complete without errors. Both the `frontend` and `mock-backend` services must be running and healthy. A `curl http://localhost:8080/health` must return 200 OK, and navigating to `http://localhost:3000` must render the frontend application's login page.
        *   **Required Proof of Passing:** The full log of the `docker-compose up` command, showing both services starting successfully, must be saved to `/evidence/PHASE-INT-1/STORY-INT-1.1/task-1/logs/docker-compose.log`.

*   **Requirement:** **INT-REQ-1.2** - Frontend MUST successfully use the mock backend for user registration.
    *   **Test Case ID:** `TC-INT-1.2`
        *   **Test Method Signature:** `SignUp.cy.ts - it('should register a new user against the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-1.3`. Remove the `cy.intercept()` for `/api/v1/auth/register`. Run the test. The test must fill out the UI, make a real HTTP request to the running mock-backend service, receive a `201 Created` response with valid tokens, and the UI must correctly store these tokens and redirect to `/dashboard`.
        *   **Required Proof of Passing:** The Cypress test runner output showing the passing test must be saved to `/evidence/PHASE-INT-1/STORY-INT-1.2/task-2/test-output/TC-INT-1.2.log`.

*   **Requirement:** **INT-REQ-1.3** - Frontend MUST successfully use the mock backend for user login.
    *   **Test Case ID:** `TC-INT-1.3`
        *   **Test Method Signature:** `Login.cy.ts - it('should log in an existing user against the mock backend')`
        *   **Test Logic:** (E2E Test) - Refactor `TC-FE-1.4`. The test must first register a user (or use a pre-seeded one via the `/debug/reset-state` endpoint), then navigate to `/login`, submit valid credentials, make a real HTTP request to the mock backend's login endpoint, and correctly process the `200 OK` response.
        *   **Required Proof of Passing:** The Cypress test runner output showing the passing test must be saved to `/evidence/PHASE-INT-1/STORY-INT-1.2/task-2/test-output/TC-INT-1.3.log`.

*   **Requirement:** **INT-REQ-1.4** - Frontend's API client MUST successfully use the mock backend for token refreshing.
    *   **Test Case ID:** `TC-INT-1.4`
        *   **Test Method Signature:** `apiClient.cy.ts - it('should refresh token against the mock backend and retry the request')`
        *   **Test Logic:** (E2E Test) - This test replaces the unit test `TC-FE-1.5`. The test will: 1) Log in to get real tokens from the mock backend. 2) Manually modify the `access_token` in `localStorage` to be invalid/expired. 3) Navigate to a protected route (e.g., `/dashboard`). 4) Assert that the frontend's API client receives a 401, makes a real call to the mock backend's `/refresh` endpoint, receives new tokens, and successfully retries the original request to load the dashboard.
        *   **Required Proof of Passing:** The Cypress test runner output showing the passing test must be saved to `/evidence/PHASE-INT-1/STORY-INT-1.2/task-2/test-output/TC-INT-1.4.log`.

---

### **3. Implementation Plan (The Execution)**

#### [x] STORY-INT-1.1: Docker & Environment Configuration

1.  **Task:** Update Docker Compose for full-stack operation.
    *   **Instruction:** `Modify the root 'docker-compose.yml' file. Add a new service named 'mock-backend' that builds from the './mock-backend' directory. Expose its port (e.g., 8080:8080). Update the 'frontend' service's environment variables to point to the mock backend service: 'NEXT_PUBLIC_API_URL=http://mock-backend:8080/api/v1'. Ensure the frontend `depends_on` the mock-backend.`
    *   **Fulfills:** This task contributes to requirement **INT-REQ-1.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-1.1`:**
            *   [x] **Test Method Passed:** Checked after the test passes. **Evidence:** The console log has been saved to `/evidence/PHASE-INT-1/STORY-INT-1.1/task-1/logs/docker-compose.log`.
    *   **Documentation:**
        *   [x] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update the root README.md file. Modify the "Quick Start" section to explain that 'docker-compose up --build' now launches the full stack (Frontend and Mock Backend) and is the primary method for E2E testing.` **Evidence:** A diff of the updated `README.md` has been saved to `/evidence/PHASE-INT-1/STORY-INT-1.1/task-1/documentation/readme-update.diff`.

---
> ### **Story Completion: STORY-INT-1.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Execute 'docker-compose up --build' and verify both services start. Run 'curl http://localhost:8080/health'.`
>     *   **Evidence:** The summary output has been saved to `/evidence/PHASE-INT-1/STORY-INT-1.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-INT-1.1 - Docker & Environment Configuration"'.`
>     *   **Evidence:** Commit hash: 7e4006c
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [x] STORY-INT-1.2: Integrate Authentication Flow

1.  **Task:** Remove API mocking from authentication E2E tests.
    *   **Instruction:** `Go through 'cypress/e2e/SignUp.cy.ts', 'cypress/e2e/Login.cy.ts', and any related auth tests. Remove all 'cy.intercept()' calls that mock the '/api/v1/auth/*' endpoints. The tests should now be configured to make real network requests to the mock backend.`
    *   **Fulfills:** Prerequisite for integrated testing.
    *   **Verification via Test Cases:** This is verified by the successful execution of the tests in the next task.

2.  **Task:** Refactor and fix authentication tests to pass against the live mock backend.
    *   **Instruction:** `Run the updated Cypress tests. They will likely fail. Debug and fix the frontend code (`auth.store.ts`, `api-client.ts`, UI components) and the Cypress tests themselves until they pass. This may involve adjusting how tokens are handled, how responses are parsed, or how test setup is performed (e.g., using the '/debug/reset-state' endpoint before tests).`
    *   **Fulfills:** This task contributes to requirements **INT-REQ-1.2**, **INT-REQ-1.3**, and **INT-REQ-1.4**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-INT-1.2`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-1/STORY-INT-1.2/task-2/test-output/TC-INT-1.2.log`.
        *   **Test Case `TC-INT-1.3`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-1/STORY-INT-1.2/task-2/test-output/TC-INT-1.3.log`.
        *   **Test Case `TC-INT-1.4`:**
            *   [x] **Test Method Passed:** **Evidence:** Output saved to `/evidence/PHASE-INT-1/STORY-INT-1.2/task-2/test-output/TC-INT-1.4.log`.

3.  **Task:** Update Traceability Matrix for Integrated Authentication.
    *   **Instruction:** `Update the '.pm/system/common/traceability.md' file. For requirements SYS-FUNC-001 and SYS-FUNC-002, append a new status indicator to signify successful integration testing against the mock back-end.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [x] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of the `traceability.md` file has been saved to `/evidence/PHASE-INT-1/STORY-INT-1.2/task-3/traceability/traceability-update.diff`.
            ```diff
            -| SYS-FUNC-001 | User registration with email/password | MVP | SVC-users-FUNC-001 (MBE Verified: TC-MBE-1.2, TC-MBE-1.3) |
            +| SYS-FUNC-001 | User registration with email/password | MVP | SVC-users-FUNC-001 (MBE Verified: TC-MBE-1.2, TC-MBE-1.3) (INT Verified: TC-INT-1.2) |
            -| SYS-FUNC-002 | JWT authentication | MVP | SVC-users-FUNC-002 (FE Verified: TC-FE-1.5, TC-FE-7.2) (MBE Verified: TC-MBE-1.4, TC-MBE-1.5) |
            +| SYS-FUNC-002 | JWT authentication | MVP | SVC-users-FUNC-002 (FE Verified: TC-FE-1.5, TC-FE-7.2) (MBE Verified: TC-MBE-1.4, TC-MBE-1.5) (INT Verified: TC-INT-1.3, TC-INT-1.4) |
            ```

---
> ### **Story Completion: STORY-INT-1.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the entire Cypress suite against the full stack running in Docker.`
>     *   **Evidence:** A summary of the Cypress run, confirming that all auth-related tests are passing, has been saved to `/evidence/PHASE-INT-1/STORY-INT-1.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [x] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(story): Complete STORY-INT-1.2 - Integrate Authentication Flow"'.`
>     *   **Evidence:** Commit hash: 20d60c8
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-INT` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [x] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute the full Cypress test suite one last time within the Docker Compose environment.`
    *   **Evidence:** A final summary log confirming that all tests for this phase (TC-INT-1.1 through TC-INT-1.4) pass has been saved to `/evidence/PHASE-INT-1/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-INT-1` to `[x] PHASE-INT-1`. This concludes your work on this phase file.

---

### QA VERDICT

- **Verdict:** GREEN ✅
- **Timestamp:** 2025-09-03T07:24:00Z
- **QA Report:** [/evidence/PHASE-INT-1/QA/report.md](/evidence/PHASE-INT-1/QA/report.md)
- **QA Summary:** [/evidence/PHASE-INT-1/QA/qa-summary.json](/evidence/PHASE-INT-1/QA/qa-summary.json)

**Summary:** All acceptance criteria for PHASE-INT-1 have been met. The UUID generation issue has been successfully resolved, and all test cases (TC-INT-1.1 through TC-INT-1.4) are passing. The integration foundation is established with working authentication flow between frontend and mock backend.