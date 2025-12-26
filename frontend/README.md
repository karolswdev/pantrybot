# Pantrybot Frontend

This is the Next.js frontend application for Pantrybot - a household food inventory management system.

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI**: React 18+
- **Styling**: Tailwind CSS v4
- **Component Library**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Environment Variables

Create a `.env.local` file in the root of the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
frontend/
├── app/                  # Next.js App Router pages
│   ├── (auth)/          # Authentication pages (login, signup)
│   ├── dashboard/       # Dashboard page
│   ├── inventory/       # Inventory management pages
│   ├── shopping/        # Shopping list pages
│   ├── reports/         # Reports and analytics
│   └── settings/        # Settings pages
├── components/          # React components
│   ├── layout/         # Layout components (AppShell, Navigation)
│   ├── ui/            # UI components (shadcn/ui)
│   ├── forms/         # Form components
│   └── providers/     # Context providers
├── lib/                # Utility functions and API client
│   ├── api/          # API client and hooks
│   ├── stores/       # Zustand stores
│   └── utils/        # Helper functions
├── public/            # Static files
│   ├── icons/        # PWA icons
│   └── manifest.json # PWA manifest
├── stores/            # Zustand state stores
├── hooks/             # Custom React hooks
│   ├── queries/      # React Query hooks for data fetching
│   └── mutations/    # React Query hooks for data mutations
├── cypress/           # E2E test files
│   ├── e2e/         # Test specifications
│   └── support/     # Test utilities and commands
└── types/            # TypeScript type definitions
```

## State Management Architecture

### Overview
The application uses a hybrid state management approach combining Zustand for client-side state and TanStack Query for server state management.

### Client State (Zustand)

#### Auth Store (`stores/auth.store.ts`)
- **Purpose**: Manages authentication state and user session
- **State**:
  - `user`: Current user information
  - `isAuthenticated`: Authentication status
  - `tokens`: Access and refresh tokens
- **Actions**:
  - `login()`: Authenticate user
  - `logout()`: Clear session
  - `refreshTokens()`: Refresh authentication tokens

#### Notifications Store (`stores/notifications.store.ts`)
- **Purpose**: Manages in-app notifications and alerts
- **State**:
  - `notifications`: Array of notification objects
  - `unreadCount`: Number of unread notifications
- **Actions**:
  - `addNotification()`: Add new notification
  - `markAsRead()`: Mark notification as read
  - `clearAll()`: Clear all notifications

### Server State (TanStack Query)

#### Query Hooks (`hooks/queries/`)
- **useInventoryItems**: Fetches inventory items with filtering and pagination
- **useShoppingLists**: Fetches shopping lists for a household
- **useHouseholds**: Fetches user's households
- **useNotificationSettings**: Fetches notification preferences

#### Mutation Hooks (`hooks/mutations/`)
- **useInventoryMutations**: Add, update, delete inventory items
- **useCreateShoppingList**: Create new shopping lists
- **useUpdateNotificationSettings**: Update notification preferences
- **useLinkTelegram**: Link Telegram account for notifications

### State Management Patterns

#### 1. Optimistic Updates
- Inventory operations update UI immediately
- Shopping list changes are reflected instantly
- Rollback on server errors

#### 2. Cache Invalidation
- Automatic invalidation after mutations
- Manual invalidation for cross-feature updates
- Background refetching for real-time sync

#### 3. Persistent State
- Auth tokens stored in secure storage
- User preferences persisted locally
- Offline queue for pending operations

#### 4. Real-time Updates
- SignalR integration for live updates
- Automatic cache updates from WebSocket events
- Conflict resolution for concurrent edits

### Best Practices

1. **Separation of Concerns**: Client state for UI, server state for data
2. **Single Source of Truth**: Server state is authoritative
3. **Optimistic UI**: Immediate feedback for user actions
4. **Error Boundaries**: Graceful error handling and recovery
5. **Type Safety**: Full TypeScript coverage for state and actions

## Available Scripts

- `npm run dev` - Run development server with hot reload
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run Jest tests
- `npm run test:e2e` - Run Cypress E2E tests

## Testing Strategy

### Overview
Our testing strategy follows a comprehensive pyramid approach with multiple layers of testing to ensure application reliability and maintainability.

### Testing Layers

#### 1. Unit Tests
- **Location**: `*.test.ts`, `*.test.tsx` files co-located with components
- **Framework**: Jest + React Testing Library
- **Coverage**: Business logic, utility functions, custom hooks
- **Run**: `npm test`

#### 2. Component Tests
- **Location**: Component test files (e.g., `SignUp.test.tsx`, `Dashboard.test.tsx`)
- **Framework**: Jest + React Testing Library
- **Coverage**: Component rendering, user interactions, form validation
- **Approach**: Test components in isolation with mocked dependencies

#### 3. Integration Tests
- **Location**: `lib/__tests__/` directory
- **Coverage**: API client, authentication flow, data transformations
- **Focus**: Testing interactions between multiple modules

#### 4. E2E Tests
- **Location**: `cypress/e2e/` directory
- **Framework**: Cypress
- **Coverage**: Critical user journeys, cross-feature workflows
- **Run**: `npm run test:e2e`
- **Test Files**:
  - `Auth.cy.ts` - Authentication flows
  - `Inventory.cy.ts` - Inventory management
  - `ShoppingLists.cy.ts` - Shopping list features
  - `Notifications.cy.ts` - Real-time notifications
  - `PWA.cy.ts` - Progressive Web App features

### Test Naming Conventions
- Test files: `*.test.ts(x)` for unit/component tests, `*.cy.ts` for E2E tests
- Test descriptions: Use descriptive names that explain the behavior being tested
- Test IDs: Follow `TC-FE-X.Y` format for traceability

### Mocking Strategy
- API calls are mocked using Cypress intercepts for E2E tests
- Component tests use mocked hooks and providers
- Mock data is centralized in test fixtures
- Production guards ensure test code doesn't run in production

### Running Tests
```bash
# Unit and component tests
npm test

# Unit tests with coverage
npm test -- --coverage

# E2E tests (headless)
npm run test:e2e

# E2E tests (interactive)
npm run cypress:open

# Type checking
npm run type-check

# Linting
npm run lint
```

## Building for Production

```bash
npm run build
npm run start
```

## Docker Support

Build and run with Docker:
```bash
docker build -t pantrybot-frontend .
docker run -p 3000:3000 pantrybot-frontend
```

## PWA Features

The application is configured as a Progressive Web App with:
- Offline support
- App-like experience on mobile
- Install prompts
- Push notifications (when enabled)

## Code Style

- ESLint for linting
- Prettier for formatting
- TypeScript strict mode enabled

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

MIT