# Fridgr - Smart Household Food Inventory Management 🥗

![Version](https://img.shields.io/badge/version-1.0.0--MVP-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Docker](https://img.shields.io/badge/docker-ready-blue)

## 🎯 Overview

Fridgr is a comprehensive household food inventory management system designed to reduce food waste through intelligent tracking of perishable items. It enables households to collaboratively manage their food inventory, receive timely expiration notifications, and maintain synchronized shopping lists.

## ✨ Key Features

### Current MVP Features
- 🏠 **Multi-Household Support** - Users can belong to and manage multiple households
- 📦 **Smart Inventory Tracking** - Track items with expiration dates, quantities, and storage locations
- ⏰ **Expiration Alerts** - Multi-channel notifications (email, in-app, Telegram)
- 🛒 **Collaborative Shopping Lists** - Real-time synchronized lists with WebSocket support
- 👥 **Role-Based Access Control** - Admin, Member, and Viewer roles per household
- 📱 **Progressive Web App** - Mobile-first responsive design with offline capabilities
- 📊 **Analytics & Reports** - Track waste patterns and household statistics
- 🔄 **Real-Time Updates** - Live synchronization across all household members

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Git

### 🐳 Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/KaShaSoft/food-ventory.git
cd fridgr

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3003
# Mock API: http://localhost:8080
```

### 💻 Local Development

```bash
# Clone repository
git clone https://github.com/KaShaSoft/food-ventory.git
cd fridgr

# Install frontend dependencies
cd frontend
npm install

# Start frontend development server
npm run dev

# In another terminal, start backend
cd ../backend
npm install
npm start

# Access at http://localhost:3000
```

## 🏗️ Architecture

```
fridgr/
├── frontend/                 # Next.js 14+ React application
│   ├── app/                 # App router pages
│   ├── components/          # Reusable React components
│   ├── hooks/               # Custom React hooks & queries
│   ├── lib/                 # Utilities and services
│   └── cypress/             # E2E tests
├── backend/                 # Node.js API server (Express with WebSocket)
├── .pm/                     # Project management & documentation
│   ├── evidence/            # Test execution evidence
│   ├── execution-plan/      # Development phases
│   └── system/              # Requirements & architecture docs
└── docker-compose.yml       # Container orchestration
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI Library**: React 18+ with Radix UI
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form with Zod validation
- **Testing**: Cypress E2E, Jest

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Real-time**: Socket.io
- **Database**: In-memory with file persistence (PostgreSQL ready)
- **Authentication**: JWT tokens

### DevOps
- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint, Prettier

## 🧪 Testing

```bash
# Run frontend E2E tests
cd frontend
npm run test:e2e

# Run frontend unit tests
npm test

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Test Coverage
- 25 Cypress E2E test suites
- 100% integration test coverage
- Real-time WebSocket testing
- Authentication flow testing
- Multi-household scenarios

## 📚 Documentation

Comprehensive documentation available in `.pm/` directory:
- 📋 [System Requirements](.pm/system/mvp/SRS.md)
- 👤 [User Stories](.pm/user-stories.md)
- 🏛️ [Technical Architecture](.pm/technical-architecture.md)
- 🔌 [API Specifications](.pm/api-specifications.md)
- 💾 [Database Schema](.pm/database-schema.md)
- 🤖 [Telegram Bot Setup](.pm/telegram-bot-requirements.md)
- 🗺️ [Feature Roadmap](.pm/feature-roadmap.md)

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- XSS protection
- CSRF tokens

## 🎯 Performance Targets

- API response time: <200ms (p95)
- Real-time updates: <1 second
- PWA Lighthouse score: >90
- Bundle size: <500KB gzipped
- Time to Interactive: <3 seconds

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ by the Fridgr team
- Special thanks to all contributors
- Powered by open source technologies

## 📞 Support

- 📧 Email: support@fridgr.app
- 🐛 Issues: [GitHub Issues](https://github.com/KaShaSoft/food-ventory/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/KaShaSoft/food-ventory/discussions)

## 🗺️ Roadmap

### Phase 1: MVP (Complete ✅)
- Core inventory management
- Multi-household support
- Real-time synchronization
- Shopping lists
- Notifications

### Phase 2: Enhanced Features (Q2 2024)
- Barcode scanning
- Product database integration
- Recipe suggestions
- Meal planning

### Phase 3: AI & Automation (Q3 2024)
- Smart expiration predictions
- Automated shopping lists
- Waste reduction insights
- Voice assistant integration

### Phase 4: Enterprise (Q4 2024)
- Business accounts
- Advanced analytics
- API access
- White-label options

---

**Made with 💚 to reduce food waste and help households manage their food better**