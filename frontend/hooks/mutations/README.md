# Mutation Hooks Documentation

This directory contains React Query mutation hooks for modifying data via the API.

## Shopping List Mutation Hooks

### useCreateShoppingList

**Location:** `useCreateShoppingList.ts`

**Description:** Creates a new shopping list for a household.

**Parameters:**
- `householdId: string` - The household ID (passed to hook)
- `data: CreateShoppingListInput` - The list data (passed to mutate)

```typescript
interface CreateShoppingListInput {
  name: string;
  notes?: string;
}
```

**Returns:**
```typescript
{
  mutate: (data: CreateShoppingListInput) => void;
  mutateAsync: (data: CreateShoppingListInput) => Promise<CreateShoppingListResponse>;
  isPending: boolean;
  isError: boolean;
  error?: Error;
  // ... other React Query mutation properties
}
```

**Usage Example:**
```tsx
import { useCreateShoppingList } from "@/hooks/mutations/useCreateShoppingList";

function CreateListModal({ householdId }) {
  const createList = useCreateShoppingList(householdId);
  
  const handleSubmit = async (formData) => {
    try {
      const list = await createList.mutateAsync({
        name: formData.name,
        notes: formData.notes
      });
      toast.success(`Created list: ${list.name}`);
      onClose();
    } catch (error) {
      toast.error("Failed to create shopping list");
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createList.isPending}>
        {createList.isPending ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
```

**Features:**
- Automatically invalidates shopping lists query on success
- Updates cache optimistically for instant UI feedback
- Falls back to mock response when API is unavailable
- Integrates with household context

## Household Mutation Hooks

### useCreateHousehold

**Location:** `useHouseholdMutations.ts`

**Description:** Creates a new household for the user.

**Parameters:**
```typescript
interface CreateHouseholdData {
  name: string;
  description?: string;
  timezone: string;
}
```

**Returns:**
```typescript
{
  mutate: (data: CreateHouseholdData) => void;
  mutateAsync: (data: CreateHouseholdData) => Promise<HouseholdResponse>;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  // ... other React Query mutation properties
}
```

**Usage Example:**
```tsx
import { useCreateHousehold } from "@/hooks/mutations/useHouseholdMutations";

function CreateHouseholdModal() {
  const createMutation = useCreateHousehold();
  
  const handleSubmit = async (formData) => {
    try {
      const household = await createMutation.mutateAsync(formData);
      toast.success(`Created household: ${household.name}`);
      onClose();
    } catch (error) {
      toast.error("Failed to create household");
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={createMutation.isLoading}>
        {createMutation.isLoading ? "Creating..." : "Create Household"}
      </button>
    </form>
  );
}
```

### useInviteMember

**Location:** `useHouseholdMutations.ts`

**Description:** Invites a new member to a household.

**Parameters:**
```typescript
interface InviteMemberData {
  householdId: string;
  email: string;
  role: "admin" | "member" | "viewer";
}
```

**Returns:** Standard React Query mutation object

**Usage Example:**
```tsx
import { useInviteMember } from "@/hooks/mutations/useHouseholdMutations";

function InviteMemberModal({ householdId }) {
  const inviteMutation = useInviteMember();
  
  const handleInvite = async (email, role) => {
    await inviteMutation.mutateAsync({
      householdId,
      email,
      role
    });
  };
  
  // ... rest of component
}
```

## Inventory Mutation Hooks

### useCreateItem

**Location:** `useInventoryMutations.ts`

**Description:** Creates a new inventory item in the specified household.

**Parameters:**
```typescript
interface CreateItemData {
  name: string;
  quantity: number;
  unit: string;
  location: "fridge" | "freezer" | "pantry";
  category?: string;
  expirationDate?: string;
  bestBeforeDate?: string;
  purchaseDate?: string;
  price?: number;
  notes?: string;
  householdId?: string; // Defaults to active household
}
```

**Returns:** Standard React Query mutation object with automatic cache invalidation

**Cache Invalidation:**
- Invalidates `["inventory", "items"]` queries
- Refetches inventory lists automatically

### useUpdateItem

**Location:** `useInventoryMutations.ts`

**Description:** Updates an existing inventory item.

**Parameters:**
```typescript
interface UpdateItemParams {
  itemId: string;
  data: Partial<CreateItemData>;
  householdId?: string;
}
```

**Returns:** Standard React Query mutation object

**Cache Updates:**
- Optimistically updates the item in cache
- Rolls back on error
- Invalidates related queries

### useDeleteItem

**Location:** `useInventoryMutations.ts`

**Description:** Deletes an inventory item.

**Parameters:**
```typescript
interface DeleteItemParams {
  itemId: string;
  householdId?: string;
}
```

**Returns:** Standard React Query mutation object

**Cache Updates:**
- Removes item from cache immediately
- Invalidates inventory lists

### useConsumeItem

**Location:** `useInventoryMutations.ts`

**Description:** Marks an item as consumed, updating quantity or removing it.

