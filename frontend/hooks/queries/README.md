# Query Hooks Documentation

This directory contains React Query hooks for fetching data from the API.

## Shopping List Hooks

### useShoppingLists

**Location:** `useShoppingLists.ts`

**Description:** Hook to fetch all shopping lists for a household.

**Parameters:**
- `householdId: string` - The household ID to fetch shopping lists for

**Returns:**
```typescript
{
  data?: {
    lists: ShoppingList[];
    total: number;
  };
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  // ... other React Query properties
}
```

**ShoppingList Interface:**
```typescript
interface ShoppingList {
  id: string;
  name: string;
  itemCount: number;
  completedCount: number;
  createdAt: string;
  createdBy: string;
  lastUpdated: string;
}
```

**Usage Example:**
```tsx
import { useShoppingLists } from "@/hooks/queries/useShoppingLists";

function ShoppingListsPage() {
  const { data, isLoading, error } = useShoppingLists(householdId);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading lists</div>;
  
  return (
    <div>
      {data?.lists.map(list => (
        <ShoppingListCard key={list.id} list={list} />
      ))}
    </div>
  );
}
```

**Features:**
- Automatic fallback to mock data when API is unavailable
- 5-minute stale time for caching
- Disabled retry on failure
- Query key: `['shopping-lists', householdId]`

## Inventory Hooks

### useInventoryItems

**Location:** `useInventoryItems.ts`

**Description:** Hook to fetch inventory items from the API with support for filtering, searching, and sorting.

**Parameters:**
```typescript
interface UseInventoryItemsParams {
  householdId?: string;      // Defaults to user's default household
  location?: "fridge" | "freezer" | "pantry" | "all";
  category?: string;          // Filter by category
  search?: string;            // Search query
  sortBy?: "expiry" | "name" | "category" | "created";
  sortOrder?: "asc" | "desc";
}
```

**Returns:**
```typescript
{
  data?: {
    items: InventoryItemResponse[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  refetch: () => void;
  // ... other React Query properties
}
```

**Usage Example:**
```tsx
import { useInventoryItems } from "@/hooks/queries/useInventoryItems";

function FridgeInventory() {
  const { data, isLoading, error } = useInventoryItems({
    location: "fridge",
    sortBy: "expiry",
    sortOrder: "asc"
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
```

### useInventoryItem

**Location:** `useInventoryItems.ts`

**Description:** Hook to fetch a single inventory item by ID.

**Parameters:**
- `householdId: string | undefined` - The household ID
- `itemId: string | undefined` - The item ID

**Returns:**
```typescript
{
  data?: InventoryItemResponse;
  isLoading: boolean;
  isError: boolean;
  error?: Error;
  // ... other React Query properties
}
```

**Usage Example:**
```tsx
import { useInventoryItem } from "@/hooks/queries/useInventoryItems";

function ItemDetails({ householdId, itemId }) {
  const { data: item, isLoading } = useInventoryItem(householdId, itemId);

  if (isLoading) return <LoadingSkeleton />;
  if (!item) return <NotFound />;

  return <ItemDetailView item={item} />;
}
```

## Household Hooks

### useHouseholdData

**Location:** `useHouseholdData.ts`

**Description:** Fetches comprehensive household data including members and statistics for the dashboard.

**Parameters:**
- `householdId?: string` - Optional household ID (defaults to active household from auth store)

**Returns:**
```typescript
{
  data?: {
    id: string;
    name: string;
    description?: string;
    timezone: string;
    members: HouseholdMember[];
    statistics: {
      totalItems: number;
      expiringItems: number;
      expiredItems: number;
      consumedThisMonth: number;
      wastedThisMonth: number;
    };
    createdAt: string;
  };
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}
```

**Usage Example:**
```tsx
import { useHouseholdData } from "@/hooks/queries/useHouseholdData";

function Dashboard() {
  const { data: householdData, isLoading } = useHouseholdData();
  
  if (isLoading) return <DashboardSkeleton />;
  
  return (
    <div>
      <h1>Welcome to {householdData?.name}</h1>
      <p>Total Items: {householdData?.statistics.totalItems}</p>
      <p>Expiring Soon: {householdData?.statistics.expiringItems}</p>
    </div>
  );
}
```

