# API Specifications

## API Overview

Base URL: `https://api.fridgr.app/api/v1`

### Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_access_token>
```

**Token Lifecycle:**
- Access Token: 15 minutes expiry
- Refresh Token: 7 days expiry (rotating)
- Refresh tokens are single-use and rotated on each refresh

### Common Headers
```
Content-Type: application/json
Accept: application/json
X-Household-Id: <uuid> (optional, for household context)
X-Request-Id: <uuid> (optional, for tracing)
```

### Rate Limiting
- 100 requests per minute per user
- 1000 requests per hour per user
- Rate limit headers included in all responses

### Pagination
```
GET /api/v1/resource?page=1&pageSize=20&sortBy=createdAt&sortOrder=desc
```

## Authentication Endpoints

### Register User
```http
POST /api/v1/auth/register

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe",
  "timezone": "America/New_York"
}

Response: 201 Created
{
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "email": "user@example.com",
  "displayName": "John Doe",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900, // 15 minutes in seconds
  "defaultHouseholdId": "550e8400-e29b-41d4-a716-446655440002"
}

Errors:
- 400: Invalid email format or weak password
- 409: Email already registered
```

### Login
```http
POST /api/v1/auth/login

Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response: 200 OK
{
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900, // 15 minutes in seconds
  "households": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Home",
      "role": "admin"
    }
  ]
}

Errors:
- 401: Invalid credentials
- 429: Too many failed attempts
```

### Refresh Token
```http
POST /api/v1/auth/refresh

Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response: 200 OK
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 900
}

Errors:
- 401: Invalid or expired refresh token
```

### Logout
```http
POST /api/v1/auth/logout

Headers:
Authorization: Bearer <token>

Request:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}

Response: 204 No Content

Errors:
- 401: Unauthorized
```

### Forgot Password
```http
POST /api/v1/auth/forgot-password

Request:
{
  "email": "user@example.com"
}

Response: 200 OK
{
  "message": "If the email exists, a password reset link has been sent"
}
```

### Reset Password
```http
POST /api/v1/auth/reset-password

Request:
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!"
}

Response: 200 OK
{
  "message": "Password successfully reset"
}

Errors:
- 400: Invalid or expired token
- 400: Weak password
```

## Household Management Endpoints

### List User's Households
```http
GET /api/v1/households

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "households": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Home",
      "description": "Family household",
      "role": "admin",
      "memberCount": 4,
      "itemCount": 127,
      "expiringItemCount": 3,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

### Create Household
```http
POST /api/v1/households

Headers:
Authorization: Bearer <token>

Request:
{
  "name": "Beach House",
  "description": "Vacation home inventory",
  "timezone": "America/Los_Angeles"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "name": "Beach House",
  "description": "Vacation home inventory",
  "timezone": "America/Los_Angeles",
  "createdAt": "2024-01-15T00:00:00Z",
  "createdBy": "550e8400-e29b-41d4-a716-446655440001"
}

Errors:
- 400: Invalid data
- 403: User limit reached
```

### Get Household Details
```http
GET /api/v1/households/{householdId}

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Home",
  "description": "Family household",
  "timezone": "America/New_York",
  "members": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "email": "user@example.com",
      "displayName": "John Doe",
      "role": "admin",
      "joinedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "statistics": {
    "totalItems": 127,
    "expiringItems": 3,
    "expiredItems": 1,
    "consumedThisMonth": 45,
    "wastedThisMonth": 5
  },
  "createdAt": "2024-01-01T00:00:00Z"
}

Errors:
- 404: Household not found
- 403: Access denied
```

### Update Household
```http
PUT /api/v1/households/{householdId}

Headers:
Authorization: Bearer <token>

Request:
{
  "name": "Home Sweet Home",
  "description": "Updated description",
  "timezone": "America/Chicago"
}

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Home Sweet Home",
  "description": "Updated description",
  "timezone": "America/Chicago",
  "updatedAt": "2024-01-15T00:00:00Z",
  "updatedBy": "550e8400-e29b-41d4-a716-446655440001"
}

Errors:
- 403: Not admin
- 404: Household not found
```

### Invite Member
```http
POST /api/v1/households/{householdId}/members

Headers:
Authorization: Bearer <token>

Request:
{
  "email": "newmember@example.com",
  "role": "member"
}

Response: 201 Created
{
  "invitationId": "550e8400-e29b-41d4-a716-446655440004",
  "email": "newmember@example.com",
  "role": "member",
  "status": "pending",
  "expiresAt": "2024-01-22T00:00:00Z"
}

Errors:
- 403: Not admin
- 409: User already member
```

