# Authentication Store Documentation

## Overview

The authentication store manages the global authentication state for the Fridgr application using Zustand with persistence. It handles user sessions, household management, and authentication flows.

## Store Structure

### State Properties

```typescript
interface AuthState {
  // User information
  user: User | null;                    // Current authenticated user
  households: Household[];               // User's households
  currentHouseholdId: string | null;    // Currently selected household ID (active household for all operations)
  
  // Authentication status
  isAuthenticated: boolean;             // Whether user is logged in
  isLoading: boolean;                   // Loading state for async operations
  error: string | null;                 // Error message if any
}
```

**Active Household Management:**
The `currentHouseholdId` property tracks which household is currently active for all household-scoped operations (inventory, shopping lists, etc.). This can be different from the user's `defaultHouseholdId` and is updated when the user switches households via the HouseholdSwitcher component.

### User Type

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  defaultHouseholdId?: string;    // User's default household
  activeHouseholdId?: string;      // Currently active household ID
}
```

### Household Type

```typescript
interface Household {
  id: string;
  name: string;
  role: 'admin' | 'member' | 'viewer';
}
```

## Actions

### login(email: string, password: string)

Authenticates a user with email and password.

```typescript
const authStore = useAuthStore();

try {
  await authStore.login('user@example.com', 'password123');
  // User is now authenticated
} catch (error) {
  // Handle login error
  console.error(authStore.error);
}
```

**Effects:**
- Sets user information
- Stores authentication tokens
- Loads user's households
- Sets default household

### register(data: RegisterData)

Registers a new user account.

```typescript
await authStore.register({
  email: 'newuser@example.com',
  password: 'SecurePass123!',
  displayName: 'John Doe',
  timezone: 'America/New_York'
});
```

**Effects:**
- Creates new user account
- Automatically logs in the user
- Creates default household
- Stores authentication tokens

### logout()

Logs out the current user.

```typescript
await authStore.logout();
// User is now logged out
```

**Effects:**
- Clears authentication tokens
- Resets user state
- Clears household information
- Redirects to login page (handled by API client)

### setCurrentHousehold(householdId: string)

Switches the active household context.

```typescript
authStore.setCurrentHousehold('household-uuid-123');
```

**Effects:**
- Updates currentHouseholdId
- Only allows switching to households the user belongs to

### clearError()

Clears any error messages in the store.

```typescript
authStore.clearError();
```

### checkAuth()

Verifies if the current session is valid.

```typescript
const isValid = authStore.checkAuth();
if (!isValid) {
  // Session expired, redirect to login
}
```

**Returns:** `boolean` - Whether the session is valid

**Effects:**
- Checks token expiration
- Clears state if session is invalid

### updateTokens(accessToken, refreshToken, expiresIn)

Updates authentication tokens (typically called by the API client).

```typescript
authStore.updateTokens(newAccessToken, newRefreshToken, 900);
```

**Effects:**
- Updates stored tokens
- Maintains authenticated state

## Usage in Components

### Hook Usage

```typescript
import useAuthStore from '@/stores/auth.store';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    households,
    currentHouseholdId,
    login,
    logout 
  } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginForm onSubmit={login} />;
  }

  return (
    <div>
      <h1>Welcome, {user?.displayName}!</h1>
      <p>Current Household: {
        households.find(h => h.id === currentHouseholdId)?.name
      }</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Selective State Subscription

```typescript
// Subscribe only to specific state slices for better performance
const user = useAuthStore(state => state.user);
const isLoading = useAuthStore(state => state.isLoading);
```

### Protected Route Example

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/auth.store';

function ProtectedRoute({ children }) {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!checkAuth()) {
      router.push('/login');
    }
  }, []);

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return children;
}
```

### Household Selector Component

```typescript
function HouseholdSelector() {
  const { 
    households, 
    currentHouseholdId, 
    setCurrentHousehold 
  } = useAuthStore();

  return (
    <select 
      value={currentHouseholdId || ''} 
      onChange={(e) => setCurrentHousehold(e.target.value)}
    >
      {households.map(household => (
        <option key={household.id} value={household.id}>
          {household.name} ({household.role})
        </option>
      ))}
    </select>
  );
}
```

## Persistence

The store uses Zustand's persist middleware with localStorage:

- **Persisted State**: `user`, `households`, `currentHouseholdId`
- **Non-Persisted State**: `isAuthenticated`, `isLoading`, `error`
- **Storage Key**: `auth-storage`

The authentication status is revalidated on app load by checking token validity.

## Error Handling

The store provides error state for handling authentication failures:

```typescript
function LoginForm() {
  const { login, error, clearError, isLoading } = useAuthStore();

  useEffect(() => {
    // Clear errors when component unmounts
    return () => clearError();
  }, []);

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="error-message">{error}</div>
      )}
      <button disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Integration with API Client

The auth store works seamlessly with the API client:

1. **Token Management**: The API client uses tokens stored by the auth store
2. **Automatic Refresh**: Token refresh is handled by the API client, which updates the store
3. **Logout on 401**: The API client triggers logout when refresh fails
4. **Session Validation**: The store provides `checkAuth()` to validate sessions

## Best Practices

1. **Always handle errors**: Wrap auth actions in try-catch blocks
2. **Clear errors**: Clean up error state when appropriate
3. **Check authentication**: Validate session before rendering protected content
4. **Use selectors**: Subscribe only to needed state slices for performance
5. **Household context**: Always check currentHouseholdId before household-specific operations

## Testing

The auth store can be tested by mocking the API client:

```typescript
import { renderHook, act } from '@testing-library/react';
import useAuthStore from '@/stores/auth.store';

jest.mock('@/lib/api-client');

test('login updates user state', async () => {
  const { result } = renderHook(() => useAuthStore());
  
  await act(async () => {
    await result.current.login('test@test.com', 'password');
  });
  
  expect(result.current.isAuthenticated).toBe(true);
  expect(result.current.user?.email).toBe('test@test.com');
});
```