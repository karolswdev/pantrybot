diff --git a/frontend/components/README.md b/frontend/components/README.md
index 06c161f..fc18090 100644
--- a/frontend/components/README.md
+++ b/frontend/components/README.md
@@ -614,4 +614,40 @@ A reusable component for displaying individual shopping list items with interact
 **Visual States:**
 - **Pending**: White background with hover effect
 - **Completed**: Gray background with strikethrough text
-- **Hover**: Subtle background color change for better UX
\ No newline at end of file
+- **Hover**: Subtle background color change for better UX
+
+## Reports & Analytics Components
+
+### ReportsPage Component (`/app/reports/page.tsx`)
+
+The main reports and analytics page that displays household consumption insights and waste tracking.
+
+**Features:**
+- Food waste tracking with monthly summary and trends
+- Weekly waste data visualization with bar charts
+- Top categories breakdown showing waste distribution
+- Expiry patterns analysis by day of week
+- Date range selector (7, 30, 90 days)
+- Inventory value display
+- Export report functionality (placeholder)
+
+**Chart Components:**
+- **Waste Tracking Chart**: Bar chart showing weekly waste values
+- **Categories Chart**: Horizontal progress bars showing category percentages
+- **Expiry Patterns Chart**: Horizontal bars showing expiry distribution by weekday
+
+**Data Display:**
+- Monthly waste value with percentage change from previous month
+- Visual indicators for positive/negative trends
+- Color-coded bars for data visualization
+- Responsive grid layout for multiple charts
+
+**Test IDs:**
+- `waste-tracking-card` - Main waste tracking section
+- `waste-statistics` - Waste value and trend display
+- `categories-card` - Top categories section
+- `expiry-patterns-card` - Expiry patterns section
+- `week-{n}-bar` - Individual week bars in waste chart
+
+**Usage:**
+The ReportsPage is automatically rendered at the `/reports` route. It currently uses placeholder data but is prepared for integration with the reporting API endpoint once available.
\ No newline at end of file
