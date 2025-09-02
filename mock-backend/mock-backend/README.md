# Mock Backend Server

This is a mock backend server for the Fridgr application, providing test endpoints for frontend development.

## Features

- **Authentication**: Register, login, refresh token endpoints
- **Household Management**: Create, update, delete households and manage members
- **Inventory Management**: Full CRUD operations for inventory items with ETag support
- **Dashboard**: Statistics and expiring items endpoints
- **Notifications**: Manage notification settings and Telegram linking
- **WebSocket Support**: Real-time updates using Socket.IO for inventory changes

## Installation

```bash
npm install
```

## Running the Server

```bash
node index.js
```

The server will start on port 8080 by default.

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

### Households
- `GET /api/v1/households` - List user's households
- `POST /api/v1/households` - Create new household
- `GET /api/v1/households/:id` - Get household details
- `PUT /api/v1/households/:id` - Update household
- `DELETE /api/v1/households/:id` - Delete household
- `GET /api/v1/households/:id/members` - List household members
- `POST /api/v1/households/:id/invitations` - Create invitation
- `PUT /api/v1/households/:id/members/:userId/role` - Update member role
- `DELETE /api/v1/households/:id/members/:userId` - Remove member

### Inventory
- `GET /api/v1/households/:householdId/items` - List inventory items
- `POST /api/v1/households/:householdId/items` - Add inventory item
- `GET /api/v1/households/:householdId/items/:itemId` - Get item details
- `PATCH /api/v1/households/:householdId/items/:itemId` - Update item (with ETag support)
- `DELETE /api/v1/households/:householdId/items/:itemId` - Delete item
- `POST /api/v1/households/:householdId/items/:itemId/consume` - Mark as consumed
- `POST /api/v1/households/:householdId/items/:itemId/waste` - Mark as wasted
- `POST /api/v1/households/:householdId/items/:itemId/move` - Move item location
- `GET /api/v1/households/:householdId/items/expiring` - Get expiring items
- `GET /api/v1/households/:householdId/items/history` - Get item history

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics

### Notifications
- `GET /api/v1/notifications/settings` - Get notification settings
- `PUT /api/v1/notifications/settings` - Update notification settings
- `POST /api/v1/notifications/telegram/link` - Link Telegram account

### WebSocket Events

The server uses Socket.IO for real-time updates. Connect with a valid JWT token in the auth handshake.

#### Events Emitted to Clients:
- `item.added` - When a new item is added to inventory
- `item.updated` - When an item is updated
- `item.deleted` - When an item is deleted

All events are scoped to household rooms, so only members of the same household receive updates.

## Authentication

All endpoints except `/auth/register` and `/auth/login` require a valid JWT Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## WebSocket Connection

Connect to the WebSocket server using Socket.IO client:

```javascript
const socket = io('http://localhost:8080', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Data Storage

This mock backend uses in-memory storage. All data is lost when the server restarts. This is intentional for testing purposes.

## Testing

Various test scripts are available:
- `test_phase3.sh` - Test Phase 3 endpoints
- `test_regression.sh` - Run regression tests
- `run-full-regression.js` - Node.js regression test runner

## Environment Variables

- `PORT` - Server port (default: 8080)
- `JWT_SECRET` - JWT signing secret (default: mock-secret)

## Notes

This is a mock backend for development and testing purposes only. It should not be used in production.