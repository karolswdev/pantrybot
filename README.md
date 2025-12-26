# Pantrybot - Smart Household Food Inventory Management

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)

## Overview

Pantrybot is a household food inventory management system designed to reduce food waste through intelligent tracking of perishable items. It enables households to collaboratively manage their food inventory, receive timely expiration notifications, and maintain synchronized shopping lists.

## Key Features

- **Multi-Household Support** - Users can belong to and manage multiple households
- **Smart Inventory Tracking** - Track items with expiration dates, quantities, and storage locations
- **Expiration Alerts** - Multi-channel notifications (email, in-app, Telegram)
- **Collaborative Shopping Lists** - Real-time synchronized lists with WebSocket support
- **Role-Based Access Control** - Admin, Member, and Viewer roles per household
- **Progressive Web App** - Mobile-first responsive design
- **Analytics & Reports** - Track waste patterns and household statistics
- **Real-Time Updates** - Live synchronization across all household members

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)

### Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/karolswdev/pantrybot.git
cd pantrybot

# Start all services (includes PostgreSQL)
docker-compose up -d

# Access the application
# Frontend: http://localhost:3003
# Backend API: http://localhost:8080
# Grafana: http://localhost:3001 (admin/pantrybot123)
# Prometheus: http://localhost:9090
```

### Local Development

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Backend setup
cd backend
npm install
npx prisma migrate dev
npm start

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# Access at http://localhost:3000
```

## Project Structure

```
pantrybot/
├── frontend/                 # Next.js 14+ React application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks & queries
│   ├── lib/                 # Utilities and services
│   └── cypress/             # E2E tests
├── backend/                 # Node.js/Express API
│   ├── lib/                 # Logger, metrics
│   ├── middleware/          # Express middleware
│   ├── prisma/              # Database schema & migrations
│   └── repositories/        # Data access layer
├── observability/           # Prometheus, Grafana, Loki configs
├── .pm/                     # Project specifications
└── docker-compose.yml       # Container orchestration
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI**: React 18+, Radix UI, Tailwind CSS
- **State**: Zustand, TanStack Query
- **Real-time**: Socket.IO Client
- **Testing**: Cypress E2E

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15 with Prisma ORM
- **Real-time**: Socket.IO
- **Auth**: JWT with refresh tokens
- **Logging**: Pino (structured JSON)
- **Metrics**: Prometheus (prom-client)

### Infrastructure
- **Containers**: Docker, Docker Compose
- **Monitoring**: Prometheus, Grafana
- **Log Aggregation**: Loki, Promtail
- **CI/CD**: GitHub Actions

## API Endpoints

Base URL: `http://localhost:8080/api/v1`

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | User registration |
| `POST /auth/login` | User login |
| `POST /auth/refresh` | Refresh access token |
| `GET /households` | List user's households |
| `GET /households/:id/items` | List inventory items |
| `POST /households/:id/items` | Add inventory item |
| `GET /dashboard/stats` | Dashboard statistics |
| `GET /notifications` | User notifications |

## Development Commands

```bash
# Backend
cd backend
npm start              # Start server
npm run dev            # Start with hot reload
npx prisma studio      # Database GUI
npx prisma migrate dev # Run migrations

# Frontend
cd frontend
npm run dev            # Development server
npm run build          # Production build
npm run test:e2e       # Cypress tests
npm run lint           # ESLint

# Docker
docker-compose up -d              # Start all services
docker-compose logs -f backend    # View backend logs
docker-compose down               # Stop all services
```

## Environment Variables

### Backend
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/pantrybot
JWT_SECRET=your-secret-key
PORT=8080
NODE_ENV=development
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## Observability

The project includes a complete observability stack:

- **Prometheus** (`:9090`) - Metrics collection
- **Grafana** (`:3001`) - Dashboards and visualization
- **Loki** (`:3100`) - Log aggregation
- **Promtail** - Log shipping

Access Grafana at `http://localhost:3001` with credentials `admin/pantrybot123`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made to reduce food waste and help households manage their food better**
