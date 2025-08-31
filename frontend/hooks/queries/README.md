# Query Hooks Documentation

This directory contains React Query hooks for fetching data from the API.

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