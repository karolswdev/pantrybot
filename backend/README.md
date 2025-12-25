# Mock Backend Server

This is a comprehensive mock backend server for the Fridgr application, providing all test endpoints required for frontend development across all 7 implementation phases.

## Features

- **Authentication** (Phase 1): Full JWT-based authentication with token rotation
- **Household Management** (Phase 2): Complete household CRUD and member management
- **Inventory Management** (Phase 3): Full inventory CRUD with ETag support for optimistic concurrency
- **Real-Time Updates** (Phase 4): WebSocket support via Socket.IO for live data synchronization
- **Collaborative Shopping Lists** (Phase 5): Shared shopping lists with real-time updates
- **Dashboard & Statistics** (Phase 6): Analytics and expiring items tracking
- **Debug Utilities** (Phase 7): Database reset endpoint for testing

## Installation

```bash
npm install
```

## Running the Server

```bash
node index.js
```

The server will start on port 8080 by default.

## Complete API Endpoints Reference

### Health Check
- `GET /health` - Server health check (returns `{"status":"ok"}`)

### Authentication (Phase 1)
- `POST /api/v1/auth/register` - Register new user
  - Body: `{ email, password, displayName, timezone }`
  - Returns: `{ userId, email, displayName, accessToken, refreshToken, expiresIn, defaultHouseholdId }`
- `POST /api/v1/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ userId, accessToken, refreshToken, expiresIn, households }`
- `POST /api/v1/auth/refresh` - Refresh access token
  - Body: `{ refreshToken }`
  - Returns: `{ accessToken, refreshToken, expiresIn }`
- `POST /api/v1/auth/logout` - Logout user (invalidates refresh token)
  - Body: `{ refreshToken }`
  - Returns: `{ message }`

### Households (Phase 2)
- `GET /api/v1/households` - List user's households
  - Returns: `{ households: [{ id, name, role, memberCount }] }`
- `POST /api/v1/households` - Create new household
  - Body: `{ name, description }`
  - Returns: `{ id, name, description, timezone, createdAt, createdBy }`
- `GET /api/v1/households/:id` - Get household details with statistics
  - Returns: Complete household object with members and statistics
- `GET /api/v1/households/:id/statistics` - Get household statistics (Phase 6)
  - Returns: `{ statistics: { totalItems, expiringItems, expiredItems, consumedThisMonth, wastedThisMonth } }`
- `PUT /api/v1/households/:id` - Update household (admin only)
  - Body: `{ name?, description?, timezone? }`
- `DELETE /api/v1/households/:id` - Delete household (admin only)
- `GET /api/v1/households/:id/members` - List household members
  - Returns: `{ members: [{ userId, email, displayName, role, joinedAt }] }`
- `POST /api/v1/households/:id/invitations` - Create invitation (admin/member only)
  - Body: `{ email, role }`
  - Returns: `{ invitationId, expiresAt }`
- `PUT /api/v1/households/:id/members/:userId/role` - Update member role (admin only)
  - Body: `{ role }`
- `DELETE /api/v1/households/:id/members/:userId` - Remove member (admin only)

### Inventory Management (Phase 3)
- `GET /api/v1/households/:householdId/items` - List inventory items with filtering (Enhanced in Phase 6)
  - Query params: `category?, location?, expiring?, expired?, search?, status?`
  - `search`: Case-insensitive search on item name
  - `status`: Filter by expiration status (fresh|expiring_soon|expired|no_expiry)
  - Returns: Paginated items list with metadata
- `POST /api/v1/households/:householdId/items` - Add inventory item
  - Body: `{ name, quantity, unit, location, category, expirationDate?, notes? }`
  - Returns: Created item with expiration status
- `GET /api/v1/households/:householdId/items/:itemId` - Get item details
  - Returns: Item with ETag header for optimistic concurrency
- `PATCH /api/v1/households/:householdId/items/:itemId` - Update item
  - Headers: `If-Match: <etag>` (required)
  - Body: Fields to update
  - Returns: Updated item with new ETag
- `DELETE /api/v1/households/:householdId/items/:itemId` - Delete item
- `POST /api/v1/households/:householdId/items/:itemId/consume` - Mark as consumed
  - Body: `{ quantity, reason?, notes? }`
  - Returns: `{ remainingQuantity, consumedQuantity, consumedAt, consumedBy }`
- `POST /api/v1/households/:householdId/items/:itemId/waste` - Mark as wasted
  - Body: `{ quantity, reason?, notes? }`
  - Returns: `{ remainingQuantity, wastedQuantity, wastedAt, wastedBy }`
- `POST /api/v1/households/:householdId/items/:itemId/move` - Move item location
  - Body: `{ newLocation, notes? }`
  - Returns: Updated item
- `GET /api/v1/households/:householdId/items/expiring` - Get expiring items
  - Query params: `days?` (default: 7)
  - Returns: Items expiring within specified days
- `GET /api/v1/households/:householdId/items/history` - Get item history
  - Query params: `itemId?, action?, startDate?, endDate?`
  - Returns: Filtered history entries

### Dashboard & Analytics (Phase 6)
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
  - Returns: `{ totalItems, expiringItems, expiredItems, consumedThisMonth, wastedThisMonth }`

### Notifications (Phase 4)
- `GET /api/v1/notifications/settings` - Get notification settings
  - Returns: User's notification preferences
- `PUT /api/v1/notifications/settings` - Update notification settings
  - Body: `{ email?, inApp?, telegram?, preferences? }`
- `POST /api/v1/notifications/telegram/link` - Link Telegram account
  - Body: `{ username }`
  - Returns: `{ linked, username }`

### Shopping Lists (Phase 5)
- `GET /api/v1/households/:householdId/shopping-lists` - List shopping lists
  - Returns: `{ lists: [{ id, name, notes, itemCount, completedCount, createdAt, createdBy, lastUpdated }] }`
