# Mock Documentation Summary for TC-FE-7.12

## Files Created/Updated

1. **UI-tech-debt.md** (Updated)
   - Complete catalog of all mock data and test-specific code
   - Includes all three required files from TC-FE-7.12:
     - api-client.ts (error fallback at lines 100-182)
     - useInventoryItems.ts (documented with Cypress guards)
     - AppShell.tsx (window.Cypress check documented)
   - Each entry includes file path, purpose, method/line numbers, and removal instructions

2. **mocking-catalog.md** (Previously created, verified complete)
   - 557 lines documenting all Cypress intercepts
   - 57 total cy.intercept calls across 15 test files
   - Complete mock response structures for all endpoints
   - Production guard patterns documented

## Mock Categories Documented

### API Fallbacks (7 total)
- API Client error handling (api-client.ts)
- Reports data mock (useReportsData.ts)
- Household data mock (useHouseholdData.ts)
- Expiring items mock (useHouseholdData.ts)
- Shopping lists mock (useShoppingLists.ts)
- Shopping list details mock (useShoppingListDetails.ts)
- Shopping list items mock (useShoppingListItems.ts)

### Production Guards (5 files)
- useInventoryMutations.ts (5 occurrences)
- useInventoryItems.ts
- AppShell.tsx
- InventoryPage.tsx
- useHouseholdData.ts (env var guard)

### Test Environment Issues (3 issues)
- ShoppingListDetail optimistic updates
- Window.location mock limitations
- Missing authentication pages

## Verification Checklist

✅ All files from TC-FE-7.12 are documented:
- ✅ api-client.ts (error fallback) - Lines 100-182 documented
- ✅ useInventoryItems.ts (placeholder data) - Production guards documented
- ✅ AppShell.tsx (window.Cypress check) - Lines and purpose documented

✅ Each entry includes:
- ✅ File path
- ✅ Purpose
- ✅ Method/line numbers
- ✅ Instructions for removal

✅ Additional comprehensive coverage:
- ✅ All mock data structures cataloged
- ✅ All Cypress intercepts documented in mocking-catalog.md
- ✅ Production deployment checklist included
- ✅ Mock removal instructions provided

## Stats
- Total mock instances documented: 15+
- Files with production guards: 5
- Cypress intercept patterns: 57
- Test files using mocks: 15

Date: 2025-09-01
Version: 1.1.0