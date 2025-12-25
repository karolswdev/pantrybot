# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fridgr is a household food inventory management system designed to reduce food waste through intelligent tracking of perishable items. The project has a production-ready MVP with a Next.js frontend and Node.js/Express backend.

## Architecture

### Technology Stack
- **Backend**: Node.js with Express.js - REST API with WebSocket support
- **Frontend**: Next.js 15+ with TypeScript, React 19+, Tailwind CSS, Zustand
- **Database**: In-memory with file persistence (PostgreSQL ready for production)
- **Real-time**: Socket.io
- **Containerization**: Docker & Docker Compose

### Project Structure
```
backend/
├── index.js              # Express server entry point
├── authRoutes.js         # Authentication endpoints
├── inventoryRoutes.js    # Inventory CRUD operations
├── householdRoutes.js    # Household management
├── shoppingListRoutes.js # Shopping list endpoints
├── notificationRoutes.js # Notification preferences
├── dashboardRoutes.js    # Dashboard/reports endpoints
├── socket.js             # WebSocket handlers
├── db.js                 # In-memory database
├── authMiddleware.js     # JWT authentication middleware
└── tests/                # Regression test scripts

frontend/
├── app/                  # Next.js app router pages
├── components/           # React components
├── hooks/                # Custom React hooks
├── stores/               # Zustand state stores
├── lib/                  # Utilities and services
└── cypress/              # E2E tests
```

## Development Commands

### Backend (Node.js)
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start

# Start with auto-reload (development)
npm run dev

# Run regression tests
./final_regression_test.sh
```

### Frontend (Next.js)
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Type check
npm run type-check
```

### Docker Commands
```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# Start only infrastructure services (PostgreSQL, Redis)
docker-compose up -d postgres redis

# View logs
docker-compose logs -f [service-name]

# Stop all services
docker-compose down

# Rebuild containers
docker-compose build
```

## API Endpoints

Base URL: `http://localhost:8080/api/v1` (development)

Key endpoints:
- `/auth/*` - Authentication (register, login, refresh)
- `/households/*` - Household management
- `/households/{id}/items/*` - Inventory management
- `/notifications/*` - Notification preferences
- `/shopping-lists/*` - Shopping list management
- `/health` - Health check endpoint

## Key Architectural Patterns

### REST API Design
- RESTful endpoints with consistent naming
- JWT authentication with refresh tokens
- WebSocket integration for real-time updates

### Multi-tenancy
- HouseholdId-based data isolation
- Role-based access control per household

### Authentication & Authorization
- JWT tokens with 15-minute access token expiry
- Refresh tokens with 7-day expiry (rotating)
- Role-based access control: Admin, Member, Viewer

## Testing Guidelines

### Backend Testing
- Regression test scripts in `backend/tests/`
- Run `./final_regression_test.sh` for full test suite

### Frontend Testing
- Component tests with React Testing Library
- 25 Cypress E2E test suites for critical user flows
- Mock API responses for isolated testing

## Real-time Features

Socket.io for:
- Inventory updates
- Shopping list synchronization
- Expiration notifications
- Household activity feed

## Environment Variables

Backend:
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret

Frontend (.env.local):
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

## Important Documentation

Comprehensive project documentation in `.pm/` directory:
- `technical-architecture.md` - Detailed technical architecture
- `api-specifications.md` - Complete API documentation
- `database-schema.md` - Database design and schema
- `user-stories.md` - User stories with acceptance criteria
- `telegram-bot-requirements.md` - Telegram bot integration
- `feature-roadmap.md` - Development phases and roadmap
- `system/mvp/SRS.md` - System Requirements Specification

## Performance Considerations

- API response time target: <200ms (95th percentile)
- Support 100 concurrent users per household
- Real-time updates within 1 second
- Use caching for frequently accessed data
- Implement pagination for large result sets

## Security Requirements

- Input validation and sanitization on all endpoints
- Rate limiting: 100 requests/minute per user
- Bcrypt password hashing
- TLS 1.2+ for all communications
- Never log sensitive data (passwords, tokens)

## Future Enhancements

To make the backend production-ready:
- Add PostgreSQL persistence (replace in-memory DB)
- Add Redis for session/cache management
- Add comprehensive input validation
- Add rate limiting middleware
- Add structured logging
- Add health check with dependency status
