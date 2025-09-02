# Fridgr Mock Backend

A comprehensive mock backend server for the Fridgr application, providing all necessary endpoints for frontend development and testing.

## Quick Start

```bash
# Navigate to mock-backend directory
cd mock-backend

# Install dependencies
npm install

# Start the server
npm start
```

The server will start on http://localhost:8080

## Available Endpoints

### Health Check
- `GET /health` - Server health check

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh access token

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics

### Household Management
- `GET /api/v1/households` - List user's households
- `POST /api/v1/households` - Create new household
- `GET /api/v1/households/:id` - Get household details
- `PUT /api/v1/households/:id` - Update household
- `POST /api/v1/households/:id/members` - Invite member

### Inventory Management
- `GET /api/v1/households/:householdId/items` - List items
- `POST /api/v1/households/:householdId/items` - Add item
- `GET /api/v1/households/:householdId/items/:itemId` - Get item details
- `PATCH /api/v1/households/:householdId/items/:itemId` - Update item (with ETag)
- `DELETE /api/v1/households/:householdId/items/:itemId` - Delete item
- `POST /api/v1/households/:householdId/items/:itemId/consume` - Mark as consumed
- `POST /api/v1/households/:householdId/items/:itemId/waste` - Mark as wasted

## Testing

### Run Regression Tests
```bash
node runRegressionTests.js
```

### Test Utilities
The `testUtils.js` file provides utilities for:
- Database reset
- Test user creation
- Test household setup
- Test inventory items

## Project Structure

```
mock-backend/
├── index.js                 # Main server file
├── authRoutes.js           # Authentication endpoints
├── authMiddleware.js       # JWT verification middleware
├── dashboardRoutes.js      # Dashboard endpoints
├── householdRoutes.js      # Household management endpoints
├── inventoryRoutes.js      # Inventory management endpoints
├── db.js                   # In-memory database
├── testUtils.js            # Test utility functions
├── runRegressionTests.js   # Regression test suite
├── package.json            # Dependencies
└── README.md               # This file
```

## Features

- JWT-based authentication with refresh token rotation
- Role-based access control (admin, member, viewer)
- ETag support for optimistic concurrency control
- Complete inventory tracking with history
- Multi-household support
- In-memory database for development

## Development Notes

- The server uses an in-memory database that resets on restart
- JWT secret is hardcoded for development (change in production)
- CORS is enabled for all origins (restrict in production)
- Tokens expire in 15 minutes (access) and 7 days (refresh)