### Remove Member
```http
DELETE /api/v1/households/{householdId}/members/{userId}

Headers:
Authorization: Bearer <token>

Response: 204 No Content

Errors:
- 403: Not admin or trying to remove last admin
- 404: Member not found
```

### Update Member Role
```http
PUT /api/v1/households/{householdId}/members/{userId}/role

Headers:
Authorization: Bearer <token>

Request:
{
  "role": "admin"
}

Response: 200 OK
{
  "userId": "550e8400-e29b-41d4-a716-446655440005",
  "role": "admin",
  "updatedAt": "2024-01-15T00:00:00Z"
}

Errors:
- 403: Not admin
- 404: Member not found
```

## Inventory Management Endpoints

### List Household Items
```http
GET /api/v1/households/{householdId}/items

Headers:
Authorization: Bearer <token>

Query Parameters:
- location: fridge|freezer|pantry
- category: produce|dairy|meat|etc
- status: fresh|expiring_soon|expired
- search: string
- page: number (default: 1)
- pageSize: number (default: 20)
- sortBy: name|expirationDate|createdAt
- sortOrder: asc|desc

Response: 200 OK
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440006",
      "name": "Organic Milk",
      "quantity": 1,
      "unit": "gallon",
      "location": "fridge",
      "category": "dairy",
      "expirationDate": "2024-01-20",
      "bestBeforeDate": null,
      "purchaseDate": "2024-01-15",
      "price": 5.99,
      "notes": "Whole milk",
      "daysUntilExpiration": 5,
      "expirationStatus": "fresh",
      "createdAt": "2024-01-15T00:00:00Z",
      "createdBy": {
        "userId": "550e8400-e29b-41d4-a716-446655440001",
        "displayName": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 127,
    "totalPages": 7
  },
  "summary": {
    "totalItems": 127,
    "byLocation": {
      "fridge": 45,
      "freezer": 32,
      "pantry": 50
    },
    "byStatus": {
      "fresh": 120,
      "expiringSoon": 6,
      "expired": 1
    }
  }
}
```

### Add Item
```http
POST /api/v1/households/{householdId}/items

Headers:
Authorization: Bearer <token>

Request:
{
  "name": "Organic Milk",
  "quantity": 1,
  "unit": "gallon",
  "location": "fridge",
  "category": "dairy",
  "expirationDate": "2024-01-20",
  "bestBeforeDate": null,
  "purchaseDate": "2024-01-15",
  "price": 5.99,
  "notes": "Whole milk"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "name": "Organic Milk",
  "quantity": 1,
  "unit": "gallon",
  "location": "fridge",
  "category": "dairy",
  "expirationDate": "2024-01-20",
  "daysUntilExpiration": 5,
  "expirationStatus": "fresh",
  "createdAt": "2024-01-15T00:00:00Z",
  "createdBy": "550e8400-e29b-41d4-a716-446655440001"
}

Errors:
- 400: Invalid data
- 403: Viewer role cannot add items
```

### Get Item Details
```http
GET /api/v1/households/{householdId}/items/{itemId}

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "name": "Organic Milk",
  "quantity": 1,
  "unit": "gallon",
  "location": "fridge",
  "category": "dairy",
  "expirationDate": "2024-01-20",
  "bestBeforeDate": null,
  "purchaseDate": "2024-01-15",
  "price": 5.99,
  "notes": "Whole milk",
  "daysUntilExpiration": 5,
  "expirationStatus": "fresh",
  "history": [
    {
      "action": "created",
      "timestamp": "2024-01-15T00:00:00Z",
      "user": "John Doe"
    }
  ],
  "createdAt": "2024-01-15T00:00:00Z",
  "createdBy": {
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "displayName": "John Doe"
  }
}

Errors:
- 404: Item not found
- 403: Access denied
```

### Update Item (Partial Update)
```http
PATCH /api/v1/households/{householdId}/items/{itemId}

Headers:
Authorization: Bearer <token>
If-Match: "W/\"1234567890\"" // Required - ETag from previous GET or update

Request (only include fields to update):
{
  "name": "Organic Whole Milk",
  "quantity": 0.5,
  "notes": "Half consumed"
}

Response: 200 OK
Headers:
ETag: "W/\"1234567891\""

Body:
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "name": "Organic Whole Milk",
  "quantity": 0.5,
  "unit": "gallon",
  "updatedAt": "2024-01-16T00:00:00Z",
  "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
  "version": 2
}

Errors:
- 404: Item not found
- 403: Viewer role cannot edit
- 409: Conflict - ETag mismatch (returns current state)
- 428: Precondition Required - If-Match header missing
```

