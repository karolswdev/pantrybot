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

## Dashboard Components

### Dashboard Page (`/app/dashboard/page.tsx`)

The main dashboard page that provides an overview of household inventory status and quick access to common actions.

**Features:**
- Summary statistics cards with trends
- Expiring items list with urgency indicators
- Quick action buttons for common tasks
- Recent activity feed
- Loading skeleton state
- Empty inventory state

**States:**
- **Loading**: Displays DashboardSkeleton while fetching data
- **Empty**: Shows EmptyDashboard when no items exist
- **Normal**: Full dashboard with statistics and activity

### StatCard Component (`/components/dashboard/StatCard.tsx`)

A reusable card component for displaying key metrics with optional trends and alerts.

**Props:**
- `title: string` - The metric label
- `value: string | number` - The metric value
- `trend?: { value: string, direction: 'up' | 'down' }` - Optional trend indicator
- `alert?: string` - Optional alert message
- `className?: string` - Additional CSS classes
- `icon?: ReactNode` - Optional icon element

**Usage Example:**
```tsx
<StatCard
  title="Total Items"
  value={47}
  trend={{ value: '12%', direction: 'up' }}
/>
```

### ExpiringItemsList Component (`/components/dashboard/ExpiringItemsList.tsx`)

Displays a list of items that are expiring soon with visual urgency indicators.

**Props:**
- `items: ExpiringItem[]` - Array of expiring items
- `loading?: boolean` - Shows loading skeleton when true

**ExpiringItem Interface:**
```typescript
interface ExpiringItem {
  id: string;
  name: string;
  emoji: string;
  location: 'fridge' | 'freezer' | 'pantry';
  expiresIn: string;
  daysUntilExpiration?: number;
}
```

**Visual States:**
- **Expired** (red): Items past expiration (daysUntilExpiration <= 0)
- **Critical** (orange): Expires today or tomorrow (daysUntilExpiration <= 1)
- **Warning** (yellow): Expires within 3 days (daysUntilExpiration <= 3)
- **Normal** (gray): More than 3 days until expiration

### QuickActions Component (`/components/dashboard/QuickActions.tsx`)

Provides quick access buttons to common inventory management tasks.

**Features:**
- Add Item - Navigate to inventory with add modal
- Scan Barcode - Barcode scanning (disabled in MVP)
- Shopping List - Shopping list management (disabled in MVP)
- Recipe Ideas - Recipe suggestions (disabled in MVP)

### RecentActivity Component (`/components/dashboard/RecentActivity.tsx`)

Displays a feed of recent household inventory activities.

**Props:**
- `activities: ActivityItem[]` - Array of activity items
- `loading?: boolean` - Shows loading skeleton when true

**ActivityItem Interface:**
```typescript
interface ActivityItem {
  id: string;
  type: 'add' | 'consume' | 'expire' | 'system';
  message: string;
  timestamp: string;
  user?: string;
}
```

**Activity Type Colors:**
- `add` - Green (items added)
- `consume` - Blue (items consumed)
- `expire` - Red (items expired)
- `system` - Gray (system notifications)

### DashboardSkeleton Component (`/components/dashboard/DashboardSkeleton.tsx`)

Loading skeleton that matches the dashboard layout for smooth loading transitions.

**Features:**
- Animated placeholders for all dashboard sections
- Maintains layout structure during loading
- Provides visual feedback while data fetches

### EmptyDashboard Component (`/components/dashboard/EmptyDashboard.tsx`)

Empty state component displayed when the household has no inventory items.

**Features:**
- Clear call-to-action to add first item
- Friendly messaging about tracking benefits
- Alternative option to import from shopping list
- Centered card design for visual focus

## Inventory Components

### ItemCard Component (`/components/inventory/ItemCard.tsx`)

A versatile card component for displaying inventory items with visual expiration status indicators.

**Props:**
- `item: InventoryItem` - The inventory item data to display
  - `id: string` - Unique identifier
  - `name: string` - Item name
  - `quantity: number` - Amount of item
  - `unit: string` - Unit of measurement
  - `location: "fridge" | "freezer" | "pantry"` - Storage location
  - `category?: string` - Item category
  - `expirationDate?: string` - Expiration date (ISO format)
  - `bestBeforeDate?: string` - Best before date (ISO format)
  - `imageUrl?: string` - Optional item image URL
  - `notes?: string` - Optional notes
