# Mocking Catalog

This document provides a comprehensive catalog of ALL Cypress intercepts, mocks, and test doubles used in the Fridgr frontend test suite. This catalog is essential for maintaining test consistency and ensuring mocks remain synchronized with production APIs.

## Table of Contents
1. [API Endpoint Intercepts](#api-endpoint-intercepts)
2. [Production Guard Patterns](#production-guard-patterns)
3. [Mock Data Structures](#mock-data-structures)
4. [Test File Usage Matrix](#test-file-usage-matrix)
5. [Maintenance Guidelines](#maintenance-guidelines)

## API Endpoint Intercepts

### Authentication Endpoints

#### POST /api/v1/auth/register
- **Files Using**: `SignUp.cy.ts` (lines 11, 101)
- **Mock Response Structures**:
  ```json
  // Success Response
  {
    "user": {
      "id": "user-123",
      "email": "test@example.com",
      "displayName": "Test User"
    },
    "accessToken": "mock-access-token",
    "refreshToken": "mock-refresh-token",
    "expiresIn": 900
  }
  
  // Error Response (409 Conflict)
  {
    "statusCode": 409,
    "message": "Email already registered"
  }
  ```

#### POST /api/v1/auth/login
- **Files Using**: `Login.cy.ts` (lines 11, 58, 168, 203)
- **Mock Response Structures**:
  ```json
  // Success Response
  {
    "user": {
      "id": "user-123",
      "email": "test@example.com",
      "displayName": "Test User"
    },
    "accessToken": "mock-access-token",
    "refreshToken": "mock-refresh-token",
    "expiresIn": 900
  }
  
  // Error Response (401 Unauthorized)
  {
    "statusCode": 401,
    "message": "Invalid email or password"
  }
  ```
- **Special Handling**: Line 168 uses dynamic request handler for password validation

#### POST /api/v1/auth/forgot-password
- **Files Using**: `ForgotPassword.cy.ts` (line 8)
- **Mock Response**: 
  ```json
  {
    "message": "Password reset instructions sent to email"
  }
  ```

#### POST /api/v1/auth/reset-password
- **Files Using**: `ForgotPassword.cy.ts` (line 17)
- **Mock Response**: 
  ```json
  {
    "message": "Password successfully reset"
  }
  ```

### Household Management Endpoints

#### GET /api/v1/households
- **Files Using**: 
  - `HouseholdSwitcher.cy.ts` (line 4)
  - `HouseholdSwitcherTC-FE-2.1.cy.ts` (line 4)
  - `CreateHousehold.cy.ts` (line 17)
- **Mock Response**:
  ```json
  {
    "households": [
      {
        "id": "household-123",
        "name": "Home",
        "role": "admin",
        "memberCount": 3,
        "createdAt": "2024-01-01T00:00:00Z"
      },
      {
        "id": "household-456",
        "name": "Work",
        "role": "member",
        "memberCount": 5,
        "createdAt": "2024-01-15T00:00:00Z"
      }
    ]
  }
  ```

#### GET /api/v1/households/:id
- **Files Using**: `Dashboard.cy.ts` (lines 23, 149, 184)
- **Mock Response**:
  ```json
  {
    "id": "household-123",
    "name": "Test Household",
    "statistics": {
      "totalItems": 15,
      "expiringItems": 3,
      "expiredItems": 0,
      "consumedThisMonth": 10,
      "wastedThisMonth": 2,
      "savingsThisMonth": 45.50
    }
  }
  ```
- **Special Handling**: Line 184 simulates API error for error handling test

#### POST /api/v1/households
- **Files Using**: `CreateHousehold.cy.ts` (line 4)
- **Mock Response**:
  ```json
  {
    "id": "new-household-id",
    "name": "New Household",
    "role": "admin",
    "memberCount": 1,
    "inviteCode": "ABC123"
  }
  ```

#### GET /api/v1/households/:id/members
- **Files Using**: `InviteMember.cy.ts` (line 18)
- **Mock Response**:
  ```json
  {
    "members": [
      {
        "id": "member-1",
        "email": "user@example.com",
        "displayName": "John Doe",
        "role": "admin",
        "joinedAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
  ```

#### POST /api/v1/households/:id/members
- **Files Using**: `InviteMember.cy.ts` (line 4)
- **Mock Response**:
  ```json
  {
    "message": "Invitation sent successfully",
    "inviteCode": "INV123"
  }
  ```

### Inventory Management Endpoints

#### GET /api/v1/households/:householdId/items
- **Files Using**: 
  - `Inventory.cy.ts` (lines 61, 97, 141, 190, 237, 338, 452, 526, 621, 716)
  - `Dashboard.cy.ts` (lines 51, 164)
  - `InventorySync.cy.ts` (line 28)
  - `InventoryFilter.cy.ts` (lines 14, 57, 106, 140, 186, 254)
- **Mock Response Structures**:
  ```json
  // Standard Response
  {
    "items": [
      {
        "id": "item-1",
        "name": "Milk",
        "quantity": 1,
        "unit": "liter",
        "location": "fridge",
        "expirationDate": "2024-03-20",
        "category": "Dairy",
        "addedDate": "2024-03-01T10:00:00Z",
        "isExpiring": false,
        "isExpired": false
      }
    ],
    "totalCount": 15,
    "pageSize": 20,
    "currentPage": 1,
    "totalPages": 1
  }
  
  // Empty Response
  {
    "items": [],
    "totalCount": 0,
    "pageSize": 20,
    "currentPage": 1,
    "totalPages": 0
  }
  ```
- **Query Parameters Handled**:
  - `?search=<term>` - Text search
  - `?location=<location>` - Filter by location (fridge, freezer, pantry)
  - `?category=<category>` - Filter by category
  - `?expiringOnly=true` - Show only expiring items
  - `?page=<n>&pageSize=<n>` - Pagination

#### GET /api/v1/households/:householdId/items/:itemId
- **Files Using**: `Inventory.cy.ts` (lines 382, 470)
- **Mock Response**:
  ```json
  {
    "id": "item-1",
    "name": "Milk",
    "quantity": 1,
    "unit": "liter",
    "location": "fridge",
    "expirationDate": "2024-03-20",
    "category": "Dairy",
    "notes": "Organic whole milk",
    "barcode": "1234567890123"
  }
  ```

#### POST /api/v1/households/:householdId/items
- **Files Using**: `Inventory.cy.ts` (line 273)
- **Mock Response**:
  ```json
  {
    "id": "new-item-id",
    "name": "New Item",
    "quantity": 1,
    "unit": "piece",
    "location": "pantry",
    "expirationDate": "2024-12-31",
    "category": "Other",
    "addedDate": "2024-03-15T10:00:00Z"
  }
  ```

#### PATCH /api/v1/households/:householdId/items/:itemId
- **Files Using**: `Inventory.cy.ts` (lines 399, 486)
- **Mock Response**: Returns updated item with modified fields

#### DELETE /api/v1/households/:householdId/items/:itemId
- **Files Using**: `Inventory.cy.ts` (line 751)
- **Mock Response**: Status 204 No Content

#### POST /api/v1/households/:householdId/items/:itemId/consume
- **Files Using**: `Inventory.cy.ts` (line 570)
- **Mock Response**:
  ```json
  {
    "id": "item-to-consume",
    "quantity": 0,
    "consumedDate": "2024-03-15T10:00:00Z",
    "message": "Item fully consumed"
  }
  ```

#### POST /api/v1/households/:householdId/items/:itemId/waste
- **Files Using**: `Inventory.cy.ts` (line 657)
- **Mock Response**:
  ```json
  {
    "id": "item-to-waste",
    "quantity": 0,
    "wastedDate": "2024-03-15T10:00:00Z",
    "message": "Item marked as waste"
  }
  ```

### Statistics & Reports Endpoints

#### GET /api/v1/households/:householdId/statistics
- **Files Using**: `Reports.cy.ts` (lines 28, 87, 109, 177, 187)
- **Mock Response Structures**:
  ```json
  {
    "period": "30days",
    "summary": {
      "totalItems": 42,
      "itemsAdded": 15,
      "itemsConsumed": 10,
      "itemsWasted": 2,
      "itemsExpiring": 3,
      "wastePercentage": 16.67,
      "estimatedSavings": 125.50
    },
    "categories": [
      {
        "name": "Dairy",
        "itemCount": 8,
        "wasteCount": 1,
        "consumedCount": 5
      }
    ],
    "expirationTimeline": [
      {
        "date": "2024-03-20",
        "count": 2,
        "items": ["Milk", "Yogurt"]
      }
    ],
    "trends": {
      "waste": [
        {"date": "2024-03-01", "value": 1},
        {"date": "2024-03-08", "value": 0},
        {"date": "2024-03-15", "value": 1}
      ],
      "consumption": [
        {"date": "2024-03-01", "value": 3},
        {"date": "2024-03-08", "value": 4},
        {"date": "2024-03-15", "value": 3}
      ]
    }
  }
  ```
- **Query Parameters**: `?days=7|30|90` - Time period for statistics

### Shopping List Endpoints

#### GET /api/v1/households/:householdId/shopping-lists
- **Files Using**: `ShoppingLists.cy.ts` (lines 23, 87)
- **Mock Response**:
  ```json
  {
    "lists": [
      {
        "id": "list-1",
        "name": "Weekly Groceries",
        "itemCount": 10,
        "completedCount": 3,
        "createdAt": "2024-03-10T10:00:00Z",
        "updatedAt": "2024-03-15T14:30:00Z"
      }
    ]
  }
  ```

#### POST /api/v1/households/:householdId/shopping-lists
- **Files Using**: `ShoppingLists.cy.ts` (line 74)
- **Mock Response**:
  ```json
  {
    "id": "new-list-id",
    "name": "New Shopping List",
    "itemCount": 0,
    "completedCount": 0,
    "createdAt": "2024-03-15T10:00:00Z"
  }
  ```

### Notification Endpoints

#### GET /api/v1/notifications/settings
- **Files Using**: 
  - `NotificationSettings.cy.ts` (line 18)
  - `TelegramLink.cy.ts` (line 18)
- **Mock Response**:
  ```json
  {
    "emailEnabled": true,
    "pushEnabled": false,
    "telegramEnabled": false,
    "telegramLinked": false,
    "expirationAlerts": true,
    "lowStockAlerts": true,
    "alertDaysBefore": 3,
    "dailyDigest": false,
    "weeklyReport": true
  }
  ```

#### PUT /api/v1/notifications/settings
- **Files Using**: `NotificationSettings.cy.ts` (line 47)
- **Mock Response**: Returns updated settings with modified values
- **Special Handling**: Dynamic response based on request body

#### POST /api/v1/notifications/telegram/link
- **Files Using**: `TelegramLink.cy.ts` (line 47)
- **Mock Response**:
  ```json
  {
    "success": true,
    "linked": true,
    "telegramUsername": "@testuser",
    "linkedAt": "2024-03-15T10:00:00Z"
  }
  ```
- **Special Handling**: Validates token format before responding

### SignalR/WebSocket Endpoints

#### POST /hubs/inventory/negotiate
- **Files Using**: `InventorySync.cy.ts` (line 60)
- **Mock Response**:
  ```json
  {
    "connectionId": "connection-123",
    "availableTransports": ["WebSockets", "ServerSentEvents"]
  }
  ```

## Production Guard Patterns

All mock implementations use the following guard patterns to prevent execution in production:

### 1. Cypress Environment Detection
```typescript
const isCypressEnv = process.env.NODE_ENV !== 'production' && 
  typeof window !== 'undefined' && 
  (window as any).Cypress;
```

**Files Using This Pattern:**
- `hooks/mutations/useInventoryMutations.ts` (5 occurrences)
- `hooks/queries/useInventoryItems.ts`
- `components/layout/AppShell.tsx`
- `app/inventory/InventoryPage.tsx`

### 2. Window Type Guard
```typescript
typeof window !== 'undefined' && (window as Window & { Cypress?: unknown }).Cypress
```

**Files Using This Pattern:**
- `components/layout/AppShell.tsx`
- `app/inventory/InventoryPage.tsx`

### 3. Environment Variable Guard
```typescript
if (process.env.NEXT_PUBLIC_USE_MOCKS === 'true') {
  // Mock implementation
}
```

**Recommended for:** New mock implementations

## Mock Data Structures

### In-Memory Mock Data (hooks/queries/)

#### useShoppingListItems.ts
- **Mock Data**: Hardcoded array of 5 items (Milk, Bread, Eggs, Apples, Yogurt)
- **Removal Condition**: When `/api/v1/households/{id}/shopping-lists/{id}/items` endpoint is available
- **Production Guard**: Returns real API call in production

#### useUpdateShoppingListItem.ts
- **Mock Behavior**: Returns updated item with toggled `isCompleted` status
- **Removal Condition**: When PATCH endpoint is fully functional
- **Production Guard**: Uses real mutation in production

#### useNotificationSettings.ts
- **Mock Data**: Default notification preferences object
- **Removal Condition**: When GET `/api/v1/notifications/settings` is available
- **Production Guard**: Falls back to real API in production

### Test-Specific Mock IDs

The following IDs are used consistently across tests:
- **Test Household ID**: `household-123`
- **Test User ID**: `user-123`
- **Test Item IDs**: `item-1`, `item-2`, `item-to-consume`, `item-to-waste`, `item-to-delete`
- **Test Shopping List ID**: `list-1`
- **Test Connection ID**: `connection-123`

## Test File Usage Matrix

| Test File | Endpoints Mocked | Mock Count | Special Features |
|-----------|------------------|------------|------------------|
| `Auth.cy.ts` | `/auth/login`, `/auth/register` | 2 | Token storage validation |
| `Dashboard.cy.ts` | `/households/*`, `/items` | 5 | Error handling simulation |
| `Inventory.cy.ts` | All inventory endpoints | 15 | Full CRUD operations |
| `InventoryFilter.cy.ts` | `/items` with query params | 6 | Dynamic filtering |
| `Reports.cy.ts` | `/statistics` with time ranges | 5 | Chart data mocking |
| `ShoppingLists.cy.ts` | Shopping list CRUD | 3 | List management |
| `NotificationSettings.cy.ts` | Settings GET/PUT | 2 | Preference toggling |
| `TelegramLink.cy.ts` | Telegram linking | 2 | Token validation |
| `HouseholdSwitcher.cy.ts` | Household listing | 1 | Multi-household support |
| `CreateHousehold.cy.ts` | Household creation | 2 | Form submission |
| `InviteMember.cy.ts` | Member management | 2 | Invitation flow |
| `InventorySync.cy.ts` | SignalR negotiation | 2 | Real-time mocking |
| `ForgotPassword.cy.ts` | Password reset flow | 2 | Email verification |
| `Login.cy.ts` | Login with validation | 4 | Dynamic password check |
| `SignUp.cy.ts` | Registration flow | 2 | Duplicate email check |
| `MobileLayout.cy.ts` | - | 0 | Layout testing only |
| `PWA.cy.ts` | - | 0 | Manifest testing only |

## Maintenance Guidelines

### When to Update This Catalog

1. **New Endpoint Mocked**: Add entry with file location, response structure, and purpose
2. **Mock Structure Changed**: Update response examples and note breaking changes
3. **New Guard Pattern**: Document pattern and files using it
4. **Test File Added/Modified**: Update usage matrix
5. **Mock Removed**: Mark as deprecated with removal date

### Mock Versioning Strategy

1. **Breaking Changes**: Increment major version in mock response headers
2. **New Fields**: Add with sensible defaults to maintain compatibility
3. **Deprecations**: Add deprecation notice 2 sprints before removal

### Best Practices

1. **Consistency**: Use same mock data structures across related tests
2. **Realism**: Mock responses should match production API contracts exactly
3. **Error Cases**: Include error response mocks for robust testing
4. **Performance**: Mock network delays for realistic UX testing when needed
5. **Cleanup**: Remove test-specific data in `afterEach()` hooks

### Mock Synchronization Checklist

Before each release, verify:
- [ ] All mock responses match current API specifications
- [ ] Production guards are in place for all mock code
- [ ] Deprecated mocks are removed per schedule
- [ ] New endpoints have corresponding mocks
- [ ] Mock data is consistent across test files
- [ ] This catalog is up-to-date

### Known Issues & Tech Debt

1. **Window.location Mock Limitations** (TC-FE-7.2)
   - Location: `/frontend/lib/__tests__/apiClient.test.ts`
   - Issue: JSDOM doesn't allow proper window.location.href mocking
   - Workaround: Verify token clearing without redirect verification

2. **ShoppingListDetail Optimistic Updates** (TC-FE-7.5)
   - Location: `/frontend/cypress/e2e/ShoppingListDetail.cy.ts`
   - Issue: React Query optimistic updates not triggered in mocks
   - Plan: Remove when real API endpoints available

3. **Forgot Password Pages** (TC-FE-7.6)
   - Location: `/frontend/cypress/e2e/ForgotPassword.cy.ts`
   - Issue: Pages not yet implemented
   - Plan: Implement in future phase

## Contact & Support

For questions about mocks or to report issues:
- Check API specifications in `.pm/api-specifications.md`
- Review ICD in `.pm/ICD.md`
- Consult UI/UX specifications in `.pm/ui-ux-specifications.md`

Last Updated: 2025-09-01
Version: 1.0.0