# UI Technical Debt

This document catalogs all mock data, conditional test logic, and API fallbacks in the Fridgr frontend codebase. Each entry includes the file path, purpose, specific method/line numbers, and clear instructions for removal when integrating with the live backend.

## Mocking and Test Environment Issues

### 1. ShoppingListDetail Optimistic Updates (TC-FE-7.5)
- **Location**: `/frontend/cypress/e2e/ShoppingListDetail.cy.ts`
- **Issue**: The checkbox toggle test fails because the optimistic update through React Query isn't properly triggered in the mock environment
- **Current State**: Test verifies the interaction flow but the UI update doesn't complete
- **Removal Plan**: When the API endpoints are fully implemented, remove the mock data fallback in `useShoppingListItems.ts` and `useUpdateShoppingListItem.ts`

### 2. Window.location Mock Limitations (TC-FE-7.2)
- **Location**: `/frontend/lib/__tests__/apiClient.test.ts`
- **Issue**: JSDOM doesn't allow proper mocking of window.location.href assignment
- **Current State**: Tests verify token clearing but can't verify redirect behavior
- **Removal Plan**: Consider using a different test environment or browser-based testing for redirect verification

### 3. Forgot Password Pages Not Implemented (TC-FE-7.6)
- **Location**: `/frontend/cypress/e2e/ForgotPassword.cy.ts`
- **Issue**: The forgot-password and reset-password pages don't exist yet
- **Current State**: Test verifies the link exists and documents expected flow
- **Removal Plan**: Implement the pages in a future phase and enable full flow testing

## Mock Data Catalog

### API Client Error Fallbacks
- **Location**: `/frontend/lib/api-client.ts`
- **Lines**: 100-182 (response interceptor)
- **Purpose**: Handles 401 errors with token refresh logic and redirect fallback
- **Method**: `apiClient.interceptors.response.use()` 
- **Current State**: Clears tokens and redirects to login on refresh failure (lines 168-172)
- **Removal Plan**: No removal needed - this is production error handling, but verify redirect behavior works with real backend

### Reports Data Mock
- **Location**: `/frontend/hooks/queries/useReportsData.ts`
- **Lines**: 31-62 (mockReportsData constant), 106-109 (fallback logic)
- **Purpose**: Provides fallback data when reports API is unavailable
- **Method**: `useReportsData()` returns mock data in catch block
- **Mock Data**: Complete reports data structure with waste tracking, category breakdown, expiry patterns
- **Removal Condition**: When `/api/v1/households/{id}/statistics` endpoint returns proper report format

### Household Data Mock
- **Location**: `/frontend/hooks/queries/useHouseholdData.ts`
- **Lines**: 54-90 (MOCK_HOUSEHOLD_DATA), 105-109 (conditional return)
- **Purpose**: Provides fallback household data during development
- **Method**: `useHouseholdData()` checks `NEXT_PUBLIC_USE_MOCK_DATA` env var
- **Mock Data**: Complete household with 3 members and statistics
- **Removal Condition**: Remove when backend is available and env var is set to false

### Expiring Items Mock
- **Location**: `/frontend/hooks/queries/useHouseholdData.ts`
- **Lines**: 125-181 (MOCK_EXPIRING_ITEMS), 197-200 (conditional return)
- **Purpose**: Provides mock expiring items for dashboard
- **Method**: `useExpiringItems()` returns mock data when API unavailable
- **Mock Data**: 5 items with various expiration statuses
- **Removal Condition**: When `/api/v1/households/{id}/items?status=expiring_soon` works

### Shopping Lists Mock
- **Location**: `/frontend/hooks/queries/useShoppingLists.ts`
- **Lines**: 20-42 (MOCK_SHOPPING_LISTS), 57-60 (fallback in catch)
- **Purpose**: Fallback shopping lists when API unavailable
- **Method**: `useShoppingLists()` returns mock in catch block
- **Mock Data**: 2 shopping lists with item counts
- **Removal Condition**: When `/api/v1/households/{id}/shopping-lists` endpoint is available

### Shopping List Details Mock
- **Location**: `/frontend/hooks/queries/useShoppingListDetails.ts`
- **Lines**: 29-39 (fallback in catch block)
- **Purpose**: Returns mock shopping list details on API failure
- **Method**: `fetchShoppingListDetails()` catch block
- **Mock Data**: Single shopping list with name and estimated total
- **Removal Condition**: When `/api/v1/households/{id}/shopping-lists/{id}` endpoint works

