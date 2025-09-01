# Mock Backend for Fridgr

This is a mock backend server for the Fridgr application, providing authentication and API endpoints for frontend development and testing.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
npm install
```

### Running the Server
```bash
npm start
```

The server will start on port 8080 by default. You can verify it's running by accessing the health endpoint:
```bash
curl http://localhost:8080/health
```

## API Endpoints

### Health Check
- **GET** `/health` - Returns server status
  - Response: `200 OK` with `{"status": "ok"}`

### Authentication Endpoints

#### Register User
- **POST** `/api/v1/auth/register` - Create a new user account
  - **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "SecurePass123!",
      "displayName": "John Doe",
      "timezone": "America/New_York"
    }
    ```
  - **Response:** `201 Created`
    ```json
    {
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "email": "user@example.com",
      "displayName": "John Doe",
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900,
      "defaultHouseholdId": "550e8400-e29b-41d4-a716-446655440002"
    }
    ```
  - **Error Responses:**
    - `400 Bad Request` - Invalid email format or weak password
    - `409 Conflict` - Email already registered

#### Login User
- **POST** `/api/v1/auth/login` - Authenticate existing user
  - **Request Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "SecurePass123!"
    }
    ```
  - **Response:** `200 OK`
    ```json
    {
      "userId": "550e8400-e29b-41d4-a716-446655440001",
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900,
      "households": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "name": "Home",
          "role": "admin"
        }
      ]
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized` - Invalid credentials

#### Refresh Token
- **POST** `/api/v1/auth/refresh` - Get new access token using refresh token
  - **Request Body:**
    ```json
    {
      "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
    }
    ```
  - **Response:** `200 OK`
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "expiresIn": 900
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized` - Invalid or expired refresh token

### Household Management Endpoints

All household endpoints require authentication via Bearer token in the Authorization header.

#### List User's Households
- **GET** `/api/v1/households` - Get all households the user belongs to
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK`
    ```json
    {
      "households": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "name": "Home",
          "description": "Family household",
          "role": "admin",
          "memberCount": 3,
          "itemCount": 127,
          "expiringItemCount": 5,
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "total": 1
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized` - Missing or invalid token

#### Create Household
- **POST** `/api/v1/households` - Create a new household
  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "name": "Beach House",
      "description": "Vacation home inventory",
      "timezone": "America/Los_Angeles"
    }
    ```
  - **Response:** `201 Created`
    ```json
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "Beach House",
      "description": "Vacation home inventory",
      "timezone": "America/Los_Angeles",
      "createdAt": "2024-01-15T00:00:00.000Z",
      "createdBy": "550e8400-e29b-41d4-a716-446655440001"
    }
    ```
  - **Error Responses:**
    - `400 Bad Request` - Missing required fields
    - `401 Unauthorized` - Missing or invalid token

#### Get Household Details
- **GET** `/api/v1/households/{householdId}` - Get detailed household information
  - **Headers:** `Authorization: Bearer <token>`
  - **Response:** `200 OK`
    ```json
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
          "joinedAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "statistics": {
        "totalItems": 127,
        "expiringItems": 3,
        "expiredItems": 1,
        "consumedThisMonth": 45,
        "wastedThisMonth": 5
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
    ```
  - **Error Responses:**
    - `401 Unauthorized` - Missing or invalid token
    - `403 Forbidden` - User is not a member of the household
    - `404 Not Found` - Household does not exist

#### Invite Member to Household
- **POST** `/api/v1/households/{householdId}/members` - Invite a new member to the household
  - **Headers:** `Authorization: Bearer <token>`
  - **Request Body:**
    ```json
    {
      "email": "newmember@example.com",
      "role": "member"
    }
    ```
  - **Response:** `201 Created`
    ```json
    {
      "invitationId": "550e8400-e29b-41d4-a716-446655440004",
      "email": "newmember@example.com",
      "role": "member",
      "status": "pending",
      "expiresAt": "2024-01-22T00:00:00.000Z"
    }
    ```
  - **Error Responses:**
    - `400 Bad Request` - Missing required fields or invalid role
    - `401 Unauthorized` - Missing or invalid token
    - `403 Forbidden` - User is not an admin of the household
    - `404 Not Found` - Household does not exist
    - `409 Conflict` - User is already a member or has a pending invitation

## Environment Variables

- `PORT` - Server port (default: 8080)

## Development

This mock backend uses:
- Express.js for the server framework
- CORS for cross-origin requests
- JWT for authentication tokens
- Bcrypt for password hashing
- In-memory data storage for development

## Notes

This is a mock backend intended for development and testing purposes only. It uses in-memory storage and should not be used in production environments.