**Parameters:**
```typescript
interface ConsumeItemParams {
  itemId: string;
  quantity?: number; // Amount to consume, defaults to all
  householdId?: string;
}
```

**Returns:** Standard React Query mutation object

### useWasteItem

**Location:** `useInventoryMutations.ts`

**Description:** Marks an item as wasted for tracking purposes.

**Parameters:**
```typescript
interface WasteItemParams {
  itemId: string;
  quantity?: number;
  reason?: string;
  householdId?: string;
}
```

**Returns:** Standard React Query mutation object

## Common Patterns

### Error Handling

All mutation hooks integrate with the global error handler:

```tsx
const mutation = useCreateItem({
  onError: (error) => {
    // Custom error handling
    console.error("Failed to create item:", error);
  },
  onSuccess: (data) => {
    // Success callback
    toast.success("Item created successfully");
  }
});
```

### Optimistic Updates

Mutations support optimistic updates for better UX:

```tsx
const updateMutation = useUpdateItem({
  onMutate: async (variables) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries(["inventory", "items"]);
    
    // Snapshot previous value
    const previousItems = queryClient.getQueryData(["inventory", "items"]);
    
    // Optimistically update
    queryClient.setQueryData(["inventory", "items"], (old) => {
      // Update logic
    });
    
    return { previousItems };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    if (context?.previousItems) {
      queryClient.setQueryData(["inventory", "items"], context.previousItems);
    }
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(["inventory", "items"]);
  }
});
```

### Mutation States

All mutations provide loading, error, and success states:

```tsx
function ItemForm() {
  const mutation = useCreateItem();
  
  return (
    <div>
      {mutation.isLoading && <Spinner />}
      {mutation.isError && <ErrorMessage error={mutation.error} />}
      {mutation.isSuccess && <SuccessMessage />}
      {/* Form content */}
    </div>
  );
}
```

## Configuration

Default mutation options:
- **retry:** 0 - Mutations don't retry by default
- **onError:** Global error handler shows toast notifications
- **onSuccess:** Automatic cache invalidation

## Notification Mutation Hooks

### useUpdateNotificationSettings

**Location:** `useUpdateNotificationSettings.ts`

**Description:** Updates user notification preferences including email, in-app, and Telegram settings.

**Parameters:**
```typescript
interface UpdateNotificationSettingsPayload {
  email?: {
    enabled: boolean;
  };
  inApp?: {
    enabled: boolean;
  };
  telegram?: {
    enabled: boolean;
  };
  preferences?: {
    expirationWarningDays: number;
    notificationTypes: string[];
    preferredTime: string;
  };
}
```

**Returns:** Standard React Query mutation object with automatic cache invalidation for `['notifications', 'settings']`.

**Usage Example:**
```tsx
import { useUpdateNotificationSettings } from "@/hooks/mutations/useUpdateNotificationSettings";

function NotificationSettings() {
  const updateSettings = useUpdateNotificationSettings();
  
  const handleSave = async (formData) => {
    try {
      await updateSettings.mutateAsync({
        preferences: {
          expirationWarningDays: 5,
          notificationTypes: ['expiration', 'lowStock'],
          preferredTime: '08:00'
        }
      });
      showToast({ type: 'success', title: 'Settings saved' });
    } catch (error) {
      showToast({ type: 'error', title: 'Failed to save settings' });
    }
  };
}
```

### useLinkTelegram

**Location:** `useLinkTelegram.ts`

**Description:** Links a Telegram account to the user's Fridgr account using a verification code.

**Parameters:**
```typescript
interface LinkTelegramPayload {
  verificationCode: string;
}
```

**Returns:**
```typescript
interface LinkTelegramResponse {
  linked: boolean;
  telegramUsername: string;
  linkedAt: string;
}
```

**Features:**
- Updates cached notification settings on success
- Mock support: code "ABC123" triggers success in development mode
- Automatic cache invalidation for notification settings

**Usage Example:**
```tsx
import { useLinkTelegram } from "@/hooks/mutations/useLinkTelegram";

function TelegramLinkModal() {
  const linkTelegram = useLinkTelegram();
  const [code, setCode] = useState('');
  
  const handleLink = async () => {
    try {
      const result = await linkTelegram.mutateAsync({ 
        verificationCode: code 
      });
      showToast({ 
        type: 'success', 
        title: `Linked to ${result.telegramUsername}` 
      });
      closeModal();
    } catch (error) {
      showToast({ 
        type: 'error', 
        title: 'Invalid verification code' 
      });
    }
  };
}
```

## Testing Considerations

When testing components that use mutation hooks:

1. Mock the mutation hook:
```tsx
jest.mock("@/hooks/mutations/useInventoryMutations", () => ({
  useCreateItem: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
  })
}));
```

2. Test loading states:
```tsx
const mockMutation = {
  isLoading: true,
  mutate: jest.fn(),
};
```

3. Test error handling:
```tsx
const mockMutation = {
  isError: true,
  error: new Error("API Error"),
  mutate: jest.fn(),
};
```