### Replace Item (Full Update)
```http
PUT /api/v1/households/{householdId}/items/{itemId}

Headers:
Authorization: Bearer <token>
If-Match: "W/\"1234567890\"" // Required - ETag from previous GET or update

Request (all fields required):
{
  "name": "Organic Whole Milk",
  "quantity": 0.5,
  "unit": "gallon",
  "location": "fridge",
  "category": "dairy",
  "expirationDate": "2024-01-20",
  "expirationDateType": "useBy",
  "purchaseDate": "2024-01-15",
  "price": 5.99,
  "notes": "Half consumed"
}

Response: 200 OK
Headers:
ETag: "W/\"1234567891\""

Body:
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "name": "Organic Whole Milk",
  "quantity": 0.5,
  "unit": "gallon",
  "location": "fridge",
  "category": "dairy",
  "expirationDate": "2024-01-20",
  "expirationDateType": "useBy",
  "purchaseDate": "2024-01-15",
  "price": 5.99,
  "notes": "Half consumed",
  "updatedAt": "2024-01-16T00:00:00Z",
  "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
  "version": 2
}

Errors:
- 400: Missing required fields
- 404: Item not found
- 403: Viewer role cannot edit
- 409: Conflict - ETag mismatch (returns current state)
- 428: Precondition Required - If-Match header missing
```

### Delete Item
```http
DELETE /api/v1/households/{householdId}/items/{itemId}

Headers:
Authorization: Bearer <token>

Response: 204 No Content

Errors:
- 404: Item not found
- 403: Viewer role cannot delete
```

### Mark Item as Consumed
```http
POST /api/v1/households/{householdId}/items/{itemId}/consume

Headers:
Authorization: Bearer <token>

Request:
{
  "quantity": 0.5,
  "notes": "Used for breakfast"
}

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "remainingQuantity": 0.5,
  "consumedQuantity": 0.5,
  "consumedAt": "2024-01-16T08:00:00Z",
  "consumedBy": "550e8400-e29b-41d4-a716-446655440001"
}

Errors:
- 400: Quantity exceeds available
- 404: Item not found
```

### Mark Item as Wasted
```http
POST /api/v1/households/{householdId}/items/{itemId}/waste

Headers:
Authorization: Bearer <token>

Request:
{
  "quantity": 0.5,
  "reason": "expired",
  "notes": "Forgot to use in time"
}

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "remainingQuantity": 0,
  "wastedQuantity": 0.5,
  "reason": "expired",
  "wastedAt": "2024-01-21T00:00:00Z",
  "wastedBy": "550e8400-e29b-41d4-a716-446655440001"
}

Errors:
- 400: Quantity exceeds available
- 404: Item not found
```

### Move Item Location
```http
POST /api/v1/households/{householdId}/items/{itemId}/move

Headers:
Authorization: Bearer <token>

Request:
{
  "newLocation": "freezer",
  "notes": "Freezing for later use"
}

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440006",
  "previousLocation": "fridge",
  "currentLocation": "freezer",
  "movedAt": "2024-01-16T00:00:00Z",
  "movedBy": "550e8400-e29b-41d4-a716-446655440001"
}

Errors:
- 400: Invalid location
- 404: Item not found
```

## Notification Endpoints

### Get Notification Settings
```http
GET /api/v1/notifications/settings

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "email": {
    "enabled": true,
    "address": "user@example.com"
  },
  "inApp": {
    "enabled": true
  },
  "telegram": {
    "enabled": false,
    "linked": false,
    "username": null
  },
  "preferences": {
    "expirationWarningDays": 3,
    "notificationTypes": ["expiration", "lowStock", "shoppingReminder"],
    "preferredTime": "09:00",
    "timezone": "America/New_York"
  }
}
```

### Update Notification Settings
```http
PUT /api/v1/notifications/settings

Headers:
Authorization: Bearer <token>

Request:
{
  "email": {
    "enabled": true
  },
  "inApp": {
    "enabled": true
  },
  "telegram": {
    "enabled": true
  },
  "preferences": {
    "expirationWarningDays": 5,
    "notificationTypes": ["expiration", "lowStock"],
    "preferredTime": "08:00"
  }
}

Response: 200 OK
{
  "message": "Notification settings updated",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

### Link Telegram Account
```http
POST /api/v1/notifications/telegram/link

Headers:
Authorization: Bearer <token>

Request:
{
  "verificationCode": "ABC123"
}

Response: 200 OK
{
  "linked": true,
  "telegramUsername": "@johndoe",
  "linkedAt": "2024-01-15T00:00:00Z"
}

