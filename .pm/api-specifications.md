# API Specifications

## API Overview

Base URL: `https://api.pantrybot.app/api/v1`

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

## LLM (Natural Language Processing) Endpoints

### Get LLM Status
```http
GET /api/v1/llm/status

Response: 200 OK
{
  "available": true,
  "configured": true,
  "provider": "ollama",
  "source": "env"
}

// When not configured:
{
  "available": false,
  "message": "No LLM provider configured",
  "hint": "Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or OLLAMA_BASE_URL"
}
```

### Process Natural Language Message
```http
POST /api/v1/llm/process

Headers:
Authorization: Bearer <token>

Request:
{
  "message": "I bought milk and eggs from the store",
  "householdId": "550e8400-e29b-41d4-a716-446655440002",
  "executeActions": true
}

Response: 200 OK
{
  "intent": {
    "action": "add",
    "items": [
      { "name": "milk", "quantity": 1, "unit": "item", "location": "fridge", "expirationDays": 7 },
      { "name": "eggs", "quantity": 1, "unit": "dozen", "location": "fridge", "expirationDays": 21 }
    ],
    "response": "Got it! I've added milk and eggs to your fridge."
  },
  "executed": true,
  "result": {
    "action": "add",
    "itemsProcessed": 2,
    "errors": []
  },
  "recipes": null
}

Errors:
- 400: Message or householdId missing
- 403: Not a member of this household
- 503: LLM not configured
```

### Chat (Debug/Test Endpoint)
```http
POST /api/v1/llm/chat

Headers:
Authorization: Bearer <token>

Request:
{
  "message": "What can I make for dinner?",
  "householdId": "550e8400-e29b-41d4-a716-446655440002"
}

Response: 200 OK
{
  "message": "What can I make for dinner?",
  "intent": {
    "action": "recipe",
    "response": "Based on your inventory, here are some recipe ideas..."
  },
  "response": "Based on your inventory, here are some recipe ideas..."
}
```

## Recipe Endpoints

### Get Recipe Service Status
```http
GET /api/v1/recipes/status

Response: 200 OK
{
  "available": true,
  "provider": "spoonacular"
}
```

### Get Recipe Suggestions
```http
GET /api/v1/recipes/suggestions/{householdId}

Headers:
Authorization: Bearer <token>

Query Parameters:
- count: number (default: 5, max: 10)
- prioritizeExpiring: boolean (default: true)

Response: 200 OK
{
  "recipes": [
    {
      "id": 123456,
      "title": "Pasta with Tomatoes",
      "image": "https://spoonacular.com/...",
      "usedIngredientCount": 3,
      "missedIngredientCount": 1,
      "usedIngredients": ["pasta", "tomatoes", "garlic"],
      "missedIngredients": ["basil"],
      "likes": 100
    }
  ],
  "provider": "spoonacular",
  "inventoryCount": 15
}

Errors:
- 403: Not a member of this household
- 503: Recipe service not available
```

### Get Recipes for Expiring Items
```http
GET /api/v1/recipes/expiring/{householdId}

Headers:
Authorization: Bearer <token>

Query Parameters:
- days: number (default: 3) - Days threshold for expiring items
- count: number (default: 3)

Response: 200 OK
{
  "recipes": [...],
  "provider": "spoonacular",
  "expiringItems": [
    { "name": "Milk", "expirationDate": "2024-01-20" }
  ],
  "expiringCount": 3
}
```

### Get Recipe Details
```http
GET /api/v1/recipes/{recipeId}

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "id": 123456,
  "title": "Pasta with Tomatoes",
  "image": "https://...",
  "readyInMinutes": 30,
  "servings": 4,
  "sourceUrl": "https://...",
  "summary": "A delicious pasta dish...",
  "cuisines": ["Italian"],
  "dishTypes": ["main course"],
  "diets": ["vegetarian"],
  "extendedIngredients": [
    { "name": "pasta", "amount": 200, "unit": "g", "original": "200g pasta" }
  ],
  "instructions": "Cook the pasta..."
}

Errors:
- 400: LLM-generated recipes don't have detailed views
- 503: Spoonacular not configured
```

