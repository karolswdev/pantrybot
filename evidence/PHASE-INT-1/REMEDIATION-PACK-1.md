# Remediation Pack for STORY-INT-1.2
## Phase: PHASE-INT-1 (Integration Foundation & User Authentication)

## Current Status: RED ❌
Tests are failing due to UI interaction issues after removing API mocks.

## Test Failures Summary

### TC-INT-1.2: User Registration Test
**File:** `cypress/e2e/SignUp.cy.ts`
**Error:** Cannot interact with combobox elements
```
AssertionError: Timed out retrying after 4000ms: `cy.select()` failed because this element is not visible
```

**Root Cause:**
- The combobox trigger button has `pointer-events: none` CSS property
- Elements are not interactable in the current state

### TC-INT-1.3: User Login Test  
**File:** `cypress/e2e/Login.cy.ts`
**Status:** Not yet tested (blocked by registration test)

### TC-INT-1.4: Token Refresh Test
**File:** `cypress/e2e/apiClient.cy.ts`
**Status:** Created but not yet tested

## Required Fixes

### 1. Fix Combobox Interaction (Priority: HIGH)
**Location:** `cypress/e2e/SignUp.cy.ts`, lines 15-17
**Current Code:**
```typescript
cy.get('[data-testid="role-select"]').click();
cy.get('[role="option"][data-value="member"]').click();
```

**Issue:** The combobox elements have CSS preventing interaction
**Suggested Fix:** 
- Check if the UI uses a different interaction pattern
- May need to force clicks or use different selectors
- Consider using `cy.get().click({force: true})` temporarily

### 2. Fix Password Strength Selector
**Location:** `cypress/e2e/SignUp.cy.ts`, line 24
**Current Code:**
```typescript
cy.get('[data-testid="password-strength-indicator"]').should('contain', 'Strong');
```

**Issue:** Element doesn't exist with this test ID
**Suggested Fix:** 
- Verify the actual element in the UI
- Update selector to match implementation

### 3. Update Test Environment Setup
**Issue:** Tests may need proper setup/teardown with mock backend
**Suggested Additions:**
```typescript
beforeEach(() => {
  // Reset mock backend state
  cy.request('POST', 'http://localhost:8080/api/v1/debug/reset-state');
});
```

## Test Execution Commands

To reproduce the failures:
```bash
# Start the full stack
docker-compose up -d

# Run the specific failing test
npm run cypress:run -- --spec "cypress/e2e/SignUp.cy.ts"
```

## Evidence Locations
- Test outputs: `/evidence/PHASE-INT-1/STORY-INT-1.2/task-2/test-output/`
- Docker logs: `/evidence/PHASE-INT-1/STORY-INT-1.1/task-1/logs/`

## Success Criteria
All three test cases must pass:
1. TC-INT-1.2: User registration against mock backend ✅
2. TC-INT-1.3: User login against mock backend ✅  
3. TC-INT-1.4: Token refresh against mock backend ✅

## Next Steps After Fix
1. Run all three test cases
2. Save passing test outputs to evidence directory
3. Update traceability matrix
4. Create git commit for STORY-INT-1.2
5. Run final regression test for phase completion