- `viewMode?: "grid" | "list"` - Display mode (default: "grid")
- `onEdit?: (item: InventoryItem) => void` - Edit handler
- `onConsume?: (item: InventoryItem) => void` - Consume handler
- `onWaste?: (item: InventoryItem) => void` - Waste handler
- `onDelete?: (item: InventoryItem) => void` - Delete handler

**Visual States:**
The component displays different visual states based on expiration:
- **Expired** (red border/background): Items past expiration date
- **Critical** (red border/background): Expires today or tomorrow
- **Warning** (yellow border/background): Expires within 3 days
- **Fresh** (gray border): More than 3 days until expiration
- **No Date** (gray border): No expiration date set

**Features:**
- Responsive grid and list view modes
- Action buttons for quick item management
- Dropdown menu for additional actions (waste, delete)
- Visual indicators for expiration urgency
- Support for item images or default icons

**Usage Example:**
```tsx
import { ItemCard } from "@/components/inventory/ItemCard";

<ItemCard
  item={{
    id: "1",
    name: "Milk",
    quantity: 1,
    unit: "gallon",
    location: "fridge",
    category: "Dairy",
    expirationDate: "2024-01-25"
  }}
  viewMode="grid"
  onEdit={(item) => console.log("Edit:", item)}
  onConsume={(item) => console.log("Consume:", item)}
/>
```

### AddEditItemModal Component (`/components/inventory/AddEditItemModal.tsx`)

A modal dialog component for adding new inventory items or editing existing ones. Supports comprehensive validation and handles both create and update operations.

**Props:**
```typescript
interface AddEditItemModalProps {
  open: boolean;                                     // Controls modal visibility
  onOpenChange: (open: boolean) => void;            // Callback when modal open state changes
  item?: InventoryItem | null;                      // Item to edit (null for add mode)
  location?: "fridge" | "freezer" | "pantry";      // Default location for new items
  onSubmit: (data: InventoryItemFormData) => Promise<void>; // Form submission handler
}
```

**Features:**
- Form validation using Zod schema with real-time error display
- Date pickers for expiration, best before, and purchase dates
- Category and unit dropdowns with predefined options
- Responsive layout with side-by-side fields
- Loading state during submission
- Error handling and display
- Automatic form reset on successful submission
- Different titles and behavior for add vs edit modes

**Form Fields:**
- **Item Name*** - Required, max 100 characters
- **Quantity*** - Required, positive number
- **Unit*** - Required, selection from predefined list
- **Location*** - Required (fridge/freezer/pantry)
- **Category** - Optional, selection from predefined categories
- **Expiration Date** - Optional date picker
- **Best Before Date** - Optional date picker
- **Purchase Date** - Optional date picker with past dates only
- **Price** - Optional, positive number with currency symbol
- **Notes** - Optional text area, max 500 characters

**Usage Example:**
```tsx
import { AddEditItemModal } from '@/components/inventory/AddEditItemModal';
import { useCreateItem, useUpdateItem } from '@/hooks/mutations/useInventoryMutations';

function InventoryPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  
  const handleSubmit = async (data) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ itemId: editingItem.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };
  
  return (
    <AddEditItemModal
      open={modalOpen}
      onOpenChange={setModalOpen}
      item={editingItem}
      location="fridge"
      onSubmit={handleSubmit}
    />
  );
}
```

## Household Components

### HouseholdSwitcher Component (`/components/households/HouseholdSwitcher.tsx`)

A dropdown component for switching between households in the main navigation header.

**Features:**
- Displays current active household name
- Dropdown menu with all user households
- Shows household role and member count
- Visual checkmark for current selection
- "Create New Household" option (placeholder)
- Loading and error states

**Usage:**
The HouseholdSwitcher is integrated into the AppShell header and automatically syncs with the auth store's currentHouseholdId state.

### Household Settings Page (`/app/settings/households/page.tsx`)

The household management page for viewing members and household information.