- `POST /api/v1/households/:householdId/shopping-lists` - Create shopping list
  - Body: `{ name, notes? }`
  - Returns: Created shopping list
- `GET /api/v1/households/:householdId/shopping-lists/:listId` - Get shopping list details
  - Returns: Shopping list with all items
- `PUT /api/v1/households/:householdId/shopping-lists/:listId` - Update shopping list
  - Body: `{ name?, notes? }`
- `DELETE /api/v1/households/:householdId/shopping-lists/:listId` - Delete shopping list
- `GET /api/v1/households/:householdId/shopping-lists/:listId/items` - Get shopping list items
  - Returns: `{ items: [{ id, name, quantity, unit, category, notes, completed, completedBy, completedAt, addedBy, addedAt }] }`
- `POST /api/v1/households/:householdId/shopping-lists/:listId/items` - Add item to shopping list
  - Body: `{ name, quantity?, unit?, category?, notes? }`
  - Returns: Created shopping list item
- `PATCH /api/v1/households/:householdId/shopping-lists/:listId/items/:itemId` - Update shopping list item
  - Body: `{ completed?, name?, quantity?, unit?, category?, notes? }`
  - Returns: Updated item
- `DELETE /api/v1/households/:householdId/shopping-lists/:listId/items/:itemId` - Remove item from list

### Debug Endpoints (Phase 7)
- `POST /debug/reset-state` - Reset in-memory database to empty state
  - No authentication required (development only)
  - Returns: `{ message, timestamp }`

### Test Utilities (Development Only)
- `POST /api/v1/test/reset-db` - Alternative database reset endpoint
  - Returns: `{ message }`

## WebSocket Events (Phase 4)

The server uses Socket.IO for real-time updates. Connect with a valid JWT token in the auth handshake.

### Connection

```javascript
const socket = io('http://localhost:8080', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events Emitted to Clients

#### Inventory Events
- `item.added` - New item added to inventory
  - Payload: `{ itemId, name, quantity, location, category, householdId, addedBy }`
- `item.updated` - Item updated
  - Payload: `{ itemId, changes, householdId, updatedBy }`
- `item.deleted` - Item deleted
  - Payload: `{ itemId, householdId, deletedBy }`
- `item.consumed` - Item consumed
  - Payload: `{ itemId, consumedQuantity, remainingQuantity, householdId, consumedBy }`
- `item.wasted` - Item wasted
  - Payload: `{ itemId, wastedQuantity, remainingQuantity, householdId, wastedBy }`

#### Shopping List Events
- `shoppinglist.created` - New shopping list created
  - Payload: `{ listId, name, householdId, createdBy }`
- `shoppinglist.updated` - Shopping list updated
  - Payload: `{ listId, changes, householdId, updatedBy }`
- `shoppinglist.deleted` - Shopping list deleted
  - Payload: `{ listId, householdId, deletedBy }`
- `shoppinglist.item.added` - Item added to shopping list
  - Payload: `{ listId, itemId, name, householdId, addedBy }`
- `shoppinglist.item.updated` - Shopping list item updated
  - Payload: `{ listId, itemId, changes, householdId, updatedBy }`
- `shoppinglist.item.removed` - Item removed from shopping list
  - Payload: `{ listId, itemId, householdId, removedBy }`

All events are scoped to household rooms, ensuring only members of the same household receive updates.

## Authentication & Authorization

### JWT Token Structure
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Tokens include: `sub` (userId), `email`, `type`, `iat`, `exp`, `aud`, `iss`

### Required Headers
All protected endpoints require:
```
Authorization: Bearer <access-token>
```

### Role-Based Access Control
- **Admin**: Full household management, can invite/remove members
- **Member**: Can manage items and shopping lists, invite viewers
- **Viewer**: Read-only access to household data

## Optimistic Concurrency Control

Inventory items support optimistic concurrency via ETags:

1. GET item returns ETag header: `ETag: W/"1"`
2. PATCH requires If-Match header: `If-Match: W/"1"`
3. Conflicts return 409 with current state

## Data Storage

This mock backend uses in-memory storage. All data is lost when the server restarts. This is intentional for testing purposes.

## Testing

### Available Test Scripts
- `journey-test.js` - Complete end-to-end user journey test
- `run-full-regression.js` - Comprehensive regression test suite
- `test-shopping-lists.js` - Shopping list functionality tests
- `test-websocket.js` - WebSocket event tests

### Running Tests

```bash
# Run journey test
node journey-test.js

# Run full regression
node run-full-regression.js

# Test specific phase
node test-phase-5-qa.js
```

## Environment Variables

- `PORT` - Server port (default: 8080)
- `JWT_SECRET` - JWT signing secret (default: mock-secret-key)
- `NODE_ENV` - Environment (development/production)

## Error Responses

Standard error format:
```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (ETag mismatch)
- `428` - Precondition Required (missing If-Match)
- `500` - Internal Server Error

## Development Notes

- This is a mock backend for development and testing purposes only
- Do not use in production environments
- All data is stored in memory and will be lost on restart
- Debug endpoints are only available when NODE_ENV !== 'production'
- The `/debug/reset-state` endpoint allows resetting the database for repeatable tests

## Phase Implementation Status

- ✅ Phase 1: Authentication & JWT Management
- ✅ Phase 2: Household Management
- ✅ Phase 3: Core Inventory CRUD
- ✅ Phase 4: Real-Time Sync & Notifications
- ✅ Phase 5: Collaborative Shopping Lists
- ✅ Phase 6: Dashboard & Analytics
- ✅ Phase 7: Hardening & Debug Tools

## Version

Mock Backend v1.0.0 - All 7 phases complete