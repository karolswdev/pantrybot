### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-CLEAN-1 | Dependency Modernization & Regression Hardening |

> **As a** Lead Developer, **I want** to modernize all project dependencies, update the underlying runtime environment, and resolve all known security vulnerabilities, **so that** the application is secure, maintainable, and free of technical debt before final handover.

---

### **2. Phase Scope & Test Case Definitions (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **INT-REQ-7.1** - System MUST run on a modern, supported version of Node.js.
    *   **Test Case ID:** `TC-CLEAN-7.1`
        *   **Test Method Signature:** `SystemVerification - CanRunOnModernNodeJS`
        *   **Test Logic:** (System Test) - Inspect the `frontend/Dockerfile` and assert the base image is `node:20-alpine` or newer. Run `docker-compose up --build -d`. Execute `docker-compose exec frontend node -v` and assert the output version is `v20.x` or higher.
        *   **Required Proof of Passing:** A log file containing the `cat frontend/Dockerfile` and `docker-compose exec frontend node -v` commands and their outputs, saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.1/task-2/logs/TC-CLEAN-7.1.log`.

*   **Requirement:** **INT-REQ-7.2** - All project dependencies MUST be updated and free of critical vulnerabilities.
    *   **Test Case ID:** `TC-CLEAN-7.2`
        *   **Test Method Signature:** `SystemVerification - NpmAuditShowsNoCriticalVulnerabilities`
        *   **Test Logic:** (System Test) - Inside the running `frontend` container, execute `npm audit`. Assert the command reports `0 high` and `0 critical` severity vulnerabilities.
        *   **Required Proof of Passing:** The full output of the `npm audit` command must be saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.2/task-2/test-output/TC-CLEAN-7.2.log`.

*   **Requirement:** **INT-REQ-7.3** - The dependency modernization MUST NOT introduce regressions in existing application functionality.
    *   **Test Case ID:** `TC-CLEAN-7.3`
        *   **Test Method Signature:** `SystemVerification - FullRegressionSuitePasses`
        *   **Test Logic:** (E2E Test) - Execute the full, consolidated Cypress test suite against the modernized, running application. Assert that the number of passing tests is equal to or greater than the number of passing tests at the end of `PHASE-INT-6`.
        *   **Required Proof of Passing:** A summary of the Cypress test run, including the total number of tests and the number passed, must be saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.3/task-2/test-output/TC-CLEAN-7.3.log`.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-CLEAN-1.1: Environment Modernization

1.  **Task:** Update the Node.js version in the Docker environment.
    *   **Instruction:** `Modify the 'frontend/Dockerfile'. Change all instances of the base image from 'node:18-alpine' to 'node:20-alpine' to satisfy the engine requirements of modern packages like Cypress.`
    *   **Fulfills:** This task contributes to requirement **INT-REQ-7.1**.
    *   **Verification via Test Cases:** Verified by the test in the next task.

2.  **Task:** Rebuild the container and verify runtime environment.
    *   **Instruction:** `Run 'docker-compose up --build -d'. Once the services are running, execute 'docker-compose exec frontend node -v' to confirm the Node.js version. Finally, run 'curl http://localhost:3000' to ensure the application still starts correctly.`
    *   **Fulfills:** This task contributes to requirement **INT-REQ-7.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-CLEAN-7.1`:**
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** The verification log has been saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.1/task-2/logs/TC-CLEAN-7.1.log`.
    *   **Documentation:**
        *   [ ] **Documentation Updated:** Checked after the relevant documentation is updated. **Instruction:** `Update the 'frontend/README.md' file under "Prerequisites" to state "Node.js 20+" as the required version.` **Evidence:** A diff of the updated `README.md` has been saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.1/task-2/documentation/readme-update.diff`.

---
> ### **Story Completion: STORY-CLEAN-1.1**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run 'docker-compose up --build' and ensure the application starts and is accessible.`
>     *   **Evidence:** The summary log has been saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.1/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "chore(story): Complete STORY-CLEAN-1.1 - Environment Modernization"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-CLEAN-1.2: Dependency Update & Vulnerability Patching

1.  **Task:** Update all outdated npm packages to their latest stable versions.
    *   **Instruction:** `In the 'frontend' directory, use 'npm-check-updates' to upgrade all dependencies. Run 'npx ncu -u'. This will overwrite 'package.json'. Afterward, run 'npm install' to update 'package-lock.json' and install the new packages.`
    *   **Fulfills:** Prerequisite for **INT-REQ-7.2**.
    *   **Verification via Test Cases:** Verified by the test in the next task.

2.  **Task:** Audit and fix security vulnerabilities.
    *   **Instruction:** `After updating packages, run 'npm audit'. If high or critical vulnerabilities remain, run 'npm audit fix --force'. Manually resolve any remaining vulnerabilities by updating the specific packages identified in the audit report.`
    *   **Fulfills:** This task contributes to requirement **INT-REQ-7.2**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-CLEAN-7.2`:**
            *   [ ] **Test Method Passed:** **Evidence:** The `npm audit` output has been saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.2/task-2/test-output/TC-CLEAN-7.2.log`.

---
> ### **Story Completion: STORY-CLEAN-1.2**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run 'docker-compose up --build' and verify the application still starts. Then run 'npm audit' inside the container.`
>     *   **Evidence:** The summary log has been saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.2/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "chore(story): Complete STORY-CLEAN-1.2 - Dependency Update & Vulnerability Patching"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-CLEAN-1.3: Full Regression Testing & Remediation

1.  **Task:** Execute the full E2E regression test suite.
    *   **Instruction:** `With the full stack running via 'docker-compose up', execute the entire Cypress test suite from the project root: 'docker-compose exec frontend npx cypress run'. Capture the full output and identify any new test failures that were not present at the end of PHASE-INT-6.`
    *   **Fulfills:** Prerequisite for **INT-REQ-7.3**.
    *   **Verification via Test Cases:** The initial run's output will serve as the baseline for the next task.

2.  **Task:** Remediate regressions caused by dependency updates.
    *   **Instruction:** `Analyze the test failures from the previous task. Debug and apply the necessary code changes to the frontend application to restore compatibility with the new library versions. This may involve updating syntax, refactoring component logic to match new library APIs, or adjusting test assertions. Focus only on fixing new regressions.`
    *   **Fulfills:** This task contributes to requirement **INT-REQ-7.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `TC-CLEAN-7.3`:**
            *   [ ] **Test Method Passed:** **Evidence:** The final, passing Cypress regression suite summary has been saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.3/task-2/test-output/TC-CLEAN-7.3.log`.

---
> ### **Story Completion: STORY-CLEAN-1.3**
>
> You may only proceed once all checkboxes for all tasks within this story are marked `[x]`. Then, you **MUST** complete the following steps in order:
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests created in the project up to this point.
>     *   **Instruction:** `Run the full Cypress and mock-backend test suites one more time.`
>     *   **Evidence:** The summary logs for both test suites have been saved to `/evidence/PHASE-CLEAN-1/STORY-CLEAN-1.3/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "fix(story): Complete STORY-CLEAN-1.3 - Full Regression Testing & Remediation"'.`
>     *   **Evidence:** Provide the full commit hash returned by the Git command.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-CLEAN` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure nothing was broken by the final commits.
*   [ ] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute the full Cypress test suite one last time within the Docker Compose environment.`
    *   **Evidence:** A final summary log confirming that the regression suite passes at a rate equal to or better than the end of Phase INT-6 has been saved to `/evidence/PHASE-CLEAN-1/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-CLEAN-1` to `[x] PHASE-CLEAN-1`. This concludes your work on this phase file.