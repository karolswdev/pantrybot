### **[ ] PHASE-DEPLOY-1: MVP Deployment to Staging VPS**

> ### **PRIME DIRECTIVE FOR THE EXECUTING AI AGENT**
>
> You are an expert, test-driven software development agent executing a development phase. You **MUST** adhere to the following methodology without deviation:
>
> 1.  **Understand the Contract:** Begin by reading Section 2 ("Phase Scope & Verification Cases") in its entirety. This is your reference library for **what** to create and **how** to prove success.
> 2.  **Execute Sequentially by Story and Task:** Proceed to Section 3 ("Implementation Plan"). Address each **Story** in order. Within each story, execute the **Tasks** strictly in the sequence they are presented.
> 3.  **Process Each Task Atomically (Code -> Test -> Document -> Traceability):** For each task, you will create the required scripts and configurations. The final story outlines the manual verification steps to be performed by a human operator.
> 4.  **Commit Work:** You **MUST** create a Git commit at the completion of each story. This is a non-negotiable step.
> 5.  **Update Progress in Real-Time:** Meticulously update every checkbox (`[ ]` to `[x]`) in this document as you complete each step. Your progress tracking must be flawless.

---

### **1. Phase Context (What & Why)**

| ID | Title |
| :--- | :--- |
| PHASE-DEPLOY-1 | MVP Deployment to Staging VPS |

> **As a** Development Team, **I want** to prepare all necessary configurations and scripts to deploy the full Fridgr application (frontend and mock backend) to a staging Ubuntu VPS, **so that** an operator can manually execute the deployment and verify its functionality in a production-like environment.

---

### **2. Phase Scope & Verification Cases (The Contract)**

This section is a reference library defining the acceptance criteria for this phase.

*   **Requirement:** **DEPLOY-REQ-1.1** - The application MUST be securely accessible over the internet via its designated domains after manual deployment.
    *   **Verification Case ID:** `VC-DEPLOY-1.1`
        *   **Verification Method:** `ManualSystemVerification - FrontendIsLive`
        *   **Verification Logic:** (Manual System Test) - After deployment, from a local machine, execute `curl -s -L https://pantrybot.app`. Assert the command returns a `200 OK` status and the response body contains HTML with the title "Fridgr".
        *   **Required Proof of Passing:** The full `curl` command and its output must be saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-2/test-output/VC-DEPLOY-1.1.log`.
    *   **Verification Case ID:** `VC-DEPLOY-1.2`
        *   **Verification Method:** `ManualSystemVerification - MockBackendIsLive`
        *   **Test Logic:** (Manual System Test) - After deployment, execute `curl -s https://api.pantrybot.app/health`. Assert the command returns a `200 OK` status and the JSON body `{"status":"ok"}`.
        *   **Required Proof of Passing:** The `curl` command and its output must be saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-2/test-output/VC-DEPLOY-1.2.log`.

*   **Requirement:** **DEPLOY-REQ-1.2** - The artifact creation process MUST be automated through a CI/CD pipeline.
    *   **Verification Case ID:** `VC-DEPLOY-1.3`
        *   **Verification Method:** `SystemVerification - CIWorkflowExists`
        *   **Test Logic:** (System Test) - Verify the existence of `.github/workflows/deploy-staging.yml`. The file must contain jobs to build and push Docker images to `ghcr.io` but **MUST NOT** contain a deployment job with SSH.
        *   **Required Proof of Passing:** The full content of the `.github/workflows/deploy-staging.yml` file.

*   **Requirement:** **DEPLOY-REQ-1.3** - The Nginx and SSL setup MUST be scriptable.
    *   **Verification Case ID:** `VC-DEPLOY-1.4`
        *   **Verification Method:** `SystemVerification - NginxScriptGeneratesConfig`
        *   **Test Logic:** (Automated Script Test) - Execute `scripts/generate-nginx-conf.sh pantrybot.app`. Assert the script creates a `pantrybot.app.conf` file. Assert the file contains the server names `pantrybot.app` and `api.pantrybot.app`, and the correct `proxy_pass` directives.
        *   **Required Proof of Passing:** The test execution log showing the successful generation and validation of the Nginx config file.
    *   **Verification Case ID:** `VC-DEPLOY-1.5`
        *   **Verification Method:** `SystemVerification - SSLScriptIsCorrect`
        *   **Test Logic:** (Manual Review) - Review the `scripts/setup-ssl.sh` script. Assert that it correctly calls `certbot` with the `--nginx` flag and specifies the `-d` flag for both `pantrybot.app` and `api.pantrybot.app`.
        *   **Required Proof of Passing:** A brief report confirming the script's correctness.

*   **Requirement:** **DEPLOY-REQ-1.4** - The application MUST be fully functional after manual deployment.
    *   **Verification Case ID:** `VC-DEPLOY-1.6`
        *   **Verification Method:** `ManualE2EVerification - LoginOnStaging`
        *   **Test Logic:** (E2E Test) - After deployment, configure a local Cypress suite by setting `baseUrl` to `https://pantrybot.app`. Execute the `Login.cy.ts` spec. The test must successfully log in and redirect to the dashboard.
        *   **Required Proof of Passing:** The Cypress test runner output showing the `Login.cy.ts` suite passing against the staging URL.

