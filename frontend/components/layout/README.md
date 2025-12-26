# Layout Components

This directory contains the main layout components for the Pantrybot application.

## AppShell Component

The `AppShell` component is the main layout wrapper for all authenticated pages in the application. It provides:

### Features
- **Protected Route Handling**: Automatically redirects unauthenticated users to the login page when they try to access protected routes
- **Responsive Navigation**: Collapsible sidebar on mobile devices with hamburger menu
- **Top Navigation Bar**: Contains logo, quick actions, notifications, and user profile
- **Side Navigation**: Hierarchical navigation menu with support for nested items (e.g., Inventory sub-items)
- **Main Content Area**: Dynamic content area that renders page-specific content
- **Footer**: Consistent footer across all authenticated pages

### Usage

The AppShell component is automatically applied to all pages through the Providers component. It checks the current route and authentication status to determine whether to render the full shell or just the page content.

### Protected Routes

The following routes are protected and require authentication:
- `/dashboard` - Main dashboard
- `/inventory/*` - All inventory pages
- `/shopping` - Shopping lists
- `/reports` - Reports and analytics
- `/settings` - User and household settings

### Public Routes

These routes are accessible without authentication:
- `/` - Home page
- `/login` - Login page
- `/signup` - Registration page
- `/forgot-password` - Password reset request
- `/reset-password` - Password reset confirmation

### Props

| Prop | Type | Description |
|------|------|-------------|
| children | React.ReactNode | The page content to render within the shell |

### Authentication State

Currently, the component checks for an `accessToken` in localStorage to determine authentication status. This will be replaced with proper Zustand store integration in the next phase.

### Responsive Behavior

- **Desktop (lg and above)**: Sidebar is always visible, content has left padding
- **Mobile/Tablet (below lg)**: Sidebar is hidden by default, toggleable via hamburger menu

### Customization

The component uses Tailwind CSS classes for styling. Colors reference the custom Pantrybot palette defined in globals.css:
- Primary colors (green) for active states
- Gray colors for default states
- Hover effects on all interactive elements

## Future Enhancements

- Integration with Zustand auth store for centralized state management
- Real-time notification badge updates via WebSocket
- User preferences for sidebar collapsed state
- Keyboard navigation support
- Breadcrumb navigation
- Theme switching (light/dark mode)