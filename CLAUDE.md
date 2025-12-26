# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pantrybot is a household food inventory management system designed to reduce food waste through intelligent tracking of perishable items. The project has a production-ready MVP with a Next.js frontend and Node.js/Express backend.

## Architecture

### Technology Stack
- **Backend**: Node.js with Express.js, Prisma ORM, PostgreSQL
- **Frontend**: Next.js 14+ with TypeScript, React 18+, Tailwind CSS, Zustand
- **Database**: PostgreSQL 15 with Prisma ORM
- **Real-time**: Socket.IO
- **Observability**: Pino logging, Prometheus metrics, Grafana dashboards
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
├── authMiddleware.js     # JWT authentication middleware
├── lib/
│   ├── logger.js         # Pino structured logging
│   └── metrics.js        # Prometheus metrics
├── middleware/
│   ├── requestLogger.js  # HTTP request logging
│   ├── errorHandler.js   # Global error handling
│   └── metricsMiddleware.js # HTTP metrics collection
├── prisma/
│   └── schema.prisma     # Database schema
└── repositories/         # Data access layer

frontend/
├── app/                  # Next.js app router pages
├── components/           # React components
├── hooks/                # Custom React hooks
├── stores/               # Zustand state stores
├── lib/                  # Utilities and services
└── cypress/              # E2E tests

observability/            # Prometheus, Grafana, Loki configs
```

## Development Commands

### Backend (Node.js)
```bash
cd backend

npm install              # Install dependencies
npm start                # Start the server
npm run dev              # Start with auto-reload

# Database
npx prisma migrate dev   # Run migrations
npx prisma studio        # Database GUI
npx prisma generate      # Regenerate client
```

### Frontend (Next.js)
```bash
cd frontend

npm install              # Install dependencies
npm run dev              # Development server
npm run build            # Production build
npm run test:e2e         # Run Cypress E2E tests
npm run lint             # Lint code
```

### Docker Commands
```bash
docker-compose up -d                    # Start all services
docker-compose up -d postgres           # Start only PostgreSQL
docker-compose logs -f backend          # View backend logs
docker-compose down                     # Stop all services
```

## API Endpoints

Base URL: `http://localhost:8080/api/v1`

Key endpoints:
- `/auth/*` - Authentication (register, login, refresh)
- `/households/*` - Household management
- `/households/{id}/items/*` - Inventory management
- `/notifications/*` - Notification preferences
- `/dashboard/*` - Dashboard statistics and reports
- `/health` - Health check endpoint
- `/ready` - Kubernetes readiness probe
- `/metrics` - Prometheus metrics endpoint

## Key Architectural Patterns

### Data Access Layer
- Prisma ORM for type-safe database access
- Repository pattern for data operations
- Transaction support for complex operations

### Observability
- Structured JSON logging with Pino
- Request correlation IDs for tracing
- Prometheus metrics for monitoring
- Grafana dashboards for visualization

### Authentication & Authorization
- JWT tokens with 15-minute access token expiry
- Refresh tokens with 7-day expiry (rotating)
- Role-based access control: Admin, Member, Viewer

## Environment Variables

Backend:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 8080)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret
- `LOG_LEVEL` - Logging level (debug/info/warn/error)

Frontend (.env.local):
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_WS_URL` - WebSocket URL

## Documentation

Project specifications in `.pm/` directory:
- `api-specifications.md` - API documentation
- `database-schema.md` - Database design
- `user-stories.md` - User stories
- `technical-architecture.md` - Architecture overview
- `feature-roadmap.md` - Development roadmap

## Testing

### E2E Tests
```bash
cd frontend
npm run test:e2e         # Run Cypress tests
npm run test:e2e:open    # Open Cypress UI
```

### API Testing
Use the `/api/v1/test/reset-db` endpoint to reset database state between tests.

## Security

- Input validation on all endpoints
- Password hashing with bcrypt
- JWT token authentication
- Sensitive data redaction in logs
- CORS configuration