---

### **3. Implementation Plan (The Execution)**

#### [ ] STORY-DEPLOY-1.1: Environment and Server Configuration Scripting

1.  **Task:** Create a Staging Docker Compose override file.
    *   **Instruction:** `Create a new file named 'docker-compose.staging.yml'. This file will override 'docker-compose.yml'. Modify the 'frontend' service to set 'NEXT_PUBLIC_API_URL' to 'https://api.pantrybot.app/api/v1'. Remove all 'ports' mappings, as Nginx will handle external traffic.`
    *   **Fulfills:** Prerequisite for **DEPLOY-REQ-1.1**.
    *   **Verification via Test Cases:** Correctness verified by manual deployment success.

2.  **Task:** Create a script to generate the Nginx site configuration.
    *   **Instruction:** `Create an executable script at 'scripts/generate-nginx-conf.sh'. It must accept a domain name as an argument (e.g., pantrybot.app). The script will generate a '<domain>.conf' file containing two server blocks: one for the root domain proxying to 'http://localhost:3010' and one for 'api.<domain>' proxying to 'http://localhost:8088'. Include WebSocket support for the API proxy.`. Ensure that the local ports (which are different than in the original docker-compose.yaml file are correct, 3010 and 8088.)
    *   **Fulfills:** This task contributes to requirement **DEPLOY-REQ-1.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `VC-DEPLOY-1.4`:**
            *   [x] **Test Method Passed:** Checked after the test passes. **Evidence:** Test script output saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.1/task-2/test-output/VC-DEPLOY-1.4.log`.

3.  **Task:** Create the SSL certificate setup script.
    *   **Instruction:** `Create an executable script at 'scripts/setup-ssl.sh'. This script will take a domain name as an argument. It must perform the following:
        1.  Install Certbot and its Nginx plugin (`python3-certbot-nginx`).
        2.  Run `certbot --nginx -d <domain> -d api.<domain> --non-interactive --agree-tos -m <your-email@example.com>`.
        3.  Ensure Certbot's auto-renewal timer is enabled.`
    *   **Fulfills:** This task contributes to requirement **DEPLOY-REQ-1.3**.
    *   **Verification via Test Cases:**
        *   **Test Case `VC-DEPLOY-1.5`:**
            *   [x] **Test Method Passed:** Checked after manual review. **Evidence:** A review summary saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.1/task-3/review/VC-DEPLOY-1.5.md`.

---
> ### **Story Completion: STORY-DEPLOY-1.1**
>
> 1.  **Run Full Regression Test:**
>     *   [x] **All Prior Tests Passed:** Run the automated script test for `VC-DEPLOY-1.4`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(deploy): Complete STORY-DEPLOY-1.1 - Staging Environment Configuration and Scripting"'.`
>     *   **Evidence:** Provide the full commit hash.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the commit is created, update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-DEPLOY-1.2: CI Pipeline and Manual Deployment Script

1.  **Task:** Create the manual deployment script.
    *   **Instruction:** `Create an executable script at 'scripts/deploy.sh'. This script, intended for manual execution on the VPS, must:
        1.  Log in to `ghcr.io` (prompting for a token).
        2.  Pull the latest images using 'docker-compose -f docker-compose.yml -f docker-compose.staging.yml pull'.
        3.  Restart services using 'docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d'.
        4.  Prune old Docker images.`
    *   **Fulfills:** Prerequisite for **DEPLOY-REQ-1.2**.
    *   **Verification via Test Cases:** Verified by successful manual execution.

2.  **Task:** Create the GitHub Actions workflow for building artifacts.
    *   **Instruction:** `Create '.github/workflows/deploy-staging.yml'. The workflow must trigger on a push to 'main'. It will only build and push the 'frontend' and 'mock-backend' Docker images to 'ghcr.io'. It **MUST NOT** contain any steps to SSH or deploy to the server.`
    *   **Fulfills:** This task contributes to requirement **DEPLOY-REQ-1.2**.
    *   **Verification via Test Cases:**
        *   **Test Case `VC-DEPLOY-1.3`:**
            *   [ ] **Test Method Passed:** Checked after the workflow file is created and reviewed. **Evidence:** The full content of the file is saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.2/task-2/documentation/deploy-workflow.yml`.

---
> ### **Story Completion: STORY-DEPLOY-1.2**
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** N/A for this story.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "feat(ci): Complete STORY-DEPLOY-1.2 - CI Artifact Pipeline and Manual Deployment Script"'.`
>     *   **Evidence:** Provide the full commit hash.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the commit is created, update this story's main checkbox from `[ ]` to `[x]`.

