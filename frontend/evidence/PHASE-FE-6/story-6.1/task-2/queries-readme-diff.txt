diff --git a/frontend/hooks/queries/README.md b/frontend/hooks/queries/README.md
index 5d80840..55c06cf 100644
--- a/frontend/hooks/queries/README.md
+++ b/frontend/hooks/queries/README.md
@@ -347,4 +347,91 @@ useEffect(() => {
 - **Instant Updates**: Changes appear immediately without manual refresh
 - **Bandwidth Efficient**: Only the changed data is transmitted
 - **Cache Consistency**: React Query cache stays in sync with server state
-- **Optimistic Updates**: Combined with mutations for immediate feedback
\ No newline at end of file
+- **Optimistic Updates**: Combined with mutations for immediate feedback
+
+## Reports & Analytics Hooks
+
+### useReportsData
+
+**Location:** `useReportsData.ts`
+
+**Description:** Fetches comprehensive reporting and analytics data for household waste tracking and consumption patterns.
+
+**Parameters:**
+- `dateRange?: number` - Number of days to include in the report (default: 30). Options: 7, 30, 90
+
+**Returns:**
+```typescript
+{
+  data?: {
+    wasteTracking: {
+      currentMonth: number;        // Dollar amount wasted this month
+      previousMonth: number;        // Dollar amount wasted last month
+      percentageChange: number;     // % change from previous month
+      weeklyData: Array<{
+        week: string;
+        value: number;
+      }>;
+    };
+    categoryBreakdown: Array<{
+      category: string;             // Food category (Produce, Dairy, etc.)
+      percentage: number;           // Percentage of total waste
+      value: number;                // Dollar value wasted
+    }>;
+    expiryPatterns: Array<{
+      dayOfWeek: string;           // Day of week (Mon, Tue, etc.)
+      count: number;                // Number of items expired on this day
+    }>;
+    inventoryValue: number;         // Total value of current inventory
+    totalItemsWasted: number;       // Count of wasted items
+    totalItemsConsumed: number;     // Count of consumed items
+    savingsFromConsumed: number;    // Dollar value saved by consuming
+  };
+  isLoading: boolean;
+  isError: boolean;
+  error?: Error;
+}
+```
+
+**Usage Example:**
+```tsx
+import { useReportsData } from "@/hooks/queries/useReportsData";
+
+function ReportsPage() {
+  const [dateRange, setDateRange] = useState(30);
+  const { data: reportsData, isLoading, error } = useReportsData(dateRange);
+  
+  if (isLoading) return <LoadingSpinner />;
+  if (error) return <ErrorMessage />;
+  
+  return (
+    <div>
+      <h2>Waste Tracking</h2>
+      <p>${reportsData?.wasteTracking.currentMonth} wasted this month</p>
+      <p>{reportsData?.wasteTracking.percentageChange}% change from last month</p>
+      
+      <h3>Category Breakdown</h3>
+      {reportsData?.categoryBreakdown.map(cat => (
+        <div key={cat.category}>
+          {cat.category}: {cat.percentage}% (${cat.value})
+        </div>
+      ))}
+    </div>
+  );
+}
+```
+
+**Features:**
+- Automatic fallback to mock data when API is unavailable
+- Supports date range filtering (7, 30, 90 days)
+- 5-minute stale time for caching
+- Query key: `['reports', householdId, dateRange]`
+
+**API Integration:**
+Currently uses the household statistics endpoint as a fallback pattern:
+- `GET /households/{householdId}/statistics?days={dateRange}`
+
+When the dedicated reports endpoint becomes available, the hook will seamlessly transition to use it.
+
+**Mock Data:**
+The hook includes comprehensive mock data for development and testing purposes, ensuring the UI can be fully developed even before the backend reports API is available.
\ No newline at end of file