### Shopping List Items
- **Location**: `/frontend/hooks/queries/useShoppingListItems.ts`
- **Mock Data**: Returns 5 hardcoded items (Milk, Bread, Eggs, Apples, Yogurt)
- **Removal Condition**: When API endpoint `/api/v1/households/{id}/shopping-lists/{id}/items` is available

### Shopping List Updates
- **Location**: `/frontend/hooks/mutations/useUpdateShoppingListItem.ts`
- **Mock Data**: Returns updated item with new isCompleted status
- **Removal Condition**: When PATCH endpoint is fully functional

### Notification Settings
- **Location**: `/frontend/hooks/queries/useNotificationSettings.ts`
- **Lines**: Check file for mock fallback implementation
- **Purpose**: Returns default notification preferences on API failure
- **Method**: Returns mock data in error scenarios
- **Mock Data**: Default notification preferences object
- **Removal Condition**: When GET `/api/v1/notifications/settings` is available

## Production Guards

### Environment Variable Guards
The following files use environment variables to conditionally enable mocks:

1. **hooks/queries/useHouseholdData.ts** (lines 105, 197)
   - Guard: `process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'`
   - Purpose: Enables mock data for household and expiring items
   - Removal: Set NEXT_PUBLIC_USE_MOCK_DATA to false in production

### Cypress Environment Detection
The following files contain Cypress environment detection with production guards to prevent test code from running in production:

1. **hooks/mutations/useInventoryMutations.ts** (5 occurrences)
   - Guards: `process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as any).Cypress`
   - Purpose: Uses test household ID 'household-123' in Cypress environment

2. **hooks/queries/useInventoryItems.ts**
   - Guards: `process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as any).Cypress`
   - Purpose: Uses test household ID 'household-123' in Cypress environment

3. **components/layout/AppShell.tsx**
   - Guards: `process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as Window & { Cypress?: unknown }).Cypress`
   - Purpose: Skips authentication check in Cypress tests

4. **app/inventory/InventoryPage.tsx**
   - Guards: `process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && (window as Window & { Cypress?: unknown }).Cypress`
   - Purpose: Uses test household ID 'household-123' in Cypress environment

All mock code includes the production guard pattern:
```typescript
const isCypressEnv = process.env.NODE_ENV !== 'production' && 
  typeof window !== 'undefined' && 
  (window as any).Cypress;
```

This ensures that test-specific code paths are never executed in production builds.

## Additional Technical Debt

### Missing Authentication Pages
- **Forgot Password Page**: `/app/(auth)/forgot-password/page.tsx` - Not implemented
- **Reset Password Page**: `/app/(auth)/reset-password/page.tsx` - Not implemented
- **Impact**: Password reset flow cannot be completed
- **Removal Plan**: Implement these pages in a future phase

### SignalR/Real-time Features
- **Location**: Multiple notification and sync features
- **Issue**: SignalR integration not implemented, real-time updates use polling or are disabled
- **Impact**: No real-time notifications or inventory sync
- **Removal Plan**: Implement SignalR hub connections when backend is ready

### API Endpoint Gaps
The following endpoints are referenced but not fully implemented:
- `/api/v1/households/{id}/activity` - Recent activity feed
- `/api/v1/households/{id}/statistics` - Needs proper report data structure
- `/api/v1/notifications/telegram/*` - Telegram integration endpoints

## Mock Removal Checklist

Before production deployment:
- [ ] Set `NEXT_PUBLIC_USE_MOCK_DATA` to `false`
- [ ] Remove all `window.Cypress` conditional code
- [ ] Replace mock data fallbacks with proper error handling
- [ ] Implement missing authentication pages
- [ ] Verify all API endpoints return expected data structures
- [ ] Test auth token refresh flow with real backend
- [ ] Remove or properly guard all console.warn statements about mock data
- [ ] Verify production build excludes test-specific code paths

## Testing Dependencies

### Cypress Intercepts
All Cypress tests rely on intercepted API calls. See `/frontend/testing/mocking-catalog.md` for complete list of:
- 57 total cy.intercept calls across 15 test files
- Mock response structures for all endpoints
- Dynamic response handlers for complex scenarios

### Component Test Mocks
- SignUp.test.tsx - Uses mocked validation
- apiClient.test.ts - Limited by JSDOM environment for location mocking

## Notes

1. **Mock Data Consistency**: All mock data uses consistent IDs (household-123, user-123, etc.) to ensure tests work together
2. **Error Simulation**: Some mocks intentionally fail to test error handling (e.g., Dashboard.cy.ts line 184)
3. **Performance**: Mock delays simulate network latency (typically 300-500ms)
4. **Type Safety**: Most mocks follow TypeScript interfaces but some use `any` type

Last Updated: 2025-09-01
Version: 1.1.0