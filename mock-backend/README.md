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