# Operator Guide for STORY-DEPLOY-1.3 Completion

## Summary
This document outlines the current status of STORY-DEPLOY-1.3 and the manual steps required for completion.

## Automated Tasks Completed

### Task 4: Traceability Matrix Update ✅
- **Status:** COMPLETED
- **Action Taken:** Added new "Deployment Requirements Traceability" section to `.pm/system/common/traceability.md`
- **Evidence:** Diff saved to `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-4/traceability/traceability-update.diff`

### Documentation Created
- **Manual Deployment Steps:** `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-1/documentation/manual-deployment-steps.md`
- **Placeholder Evidence Files:** Created for all manual verification tasks

## Manual Tasks Required (Human Operator)

### Task 1: Manual Deployment on Staging VPS ⏳
**Status:** REQUIRES MANUAL EXECUTION

Follow the steps in: `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-1/documentation/manual-deployment-steps.md`

1. SSH into the staging VPS
2. Pull latest code from git repository
3. Run `sudo ./scripts/generate-nginx-conf.sh pantrybot.app`
4. Copy Nginx config: `sudo cp pantrybot.app.conf /etc/nginx/sites-available/`
5. Enable site: `sudo ln -s /etc/nginx/sites-available/pantrybot.app.conf /etc/nginx/sites-enabled/`
6. Setup SSL: `sudo ./scripts/setup-ssl.sh pantrybot.app`
7. Deploy application: `./scripts/deploy.sh`

### Task 2: Manual Service Verification ⏳
**Status:** REQUIRES MANUAL EXECUTION

After deployment, execute these verification commands from your local machine:

1. **VC-DEPLOY-1.1 - Frontend Accessibility:**
   ```bash
   curl -s -L -w "\nHTTP Status: %{http_code}\n" https://pantrybot.app
   ```
   Save output to: `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-2/test-output/VC-DEPLOY-1.1.log`

2. **VC-DEPLOY-1.2 - Backend Health Check:**
   ```bash
   curl -s -w "\nHTTP Status: %{http_code}\n" https://api.pantrybot.app/health
   ```
   Save output to: `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-2/test-output/VC-DEPLOY-1.2.log`

### Task 3: E2E Verification ⏳
**Status:** REQUIRES MANUAL EXECUTION

1. Modify local `cypress.config.ts` to use `baseUrl: 'https://pantrybot.app'`
2. Run: `npx cypress run --spec "cypress/e2e/Login.cy.ts"`
3. Save output to: `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/task-3/test-output/VC-DEPLOY-1.6.log`

### Story Regression Test ⏳
**Status:** REQUIRES MANUAL EXECUTION

Run full Cypress suite against staging:
```bash
npx cypress run --config baseUrl=https://pantrybot.app
```
Save output to: `/evidence/PHASE-DEPLOY-1/STORY-DEPLOY-1.3/regression-test.log`

## After Manual Completion

Once all manual tasks are complete and evidence files are populated:

1. Update the phase file checkboxes for Tasks 1-3
2. Mark the regression test checkbox
3. Create the final git commit:
   ```bash
   git add .
   git commit -m "docs(deploy): Complete STORY-DEPLOY-1.3 - Manual Deployment and Verification"
   ```
4. Update the Story checkbox to [x]
5. Record the commit hash in the phase file

## Current Git Status

The following files have been created/modified and are ready for commit after manual verification:
- `.pm/system/common/traceability.md` - Added deployment requirements section
- Evidence directory structure created
- Documentation and placeholder files created

## Important Notes

- Tasks 1-3 CANNOT be automated as they require:
  - SSH access to the VPS
  - GitHub personal access token for Docker registry
  - Local Cypress test execution
  - Manual verification of live services

- All placeholder evidence files have been created with instructions for the operator
- The traceability matrix has been updated with deployment requirements (Task 4 ✅)