### useExpiringItems

**Location:** `useHouseholdData.ts`

**Description:** Fetches items that are expiring soon, sorted by expiration date.

**Parameters:**
- `householdId?: string` - Optional household ID (defaults to active household)
- `limit?: number` - Maximum number of items to fetch (default: 5)

**Returns:**
```typescript
{
  data?: ExpiringItem[];  // Array of items with expiration details
  isLoading: boolean;
  isError: boolean;
  error?: Error;
}
```

**Usage Example:**
```tsx
import { useExpiringItems, formatExpirationText } from "@/hooks/queries/useHouseholdData";

function ExpiringItemsList() {
  const { data: items, isLoading } = useExpiringItems(undefined, 10);
  
  return (
    <div>
      {items?.map(item => (
        <div key={item.id}>
          <span>{item.name}</span>
          <span>{formatExpirationText(item.daysUntilExpiration)}</span>
        </div>
      ))}
    </div>
  );
}
```

### Helper Functions

**formatExpirationText(daysUntilExpiration: number): string**
- Converts days until expiration into human-readable text
- Examples: "Expires today", "Tomorrow", "In 5 days", "Expired 2 days ago"

**formatActivityTime(timestamp: string): string**
- Formats timestamps into relative time strings
- Examples: "Just now", "15m ago", "3h ago", "Yesterday"

## Configuration

All query hooks use the following default configuration:
- **staleTime:** 30 seconds - Data is considered fresh for 30 seconds
- **gcTime:** 5 minutes - Data stays in cache for 5 minutes after becoming inactive
- **refetchOnWindowFocus:** true - Refetch when window regains focus
- **refetchOnMount:** true - Refetch when component mounts

## Error Handling

All hooks integrate with the API client's error handling, which includes:
- Automatic token refresh on 401 errors
- Retry logic for failed requests
- Structured error messages

## Query Keys

Query keys follow a consistent pattern for cache management:
- Inventory items: `["inventory", "items", householdId, params]`
- Single item: `["inventory", "items", householdId, itemId]`

This allows for precise cache invalidation when mutations occur.

## Real-time Integration

The inventory query hooks integrate seamlessly with SignalR for real-time updates. When WebSocket events are received, the query cache is updated intelligently without triggering a full refetch.

### How Real-time Updates Work

1. **Item Updated Event (`item.updated`)**: 
   - The query cache is updated using `queryClient.setQueryData()`
   - Only the modified item is updated in the cache
   - UI updates instantly without a network request

2. **Item Added Event (`item.added`)**:
   - The query is invalidated to fetch the new item
   - Ensures proper sorting and filtering of the new item

3. **Item Deleted Event (`item.deleted`)**:
   - The item is removed from the cache immediately
   - Total count is decremented accordingly

### Implementation Example

```tsx
import { signalRService } from "@/lib/realtime/signalr-service";
import { useQueryClient } from "@tanstack/react-query";

// In your inventory component
useEffect(() => {
  const handleItemUpdate = (data: any) => {
    // Update the specific item in the cache
    queryClient.setQueryData(
      ["inventory", "items", householdId, queryParams],
      (oldData: any) => {
        if (!oldData) return oldData;
        
        const updatedItems = oldData.items.map((item: InventoryItem) => 
          item.id === data.payload.itemId 
            ? { ...item, ...data.payload.item } 
            : item
        );
        
        return { ...oldData, items: updatedItems };
      }
    );
  };

  signalRService.on('item.updated', handleItemUpdate);
  
  return () => {
    signalRService.off('item.updated', handleItemUpdate);
  };
}, [householdId, queryClient, queryParams]);
```

### Benefits

- **Instant Updates**: Changes appear immediately without manual refresh
- **Bandwidth Efficient**: Only the changed data is transmitted
- **Cache Consistency**: React Query cache stays in sync with server state
- **Optimistic Updates**: Combined with mutations for immediate feedback