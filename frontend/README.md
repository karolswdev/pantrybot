# Fridgr Frontend

This is the Next.js frontend application for Fridgr - a household food inventory management system.

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

- Node.js 18+
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
└── types/            # TypeScript type definitions
```

## Available Scripts

- `npm run dev` - Run development server with hot reload
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run Jest tests
- `npm run test:e2e` - Run Cypress E2E tests

## Testing

### Unit/Component Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## Building for Production

```bash
npm run build
npm run start
```

## Docker Support

Build and run with Docker:
```bash
docker build -t fridgr-frontend .
docker run -p 3000:3000 fridgr-frontend
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