**Features:**
- Member list with role badges
- Invite Member modal (admin only)
- Household information display
- Role-based UI (admin vs member)
- Danger zone for destructive actions (admin only)

**Role-based Features:**
- **Admin**: Can invite members, manage roles, delete household
- **Member**: Can view members and household info
- **Viewer**: Read-only access to household information

## Notification Components

### NotificationBell Component (`/components/notifications/NotificationBell.tsx`)

A dropdown notification bell component displayed in the app header that shows real-time notifications with an unread count badge.

**Features:**
- Unread notification count badge (shows "9+" for more than 9)
- Dropdown menu with recent notifications (max 10 shown)
- Auto-marks notifications as read after 1 second when opened
- Visual indicators for read/unread status
- Different icons based on notification type
- Relative timestamps using date-fns
- Empty state when no notifications exist
- Link to view all notifications (when > 10)

**Notification Types & Icons:**
- `expiring` - ⚠️ Warning icon for items expiring soon
- `expired` - 🚨 Alert icon for expired items
- `low_stock` - 📦 Package icon for low stock items
- `shopping` - 🛒 Cart icon for shopping list updates
- `household` - 🏠 House icon for household events
- Default - 📢 Speaker icon for general notifications

**Integration:**
The NotificationBell component integrates with:
- Zustand notification store for state management
- SignalR service for real-time notification updates
- React Query for syncing with backend

**Usage:**
The component is already integrated into the AppShell header. No additional setup required.

### Toast Component (`/components/notifications/Toast.tsx`)

A toast notification system that displays temporary messages with auto-dismiss functionality and visual feedback.

**Props:** None (uses notification store)

**Features:**
- Multiple toast types: success, error, warning, info
- Auto-dismiss after 5 seconds (configurable per toast)
- Manual dismiss via close button
- Animated progress bar showing time until auto-dismiss
- Stacking support for multiple toasts
- Different colors and icons for each type
- Positioned top-right for visibility

**Toast Types:**
- **Success** (green): Confirmation of successful actions
- **Error** (red): Error messages and failures
- **Warning** (yellow): Important warnings
- **Info** (blue): General information

**Animation:**
Uses Tailwind CSS animation for the shrinking progress bar that visually indicates time remaining before auto-dismiss.

**Usage:**
The Toast component is integrated into AppShell. To show a toast from any component:

```tsx
import { useNotificationStore } from '@/stores/notifications.store';

function MyComponent() {
  const { showToast } = useNotificationStore();
  
  const handleAction = () => {
    showToast({
      type: 'success',
      title: 'Item added successfully',
      message: 'The item has been added to your inventory',
      duration: 5000 // optional, defaults to 5000ms
    });
  };
}
```

## Settings Components

### NotificationSettingsForm (`/app/settings/notifications/page.tsx`)

A comprehensive form component for managing notification preferences across email, in-app, and Telegram channels.

**Features:**
- Email notification toggles (daily summary, expiry alerts, reports)
- In-app notification toggles (real-time alerts, member activity)
- Telegram bot connection with verification code flow
- Customizable expiration warning days (1-30)
- Preferred notification time selector
- Auto-save with optimistic updates
- Loading and error states

**State Management:**
- Fetches current settings using `useNotificationSettings` query hook
- Updates settings via `useUpdateNotificationSettings` mutation
- Links Telegram accounts via `useLinkTelegram` mutation
- Displays success/error toasts for all actions

**Telegram Integration:**
The component includes a modal dialog for linking Telegram accounts:
1. User clicks "Connect with Telegram" button
2. Modal provides instructions for bot interaction
3. User enters verification code from @FridgrBot
4. System validates and links the account

**Usage:**
The NotificationSettingsForm is rendered at `/settings/notifications`. It automatically:
- Loads user's current notification preferences
- Populates form fields with existing settings
- Handles all API interactions with proper error handling
- Updates the UI optimistically while saving

**Validation:**
- Expiration warning days: min 1, max 30
- Verification code: required for Telegram linking
- Time format: 24-hour format (HH:MM)

## Shopping List Components

### ShoppingListPage Component (`/app/shopping/page.tsx`)

