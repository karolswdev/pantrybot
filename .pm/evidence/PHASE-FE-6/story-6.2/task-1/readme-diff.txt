diff --git a/frontend/components/README.md b/frontend/components/README.md
index fc18090..cf2cb4b 100644
--- a/frontend/components/README.md
+++ b/frontend/components/README.md
@@ -616,6 +616,87 @@ A reusable component for displaying individual shopping list items with interact
 - **Completed**: Gray background with strikethrough text
 - **Hover**: Subtle background color change for better UX
 
+## Inventory Components (Continued)
+
+### InventoryToolbar Component (`/components/inventory/InventoryToolbar.tsx`)
+
+A comprehensive toolbar component for inventory management with search, filtering, and view controls.
+
+**Props:**
+- `searchQuery: string` - Current search query text
+- `onSearchChange: (value: string) => void` - Callback for search input changes (debounced)
+- `selectedLocation: "all" | "fridge" | "freezer" | "pantry"` - Selected location filter
+- `onLocationChange: (value: "all" | "fridge" | "freezer" | "pantry") => void` - Location filter change handler
+- `selectedStatus: "all" | "expiring-soon" | "expired"` - Selected status filter
+- `onStatusChange: (value: "all" | "expiring-soon" | "expired") => void` - Status filter change handler
+- `selectedCategory: string` - Selected category filter
+- `onCategoryChange: (value: string) => void` - Category filter change handler
+- `categories: string[]` - Available categories for filtering
+- `sortBy: string` - Current sort method
+- `onSortChange: (value: string) => void` - Sort method change handler
+- `viewMode: "grid" | "list"` - Current view mode
+- `onViewModeChange: (value: "grid" | "list") => void` - View mode toggle handler
+- `onAddItem: () => void` - Add item button click handler
+- `itemCount?: number` - Current number of filtered items
+- `currentLocation?: "fridge" | "freezer" | "pantry"` - Current page location context
+
+**Features:**
+- **Search Input** with 300ms debouncing to prevent excessive API calls
+- **Location Filter Tabs** for quick location switching (All, Fridge, Freezer, Pantry)
+- **Status Filters** for expiration state (All, Expiring Soon, Expired)
+- **Category Dropdown** for filtering by item category
+- **Sort Options** (by Expiry, Name, or Category)
+- **View Mode Toggle** between grid and list layouts
+- **Clear Filters Button** to reset all active filters
+- **Active Filter Summary** showing applied filters as removable badges
+- **Mobile-Responsive Design** with collapsible filter panel
+- **Filter Count Badge** on mobile showing number of active filters
+
+**Visual Indicators:**
+- Color-coded status buttons (yellow for warning, red for expired)
+- Active filter badges with individual clear buttons
+- Item count display showing filtered results
+- Visual separation between filter groups
+
+**Debouncing:**
+The search input implements a 300ms debounce delay using the `useDebounce` hook to prevent API calls on every keystroke, improving performance and reducing server load.
+
+**Usage Example:**
+```tsx
+import { InventoryToolbar } from '@/components/inventory/InventoryToolbar';
+
+function InventoryPage() {
+  const [searchQuery, setSearchQuery] = useState("");
+  const [selectedLocation, setSelectedLocation] = useState("all");
+  const [selectedStatus, setSelectedStatus] = useState("all");
+  
+  return (
+    <InventoryToolbar
+      searchQuery={searchQuery}
+      onSearchChange={setSearchQuery}
+      selectedLocation={selectedLocation}
+      onLocationChange={setSelectedLocation}
+      selectedStatus={selectedStatus}
+      onStatusChange={setSelectedStatus}
+      categories={["Dairy", "Produce", "Meat"]}
+      sortBy="expiry"
+      onSortChange={setSortBy}
+      viewMode="grid"
+      onViewModeChange={setViewMode}
+      onAddItem={handleAddItem}
+      itemCount={42}
+      currentLocation="fridge"
+    />
+  );
+}
+```
+
+**Test Identifiers:**
+The component includes data-testid attributes for E2E testing:
+- `inventory-search-input` - Search input field
+- `location-filter-all`, `location-filter-fridge`, etc. - Location filter buttons
+- `status-filter-all`, `status-filter-expiring`, `status-filter-expired` - Status filter buttons
+
 ## Reports & Analytics Components
 
 ### ReportsPage Component (`/app/reports/page.tsx`)
