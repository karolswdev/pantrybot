# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fridgr is a household food inventory management system designed to reduce food waste through intelligent tracking of perishable items. The project is currently in the planning/early development phase with comprehensive documentation in the `.pm/` directory.

## Architecture

### Technology Stack
- **Backend**: .NET 8 (C#) - Modular Monolith with Ports & Adapters (Hexagonal Architecture)
- **Frontend**: Next.js 14+ with TypeScript, React 18+, Tailwind CSS, Zustand
- **Database**: PostgreSQL 15+
- **Real-time**: SignalR
- **Containerization**: Docker & Docker Compose

### Project Structure (Planned)
```
backend/
├── src/
│   ├── Fridgr.Domain/        # Core domain (entities, value objects)
│   ├── Fridgr.Application/   # Use cases, DTOs, interfaces
│   ├── Fridgr.Infrastructure/# Adapters, persistence, external services
│   └── Fridgr.API/           # Controllers, middleware, configuration
└── tests/                    # Unit, integration, and E2E tests

frontend/
├── app/                      # Next.js app router pages
├── components/              # React components
└── lib/                     # Utilities and services
```

## Development Commands

### Backend (.NET)
```bash
# Navigate to backend directory
cd backend

# Restore dependencies
dotnet restore

# Build the solution
dotnet build

# Run tests
dotnet test

# Run the API
dotnet run --project src/Fridgr.API

# Run database migrations
dotnet ef database update

# Add a new migration
dotnet ef migrations add <MigrationName>

# Run with hot reload
dotnet watch run --project src/Fridgr.API
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

Base URL: `http://localhost:5000/api/v1` (development)

Key endpoints:
- `/auth/*` - Authentication (register, login, refresh)
- `/households/*` - Household management
- `/households/{id}/items/*` - Inventory management
- `/notifications/*` - Notification preferences
- `/shopping-lists/*` - Shopping list management

Swagger documentation available at: `http://localhost:5000/swagger`

## Key Architectural Patterns

### Domain-Driven Design (DDD)
- Aggregates: User, Household, InventoryItem, ShoppingList
- Value Objects: Email, HouseholdId, ItemId, Quantity, ExpirationInfo
- Domain Events for loose coupling between modules

### CQRS Pattern
- Command handlers for write operations (e.g., AddInventoryItemCommandHandler)
- Query handlers for read operations (e.g., GetExpiringItemsQueryHandler)
- Separate read/write models where beneficial

### Multi-tenancy
- Row-level security with HouseholdId in all tenant-specific tables
- Automatic query filters in Entity Framework Core
- Composite indexes on (HouseholdId, other columns)

### Authentication & Authorization
- JWT tokens with 15-minute access token expiry
- Refresh tokens with 7-day expiry (rotating)
- Role-based access control: Admin, Member, Viewer

## Testing Guidelines

### Backend Testing
- Unit tests for domain logic and services
- Integration tests for API endpoints
- Use xUnit, Moq, and FluentAssertions
- Test database with in-memory provider or TestContainers

### Frontend Testing
- Component tests with React Testing Library
- E2E tests for critical user flows
- Mock API responses for isolated testing

## Real-time Features

SignalR hubs for:
- Inventory updates
- Shopping list synchronization
- Expiration notifications
- Household activity feed

## Database Migrations

- Use Entity Framework Core migrations
- Never modify existing migrations
- Always review generated SQL before applying
- Test migrations on a copy of production data

## Environment Variables

Backend (.env):
- `ConnectionStrings__DefaultConnection`
- `Jwt__Secret`
- `Jwt__Issuer`
- `Redis__ConnectionString`
- `Email__SmtpHost`
- `Telegram__BotToken`

Frontend (.env.local):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SIGNALR_URL`

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
- SQL injection prevention via parameterized queries