### Natural Language Recipe Query
```http
POST /api/v1/recipes/query

Headers:
Authorization: Bearer <token>

Request:
{
  "query": "What can I make with chicken and rice?",
  "householdId": "550e8400-e29b-41d4-a716-446655440002"
}

Response: 200 OK
{
  "response": "Based on your inventory, here are 3 recipes...",
  "recipes": [...],
  "expiringNote": "These recipes use your milk that expires tomorrow"
}
```

## Telegram Bot Endpoints

### Get Telegram Bot Status
```http
GET /api/v1/telegram/status

Response: 200 OK
{
  "configured": true,
  "bot": {
    "id": 123456789,
    "username": "PantrybotBot",
    "firstName": "Pantrybot"
  }
}
```

### Webhook (Internal)
```http
POST /api/v1/telegram/webhook

Request: Telegram Update object

Response: 200 OK
```

### Generate Link Code
```http
POST /api/v1/telegram/generate-link-code

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "code": "ABC12345",
  "expiresAt": "2024-01-15T10:10:00Z",
  "instructions": "Send this code to @PantrybotBot on Telegram: /link ABC12345"
}
```

### Get Link Status
```http
GET /api/v1/telegram/link-status

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "linked": true,
  "telegramId": "123456789",
  "linkedAt": "2024-01-15T00:00:00Z"
}
```

### Unlink Telegram Account
```http
DELETE /api/v1/telegram/unlink

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Telegram account unlinked"
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

## LLM Endpoints

### Get LLM Status
```http
GET /api/v1/llm/status

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "available": true,
  "provider": "ollama",
  "model": "llama3.2"
}

Response (when not configured): 200 OK
{
  "available": false
}
```

### Process Natural Language Command
```http
POST /api/v1/llm/process

Headers:
Authorization: Bearer <token>

Request:
{
  "message": "I bought 2 gallons of milk and a dozen eggs",
  "householdId": "550e8400-e29b-41d4-a716-446655440002"
}

Response: 200 OK
{
  "intent": {
    "action": "add",
    "items": [
      {
        "name": "Milk",
        "quantity": 2,
        "unit": "gallon",
        "category": "dairy"
      },
      {
        "name": "Eggs",
        "quantity": 12,
        "unit": "piece",
        "category": "dairy"
      }
    ],
    "response": "Added 2 gallons of milk and 12 eggs to your inventory!"
  },
  "executed": true,
  "result": {
    "itemsProcessed": 2,
    "errors": []
  }
}

Response (clarification needed): 200 OK
{
  "intent": {
    "action": "clarify",
    "response": "I found multiple items matching 'milk'. Did you mean whole milk, skim milk, or almond milk?"
  },
  "executed": false
}

Errors:
- 400: Invalid request format
- 503: LLM service unavailable
```

### Chat Conversation
```http
POST /api/v1/llm/chat

Headers:
Authorization: Bearer <token>

Request:
{
  "message": "What items are expiring soon?",
  "householdId": "550e8400-e29b-41d4-a716-446655440002",
  "conversationHistory": [
    {
      "role": "user",
      "content": "Show me my fridge items"
    },
    {
      "role": "assistant",
      "content": "You have 15 items in your fridge..."
    }
  ]
}

Response: 200 OK
{
  "response": "You have 3 items expiring in the next 3 days:\n1. Milk - expires tomorrow\n2. Yogurt - expires in 2 days\n3. Cheese - expires in 3 days",
  "intent": "query",
  "data": {
    "items": [...]
  }
}

Errors:
- 400: Invalid request format
- 503: LLM service unavailable
```

## Recipe Endpoints

### Get Recipe Service Status
```http
GET /api/v1/recipes/status

Response: 200 OK
{
  "available": true,
  "providers": ["spoonacular", "llm"],
  "spoonacularConfigured": true,
  "llmConfigured": true
}
```

### Get Recipe Suggestions by Ingredients
```http
GET /api/v1/recipes/suggestions/{householdId}?limit=5&diet=vegetarian&cuisine=italian

Headers:
Authorization: Bearer <token>

Query Parameters:
- limit: number (optional, default: 5)
- diet: string (optional) - vegetarian, vegan, gluten-free, etc.
- cuisine: string (optional) - italian, mexican, asian, etc.

