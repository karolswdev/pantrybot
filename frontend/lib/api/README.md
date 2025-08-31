# API Client Documentation

## Overview

The Fridgr API client provides a centralized interface for all API communications with automatic token management, request/response interceptors, and typed endpoints.

## Features

- **Automatic Token Management**: Handles JWT access and refresh tokens transparently
- **Request Interceptors**: Automatically adds authentication headers and request IDs
- **Response Interceptors**: Handles 401 errors with automatic token refresh and retry
- **Token Rotation**: Implements secure single-use refresh token rotation
- **Queue Management**: Queues concurrent requests during token refresh to prevent multiple refresh attempts
- **Typed API Methods**: Provides type-safe methods for all API endpoints

## Token Refresh Flow

The API client automatically handles token expiration and refresh:

1. When a request receives a 401 Unauthorized response:
   - The client checks if it's not an auth endpoint (login, register, etc.)
   - If a refresh is not already in progress, it initiates the refresh flow
   - Any concurrent requests are queued to wait for the refresh to complete

2. During token refresh:
   - The refresh token is sent to `/api/v1/auth/refresh`
   - New access and refresh tokens are received and stored
   - The original request is retried with the new access token
   - All queued requests are processed with the new token

3. If refresh fails:
   - All tokens are cleared from storage
   - The user is redirected to the login page
   - All queued requests are rejected

## Usage

### Import the API Client

```typescript
import { api, tokenManager } from '@/lib/api-client';
```

### Authentication Endpoints

```typescript
// Register a new user
const response = await api.auth.register({
  email: 'user@example.com',
  password: 'SecurePass123!',
  displayName: 'John Doe',
  timezone: 'America/New_York'
});

// Login
const response = await api.auth.login({
  email: 'user@example.com',
  password: 'SecurePass123!'
});

// Logout
const refreshToken = tokenManager.getRefreshToken();
await api.auth.logout(refreshToken);

// Forgot password
await api.auth.forgotPassword('user@example.com');

// Reset password
await api.auth.resetPassword(resetToken, 'NewSecurePass123!');
```

### Household Management

```typescript
// List user's households
const response = await api.households.list();

// Get household details
const household = await api.households.get(householdId);

// Create a new household
const newHousehold = await api.households.create({
  name: 'Beach House',
  description: 'Vacation home',
  timezone: 'America/Los_Angeles'
});

// Update household
await api.households.update(householdId, {
  name: 'Updated Name',
  description: 'Updated description'
});

// Invite member
await api.households.inviteMember(householdId, 'newmember@example.com', 'member');

// Remove member
await api.households.removeMember(householdId, userId);

// Update member role
await api.households.updateMemberRole(householdId, userId, 'admin');
```

### Inventory Management

```typescript
// List household items with filters
const items = await api.items.list(householdId, {
  location: 'fridge',
  category: 'dairy',
  status: 'fresh',
  search: 'milk',
  page: 1,
  pageSize: 20,
  sortBy: 'expirationDate',
  sortOrder: 'asc'
});

// Get item details
const item = await api.items.get(householdId, itemId);

// Add new item
const newItem = await api.items.create(householdId, {
  name: 'Organic Milk',
  quantity: 1,
  unit: 'gallon',
  location: 'fridge',
  category: 'dairy',
  expirationDate: '2024-01-20',
  purchaseDate: '2024-01-15',
  price: 5.99,
  notes: 'Whole milk'
});

// Update item
await api.items.update(householdId, itemId, {
  quantity: 0.5,
  notes: 'Half consumed'
});

// Delete item
await api.items.delete(householdId, itemId);

// Consume item
await api.items.consume(householdId, itemId, 0.5);
```

### Token Manager Utilities

```typescript
// Get current access token
const accessToken = tokenManager.getAccessToken();

// Get refresh token
const refreshToken = tokenManager.getRefreshToken();

// Check if token is expired
const isExpired = tokenManager.isTokenExpired();

// Manually set tokens (usually handled automatically)
tokenManager.setTokens(accessToken, refreshToken, expiresIn);

// Clear all tokens (logout)
tokenManager.clearTokens();
```

## Configuration

The API client uses the following environment variables:

- `NEXT_PUBLIC_API_URL`: Base URL for the API (defaults to `http://localhost:5000/api/v1`)

## Error Handling

The API client automatically handles common error scenarios:

- **401 Unauthorized**: Triggers automatic token refresh
- **Network Errors**: Thrown to the caller for handling
- **Validation Errors**: Passed through with error details
- **Rate Limiting**: Response includes rate limit headers

## Security Considerations

- Tokens are stored in localStorage (consider using httpOnly cookies in production)
- Refresh tokens are single-use and rotated on each refresh
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Automatic logout and redirect on authentication failure

## Testing

The API client includes comprehensive tests for token refresh scenarios:

- Automatic token refresh on 401 errors
- Request retry after successful refresh
- Queue management for concurrent requests
- Proper handling of auth endpoint failures
- Token cleanup on refresh failure

See `lib/__tests__/apiClient.test.ts` for test implementation details.