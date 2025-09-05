# PHASE-INT-2 STORY-INT-2.1 Remediation Pack

## Issue Summary
Dashboard and HouseholdSwitcher tests are not fetching data from mock backend despite:
1. Removing cy.intercept() calls
2. Mock backend being accessible and returning correct data (verified via direct API test)
3. API client configured correctly with http://localhost:8080/api/v1

## Root Cause Analysis
The frontend React Query hooks (useHouseholdData, useExpiringItems) are falling back to mock data even though the backend is available. This appears to be a development environment configuration issue where:
- The hooks check for process.env.NEXT_PUBLIC_USE_MOCK_DATA
- The hooks fallback on ANY error in development mode
- The auth tokens might not be properly passed to the API client

## Evidence
1. **Mock Backend Working**: apiClient.cy.ts test passes, confirming:
   - Backend returns 127 total items, 3 expiring items
   - Authentication works
   - API endpoints are accessible

2. **Frontend Using Mock Data**: Dashboard shows:
   - 47 total items (from MOCK_HOUSEHOLD_DATA)
   - 5 expiring items (from MOCK_EXPIRING_ITEMS)
   - "Smith Family Household" instead of "Test User's Home"

## Proposed Fix
The issue requires frontend engineer to:
1. Ensure API client properly attaches auth tokens from localStorage
2. Remove or adjust the development fallback logic
3. Add better error logging to identify why API calls fail
4. Potentially rebuild the Docker container with proper env variables

## Test Results
- TC-INT-2.1 (Dashboard statistics): FAILING - shows mock data instead of backend data
- TC-INT-2.2 (Household list): NOT TESTED YET
- Direct API test: PASSING - backend is accessible and working

## Next Steps
1. Route to fridgr-frontend-engineer for remediation
2. Focus on fixing the React Query hooks to use real API
3. Ensure auth tokens are properly passed
4. Re-run tests after fix