---

#### [ ] STORY-DEPLOY-1.3: Manual Deployment and Verification

1.  **Task:** Manually execute the deployment on the staging VPS.
    *   **Instruction:** `This is a manual task for the human operator. Follow these steps on the VPS:
        1.  SSH into the server.
        2.  Run 'git pull' to get the latest scripts.
        3.  Execute 'sudo ./scripts/generate-nginx-conf.sh pantrybot.app'.
        4.  Execute 'sudo cp pantrybot.app.conf /etc/nginx/sites-available/'.
        5.  Execute 'sudo ln -s /etc/nginx/sites-available/pantrybot.app.conf /etc/nginx/sites-enabled/'.
        6.  Execute 'sudo ./scripts/setup-ssl.sh pantrybot.app'.
        7.  Execute './scripts/deploy.sh'.
        Document any issues encountered.`
    *   **Fulfills:** Manual execution step for all requirements.

2.  **Task:** Manually verify service accessibility.
    *   **Instruction:** `This is a manual task for the human operator. From your local machine, run the verification commands defined in the Verification Cases to confirm the services are live and accessible.`
    *   **Fulfills:** This task contributes to requirement **DEPLOY-REQ-1.1**.
    *   **Verification via Test Cases:**
        *   **Test Case `VC-DEPLOY-1.1`:**
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** The log has been saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-2/test-output/VC-DEPLOY-1.1.log`.
        *   **Test Case `VC-DEPLOY-1.2`:**
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** The log has been saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-2/test-output/VC-DEPLOY-1.2.log`.

3.  **Task:** Run E2E verification against the staging environment.
    *   **Instruction:** `This is a manual task for the human operator. On your local machine, temporarily modify 'cypress.config.ts' to set 'baseUrl' to 'https://pantrybot.app' and run the 'Login.cy.ts' test suite.`
    *   **Fulfills:** This task contributes to requirement **DEPLOY-REQ-1.4**.
    *   **Verification via Test Cases:**
        *   **Test Case `VC-DEPLOY-1.6`:**
            *   [ ] **Test Method Passed:** Checked after the test passes. **Evidence:** The test output log has been saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-3/test-output/VC-DEPLOY-1.6.log`.

4.  **Task:** Update Traceability Matrix.
    *   **Instruction:** `Update '.pm/system/common/traceability.md' with a new section for Deployment Requirements, linking all DEPLOY-REQ IDs to their verification statuses.`
    *   **Fulfills:** Traceability requirements.
    *   **Traceability:**
        *   [ ] **Traceability Matrix Updated:** Checked after updating the matrix. **Evidence:** A diff of `traceability.md` has been saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-4/traceability/traceability-update.diff`.

---
> ### **Story Completion: STORY-DEPLOY-1.3**
>
> 1.  **Run Full Regression Test:**
>     *   [ ] **All Prior Tests Passed:** Checked after running all tests against the staging environment.
>     *   **Instruction:** `Run the full Cypress suite against 'https://pantrybot.app'.`
>     *   **Evidence:** Summary saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/regression-test.log`.
> 2.  **Create Git Commit:**
>     *   [ ] **Work Committed:** Checked after creating the Git commit.
>     *   **Instruction:** `Execute 'git add .' followed by 'git commit -m "docs(deploy): Complete STORY-DEPLOY-1.3 - Manual Deployment and Verification"'.`
>     *   **Evidence:** Provide the full commit hash.
> 3.  **Finalize Story:**
>     *   **Instruction:** Once the two checkboxes above are complete, you **MUST** update this story's main checkbox from `[ ]` to `[x]`.

---

### **4. Definition of Done**

This Phase is officially complete **only when all `STORY-DEPLOY` checkboxes in Section 3 are marked `[x]` AND the Final Acceptance Gate below is passed.**

#### Final Acceptance Gate

*   **Instruction:** You are at the final gate for this phase. Before marking the entire phase as done, you must perform one last, full regression test to ensure the deployed application is stable.
*   [ ] **Final Full Regression Test Passed:**
    *   **Instruction:** `Execute the 'Login.cy.ts' test suite one last time against the staging URL.`
    *   **Evidence:** A final summary log confirming that `VC-DEPLOY-1.6` passes has been saved to `/evidence/PHASE-DEPLOY-1/final-acceptance-gate.log`.

*   **Final Instruction:** Once the `Final Full Regression Test Passed` checkbox above is marked `[x]`, your final action for this phase is to modify the main title of this document, changing `[ ] PHASE-DEPLOY-1` to `[x] PHASE-DEPLOY-1`. This concludes your work on this phase file.