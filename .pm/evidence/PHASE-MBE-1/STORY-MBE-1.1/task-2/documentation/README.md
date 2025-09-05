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
*(Placeholder for authentication endpoints that will be implemented in this phase)*

- **POST** `/api/v1/auth/register` - User registration
- **POST** `/api/v1/auth/login` - User login  
- **POST** `/api/v1/auth/refresh` - Refresh JWT token

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