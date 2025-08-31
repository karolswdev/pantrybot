# Components Documentation

## Authentication Components

### Login Page (`/app/(auth)/login/page.tsx`)

The login page provides secure authentication for existing users.

**Features:**
- Email and password validation using Zod schemas
- Password visibility toggle
- Remember me option
- Loading states during submission
- Error display for invalid credentials
- Links to signup and forgot password pages
- Social login placeholders (disabled in MVP)

**Props:** None (page component)

**Usage:**
The login page is automatically rendered at the `/login` route. It integrates with the auth store to handle authentication and redirects to `/dashboard` on successful login.

### Signup Page (`/app/(auth)/signup/page.tsx`)

The signup page allows new users to create accounts.

**Features:**
- Display name, email, password, household name, and timezone fields
- Real-time password strength indicators
- Form validation with Zod schemas
- Terms and conditions agreement checkbox
- Loading states during registration
- Error display for registration failures
- Link to login page for existing users

**Props:** None (page component)

**Usage:**
The signup page is automatically rendered at the `/signup` route. It integrates with the auth store to handle registration and redirects to `/dashboard` on successful account creation.

### Auth Layout (`/app/(auth)/layout.tsx`)

A shared layout wrapper for all authentication pages.

**Features:**
- Centered card design with consistent styling
- Fridgr logo and tagline
- Responsive design
- Clean, minimal aesthetic

**Props:**
- `children`: React.ReactNode - The auth page content to render

**Usage:**
Automatically wraps all pages in the `(auth)` route group, providing consistent layout and styling for login, signup, and other auth-related pages.

## Form Validation Schemas

### Login Schema (`/lib/validations/auth.ts`)
- **email**: Required, valid email format
- **password**: Required
- **rememberMe**: Optional boolean

### Signup Schema (`/lib/validations/auth.ts`)
- **displayName**: Required, 2-50 characters
- **email**: Required, valid email format
- **password**: Required, 8+ characters with uppercase and number
- **householdName**: Required, 2-50 characters
- **timezone**: Required, valid timezone string
- **agreeToTerms**: Required, must be true

## Integration with Auth Store

Both login and signup forms integrate with the Zustand auth store (`/stores/auth.store.ts`) which handles:
- API communication via the configured axios client
- Token management (access and refresh tokens)
- User state persistence
- Error handling
- Loading states

## Styling

All auth components use:
- Tailwind CSS for styling
- shadcn/ui components for form elements
- Custom color palette defined in `tailwind.config.ts`
- Responsive design principles
- Accessibility best practices