The main shopping list page that displays all shopping lists for the active household.

**Features:**
- Grid layout for multiple shopping lists
- "New List" button to create new shopping lists
- Empty state when no lists exist
- Loading and error states
- Responsive design (2 columns on md, 3 columns on lg)
- Integration with household context

**States:**
- **No Household**: Prompts user to select a household
- **Loading**: Shows loading message
- **Error**: Displays error message with retry option
- **Empty**: Shows call-to-action to create first list
- **Normal**: Grid of shopping list cards

### ShoppingListCard Component (`/components/shopping/ShoppingListCard.tsx`)

A card component for displaying individual shopping list information with progress tracking and actions.

**Props:**
- `list: ShoppingList` - The shopping list data
  - `id: string` - Unique identifier
  - `name: string` - List name
  - `itemCount: number` - Total items in list
  - `completedCount: number` - Number of completed items
  - `createdAt: string` - Creation timestamp
  - `createdBy: string` - Creator's name
  - `lastUpdated: string` - Last modification timestamp

**Features:**
- Visual progress bar showing completion percentage
- Estimated cost calculation based on item count
- Action buttons for Share, Edit, and Delete
- Clickable card to navigate to detail view
- Created by information
- Hover effect for better interactivity

**Visual Elements:**
- Progress bar with green fill for completed items
- Icon buttons in card header for actions
- Muted text for metadata (items count, creator, etc.)

### CreateListModal Component (`/components/shopping/CreateListModal.tsx`)

A modal dialog for creating new shopping lists with validation and error handling.

**Props:**
- `isOpen: boolean` - Controls modal visibility
- `onClose: () => void` - Callback when modal closes
- `householdId: string` - Current household ID for list creation

**Features:**
- Form with list name (required) and notes (optional)
- Client-side validation for empty names
- Loading state during creation
- Toast notifications for success/error feedback
- Form reset on successful submission
- Cancel button to close without saving

**Form Fields:**
- **List Name*** - Required text input
- **Notes** - Optional textarea for additional details

**Integration:**
- Uses `useCreateShoppingList` mutation hook
- Invalidates shopping lists query on success
- Updates cache optimistically for instant UI feedback

### ShoppingListDetail Component (`/app/shopping/[listId]/page.tsx`)

A detailed view page for managing individual shopping lists with real-time item synchronization.

**Features:**
- Separate "To Buy" and "Bought" sections for item organization
- Add item form with instant addition
- Check/uncheck items to move between sections
- Visual count indicators for each section
- Back navigation to shopping lists overview
- Share, Edit, and Delete list actions
- Loading and error states

**State Management:**
- Fetches list details using `useShoppingListDetails` query
- Fetches list items using `useShoppingListItems` query
- Creates items via `useAddShoppingListItem` mutation
- Updates item status via `useUpdateShoppingListItem` mutation

**Item States:**
- **To Buy**: Items not yet purchased (isCompleted: false)
- **Bought**: Items marked as purchased (isCompleted: true)

**Real-Time Features:**
- Optimistic updates for instant UI feedback
- Cache invalidation for consistency
- Prepared for SignalR event integration

### ShoppingListItem Component (`/components/shopping/ShoppingListItem.tsx`)

A reusable component for displaying individual shopping list items with interactive checkbox controls.

**Props:**
- `item: ShoppingListItemType` - The item data
  - `id: string` - Unique identifier
  - `name: string` - Item name
  - `quantity?: number` - Optional quantity
  - `unit?: string` - Optional unit of measurement
  - `category?: string` - Optional category badge
  - `isCompleted: boolean` - Purchase status
- `onToggle: () => void` - Callback for checkbox interaction
- `data-testid?: string` - Optional test identifier

**Features:**
- Interactive checkbox for marking items as bought/unbought
- Visual distinction between completed and pending items
  - Completed: Muted background, line-through text, reduced opacity
  - Pending: Normal background, hover effect
- Category badges for item organization
- Quantity and unit display when available
- Accessible ARIA labels for checkbox interactions

**Visual States:**
- **Pending**: White background with hover effect
- **Completed**: Gray background with strikethrough text
- **Hover**: Subtle background color change for better UX