Errors:
- 400: Invalid verification code
- 409: Already linked to another account
```

### Unlink Telegram Account
```http
DELETE /api/v1/notifications/telegram/unlink

Headers:
Authorization: Bearer <token>

Response: 204 No Content
```

### Get Notification History
```http
GET /api/v1/notifications/history

Headers:
Authorization: Bearer <token>

Query Parameters:
- type: expiration|lowStock|shoppingReminder
- channel: email|inApp|telegram
- page: number
- pageSize: number

Response: 200 OK
{
  "notifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440007",
      "type": "expiration",
      "channel": "email",
      "subject": "3 items expiring soon",
      "message": "Milk, Yogurt, and Cheese are expiring within 3 days",
      "status": "sent",
      "sentAt": "2024-01-15T09:00:00Z",
      "readAt": null
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45
  }
}
```

## Shopping List Endpoints

### List Shopping Lists
```http
GET /api/v1/households/{householdId}/shopping-lists

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "lists": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440008",
      "name": "Weekly Groceries",
      "itemCount": 12,
      "completedCount": 3,
      "createdAt": "2024-01-14T00:00:00Z",
      "createdBy": "John Doe",
      "lastUpdated": "2024-01-15T00:00:00Z"
    }
  ],
  "total": 1
}
```

### Create Shopping List
```http
POST /api/v1/households/{householdId}/shopping-lists

Headers:
Authorization: Bearer <token>

Request:
{
  "name": "Weekend Shopping",
  "notes": "For the party"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440009",
  "name": "Weekend Shopping",
  "notes": "For the party",
  "items": [],
  "createdAt": "2024-01-15T00:00:00Z",
  "createdBy": "550e8400-e29b-41d4-a716-446655440001"
}
```

### Add Item to Shopping List
```http
POST /api/v1/households/{householdId}/shopping-lists/{listId}/items

Headers:
Authorization: Bearer <token>

Request:
{
  "name": "Organic Milk",
  "quantity": 2,
  "unit": "gallons",
  "category": "dairy",
  "notes": "Whole milk preferred"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440010",
  "name": "Organic Milk",
  "quantity": 2,
  "unit": "gallons",
  "category": "dairy",
  "notes": "Whole milk preferred",
  "completed": false,
  "addedAt": "2024-01-15T00:00:00Z",
  "addedBy": "John Doe"
}
```

## WebSocket Events

### Connection
```javascript
const socket = new WebSocket('wss://api.fridgr.app/ws');

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: 'auth',
    token: 'jwt_token',
    householdId: 'household_uuid'
  }));
};
```

### Real-time Events
```javascript
// Item updated
{
  "type": "item.updated",
  "householdId": "550e8400-e29b-41d4-a716-446655440002",
  "payload": {
    "itemId": "550e8400-e29b-41d4-a716-446655440006",
    "changes": {
      "quantity": 0.5,
      "notes": "Half consumed"
    },
    "updatedBy": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2024-01-16T00:00:00Z"
  }
}

// Item added
{
  "type": "item.added",
  "householdId": "550e8400-e29b-41d4-a716-446655440002",
  "payload": {
    "item": {
      "id": "550e8400-e29b-41d4-a716-446655440011",
      "name": "Apples",
      "quantity": 6,
      "location": "pantry"
    },
    "addedBy": "550e8400-e29b-41d4-a716-446655440001",
    "timestamp": "2024-01-16T00:00:00Z"
  }
}

// Member joined
{
  "type": "member.joined",
  "householdId": "550e8400-e29b-41d4-a716-446655440002",
  "payload": {
    "userId": "550e8400-e29b-41d4-a716-446655440012",
    "displayName": "Jane Doe",
    "role": "member",
    "timestamp": "2024-01-16T00:00:00Z"
  }
}

// Notification
{
  "type": "notification.new",
  "userId": "550e8400-e29b-41d4-a716-446655440001",
  "payload": {
    "id": "550e8400-e29b-41d4-a716-446655440013",
    "type": "expiration_warning",
    "message": "3 items expiring soon in Home",
    "items": ["Milk", "Yogurt", "Cheese"],
    "timestamp": "2024-01-16T09:00:00Z"
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "expirationDate",
        "message": "Must be a future date"
      }
    ],
    "timestamp": "2024-01-15T00:00:00Z",
    "traceId": "550e8400-e29b-41d4-a716-446655440014"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Request data validation failed
- `AUTHENTICATION_ERROR`: Authentication required or failed
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource conflict (duplicate, etc.)
- `RATE_LIMIT_ERROR`: Too many requests
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes
- `200 OK`: Successful GET/PUT
- `201 Created`: Successful POST creating resource
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error