Response: 200 OK
{
  "recipes": [
    {
      "id": "spoonacular_123456",
      "title": "Pasta Primavera",
      "image": "https://spoonacular.com/...",
      "usedIngredients": ["tomatoes", "pasta", "olive oil"],
      "missedIngredients": ["parmesan cheese"],
      "likes": 142,
      "sourceUrl": "https://...",
      "readyInMinutes": 30,
      "servings": 4
    }
  ],
  "usedInventoryItems": ["Tomatoes", "Pasta", "Olive Oil"],
  "provider": "spoonacular"
}

Errors:
- 503: Recipe service unavailable
```

### Get Recipes for Expiring Items
```http
GET /api/v1/recipes/expiring/{householdId}?daysThreshold=3&limit=5

Headers:
Authorization: Bearer <token>

Query Parameters:
- daysThreshold: number (optional, default: 3) - Items expiring within N days
- limit: number (optional, default: 5)

Response: 200 OK
{
  "expiringItems": [
    {
      "id": "item123",
      "name": "Milk",
      "expirationDate": "2024-01-18",
      "daysUntilExpiration": 2
    }
  ],
  "recipes": [...],
  "provider": "spoonacular"
}

Errors:
- 503: Recipe service unavailable
```

### Get Recipe Details
```http
GET /api/v1/recipes/{recipeId}

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "spoonacular_123456",
  "title": "Pasta Primavera",
  "image": "https://...",
  "readyInMinutes": 30,
  "servings": 4,
  "sourceUrl": "https://...",
  "summary": "A delicious spring pasta...",
  "instructions": "1. Boil water...",
  "extendedIngredients": [
    {
      "name": "pasta",
      "amount": 1,
      "unit": "pound"
    }
  ],
  "nutrition": {
    "calories": 450,
    "protein": "12g",
    "carbs": "65g",
    "fat": "15g"
  }
}

Errors:
- 404: Recipe not found
- 503: Recipe service unavailable
```

### Query Recipes with Natural Language
```http
POST /api/v1/recipes/query

Headers:
Authorization: Bearer <token>

Request:
{
  "query": "Give me a quick dinner recipe using chicken and vegetables",
  "householdId": "550e8400-e29b-41d4-a716-446655440002",
  "preferences": {
    "maxReadyTime": 30,
    "diet": null,
    "cuisine": null
  }
}

Response: 200 OK
{
  "recipes": [...],
  "suggestion": "Based on your inventory, I recommend Chicken Stir Fry which uses your chicken and bell peppers that are expiring soon.",
  "provider": "llm"
}

Errors:
- 400: Invalid query
- 503: Service unavailable
```

## Telegram Bot Endpoints

### Telegram Webhook
```http
POST /api/v1/telegram/webhook

Headers:
X-Telegram-Bot-Api-Secret-Token: <secret_token>

Request: (Telegram Update object)
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456,
      "first_name": "John"
    },
    "chat": {
      "id": 123456,
      "type": "private"
    },
    "text": "/start"
  }
}

Response: 200 OK
(Empty response - Telegram expects 200 status)

Errors:
- 401: Invalid secret token
```

### Get Telegram Integration Status
```http
GET /api/v1/telegram/status

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "configured": true,
  "webhookSet": true,
  "linked": true,
  "telegramChatId": "123456789"
}

Response (not linked): 200 OK
{
  "configured": true,
  "webhookSet": true,
  "linked": false
}
```

### Setup Telegram Webhook
```http
POST /api/v1/telegram/setup-webhook

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "webhookUrl": "https://api.pantrybot.app/api/v1/telegram/webhook"
}

Errors:
- 500: Failed to set webhook
```

### Generate Telegram Link Code
```http
POST /api/v1/telegram/generate-link-code

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "code": "ABC123",
  "expiresAt": "2024-01-15T00:10:00Z",
  "expiresInSeconds": 600
}

Notes:
- Codes are 6 alphanumeric characters
- Codes expire after 10 minutes
- User sends /link <code> to bot to complete linking
```

### Get Telegram Link Status
```http
GET /api/v1/telegram/link-status

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "linked": true,
  "linkedAt": "2024-01-10T00:00:00Z"
}

Response (not linked): 200 OK
{
  "linked": false
}
```

### Unlink Telegram Account
```http
DELETE /api/v1/telegram/unlink

Headers:
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true
}

Errors:
- 400: Account not linked
```

## WebSocket Events

### Connection
```javascript
const socket = new WebSocket('wss://api.pantrybot.app/ws');

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