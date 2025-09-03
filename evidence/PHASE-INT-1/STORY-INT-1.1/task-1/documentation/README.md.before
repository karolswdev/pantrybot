# Fridgr - Household Food Inventory Management System

## Overview
Fridgr is a comprehensive household food inventory management system designed to reduce food waste through intelligent tracking of perishable items. Built with a C#/.NET backend and React/Next.js frontend, it provides real-time collaboration, multi-channel notifications, and smart inventory management.

## Key Features

### MVP Features
- **Multi-tenant household management** - Users can belong to multiple households
- **Manual inventory tracking** - Add, edit, delete items with detailed metadata
- **Expiration monitoring** - Customizable warnings for expiring items
- **Multi-channel notifications** - Email, in-app, and Telegram bot integration
- **Shared shopping lists** - Real-time synchronized lists for households
- **Role-based access** - Admin, member, and viewer roles
- **PWA mobile experience** - Works on any device with offline capabilities
- **Activity logging** - Track all household inventory changes

### Future Features (Roadmap)
- Barcode scanning with product database integration
- AI-powered recipe suggestions based on available ingredients
- Voice assistant integration (Alexa, Google Assistant)
- Native mobile applications (iOS/Android)
- Smart home integration
- Advanced analytics and waste reduction insights

## Technology Stack

### Backend
- **Framework**: .NET 8 (C#)
- **Architecture**: Modular Monolith with Ports & Adapters (Hexagonal)
- **API**: ASP.NET Core Web API
- **Database**: PostgreSQL 15+
- **Real-time**: SignalR
- **ORM**: Entity Framework Core 8
- **Testing**: xUnit, Moq, FluentAssertions

### Frontend  
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI**: React 18+
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: SignalR client
- **PWA**: next-pwa

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (MVP), Kubernetes-ready
- **Cloud**: AWS/Azure (cloud-agnostic design)
- **CI/CD**: GitHub Actions

## Project Structure

```
fridgr/
├── .pm/                    # Project management and requirements
│   ├── system/            # System-level requirements
│   ├── user-stories.md    # User stories with acceptance criteria
│   ├── technical-architecture.md
│   ├── api-specifications.md
│   ├── database-schema.md
│   ├── telegram-bot-requirements.md
│   └── feature-roadmap.md
├── backend/               # .NET backend application
│   ├── src/
│   │   ├── Fridgr.Domain/
│   │   ├── Fridgr.Application/
│   │   ├── Fridgr.Infrastructure/
│   │   └── Fridgr.API/
│   └── tests/
├── frontend/              # Next.js frontend application
│   ├── app/
│   ├── components/
│   └── lib/
├── docker-compose.yml     # Local development setup
└── README.md
```

## Getting Started

### Prerequisites
- Docker & Docker Compose (required)
- Node.js 18+ (for local development without Docker)
- .NET 8 SDK (for local development without Docker)

### Quick Start with Docker (Recommended)

1. Clone the repository
```bash
git clone https://github.com/yourusername/fridgr.git
cd fridgr
```

2. Build and start all services with Docker Compose
```bash
docker-compose up --build
```

This single command will:
- Build the frontend and backend containers
- Start PostgreSQL database
- Start Redis cache
- Run database migrations
- Start the application

3. Access the application
- Frontend: http://localhost:3000
- API: http://localhost:5000
- API Documentation: http://localhost:5000/swagger

### Alternative: Local Development Setup (Without Docker)

If you prefer to run services locally without Docker:

1. Clone the repository
```bash
git clone https://github.com/yourusername/fridgr.git
cd fridgr
```

2. Set up environment variables
```bash
# Copy example environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start infrastructure services
```bash
docker-compose up -d postgres redis
```

4. Run database migrations
```bash
cd backend
dotnet ef database update
```

5. Start the backend
```bash
cd backend
dotnet run --project src/Fridgr.API
```

6. Start the frontend
```bash
cd frontend
npm install
npm run dev
```

7. Access the application
- Frontend: http://localhost:3000
- API: http://localhost:5000
- API Documentation: http://localhost:5000/swagger

## API Documentation

The API follows RESTful principles with comprehensive OpenAPI/Swagger documentation available at `/swagger` when running locally.

Key endpoints:
- `/api/v1/auth/*` - Authentication
- `/api/v1/households/*` - Household management
- `/api/v1/households/{id}/items/*` - Inventory management
- `/api/v1/notifications/*` - Notification settings
- `/api/v1/shopping-lists/*` - Shopping lists

See `.pm/api-specifications.md` for complete API documentation.

## Database Schema

The application uses PostgreSQL with a multi-tenant architecture. Key tables include:
- `users` - User accounts
- `households` - Household definitions
- `inventory_items` - Food inventory items
- `notifications` - Notification queue
- `activity_logs` - Audit trail

See `.pm/database-schema.md` for complete schema documentation.

## Telegram Bot Integration

The Fridgr bot (@FridgrBot) provides:
- Expiration notifications
- Inventory status updates
- Quick item addition
- Shopping list management

See `.pm/telegram-bot-requirements.md` for bot setup instructions.

## Testing

### Backend Tests
```bash
cd backend
dotnet test
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:e2e
```

## Deployment

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Requirements Documentation

Comprehensive requirements documentation is available in the `.pm/` directory:
- System Requirements Specification (SRS)
- User Stories with Acceptance Criteria
- Technical Architecture
- API Specifications
- Database Schema
- Telegram Bot Requirements
- Feature Roadmap

## Performance Targets

- API response time: <200ms (95th percentile)
- Support 100 concurrent users per household
- Real-time updates within 1 second
- 99.5% uptime SLA

## Security

- JWT-based authentication
- Bcrypt password hashing
- Row-level security for multi-tenancy
- Input validation and sanitization
- Rate limiting on all endpoints
- HTTPS enforced in production

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For questions or support, please open an issue on GitHub or contact the development team.

## Roadmap

See `.pm/feature-roadmap.md` for detailed development phases:

**Phase 1 (MVP)**: Core functionality with manual entry
**Phase 2**: Barcode scanning and product databases  
**Phase 3**: AI-powered features and automation
**Phase 4**: Native mobile apps and smart home integration
**Phase 5**: Enterprise features and advanced analytics# food-ventory
