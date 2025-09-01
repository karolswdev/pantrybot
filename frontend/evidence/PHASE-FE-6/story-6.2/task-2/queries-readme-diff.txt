diff --git a/frontend/hooks/queries/README.md b/frontend/hooks/queries/README.md
index 55c06cf..cfa70a0 100644
--- a/frontend/hooks/queries/README.md
+++ b/frontend/hooks/queries/README.md
@@ -81,6 +81,7 @@ interface UseInventoryItemsParams {
   location?: "fridge" | "freezer" | "pantry" | "all";
   category?: string;          // Filter by category
   search?: string;            // Search query
+  status?: "expiring-soon" | "expired";  // Filter by expiration status
   sortBy?: "expiry" | "name" | "category" | "created";
   sortOrder?: "asc" | "desc";
 }
@@ -111,7 +112,9 @@ function FridgeInventory() {
   const { data, isLoading, error } = useInventoryItems({
     location: "fridge",
     sortBy: "expiry",
-    sortOrder: "asc"
+    sortOrder: "asc",
+    status: "expiring-soon",  // Only show items expiring soon
+    search: "milk"            // Search for milk items
   });
 
   if (isLoading) return <LoadingSkeleton />;
@@ -127,6 +130,17 @@ function FridgeInventory() {
 }
 ```
 
+**Filter Parameters:**
+- **location**: Filter items by storage location (fridge, freezer, pantry, or all)
+- **category**: Filter by item category (e.g., "Dairy", "Produce")
+- **search**: Search items by name (uses query parameter with debouncing in UI)
+- **status**: Filter by expiration status:
+  - `expiring-soon`: Items expiring within 3 days
+  - `expired`: Items past their expiration date
+  - Note: Status filtering may be performed client-side if not supported by the API
+- **sortBy**: Sort results by expiry date, name, category, or creation date
+- **sortOrder**: Sort in ascending or descending order
+
 ### useInventoryItem
 
 **Location:** `useInventoryItems.ts`
