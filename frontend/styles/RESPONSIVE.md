# Responsive Design Strategy

## Overview
Fridgr uses a mobile-first responsive design approach with Tailwind CSS breakpoints to ensure optimal user experience across all device sizes.

## Breakpoints

We use Tailwind's default breakpoints:
- **`sm`**: 640px and up - Small tablets
- **`md`**: 768px and up - Tablets and small laptops
- **`lg`**: 1024px and up - Laptops and desktops
- **`xl`**: 1280px and up - Large screens
- **`2xl`**: 1536px and up - Extra large screens

## Mobile-First Approach

All styles are designed for mobile by default, then enhanced for larger screens:
- Base styles apply to all screen sizes
- Use `md:` prefix for tablet-specific styles
- Use `lg:` prefix for desktop-specific styles

## Navigation Strategy

### Mobile (< 768px)
- **Bottom Tab Bar**: Fixed bottom navigation with 5 primary actions
  - Home (Dashboard)
  - Inventory
  - Quick Add (prominent center button)
  - Shopping
  - Settings
- **No Sidebar**: Main sidebar is hidden on mobile
- **Content Padding**: Bottom padding added to prevent tab bar overlap

### Tablet/Desktop (≥ 768px)
- **Sidebar Navigation**: Full sidebar with expanded menu items
- **No Bottom Tab Bar**: Hidden via `md:hidden` class
- **Top Header**: Fixed header with household switcher and notifications

## Component Patterns

### Responsive Utilities
```css
/* Hide on mobile, show on tablet+ */
.hidden.md:block

/* Show on mobile, hide on tablet+ */
.block.md:hidden

/* Responsive padding */
.px-4.sm:px-6.lg:px-8

/* Responsive grid columns */
.grid.grid-cols-1.md:grid-cols-2.lg:grid-cols-4
```

### Layout Containers
- Mobile: Full width with small padding (px-4)
- Tablet: Medium padding (sm:px-6)
- Desktop: Larger padding (lg:px-8)

### Content Areas
- Main content has responsive left margin: `md:pl-64` (sidebar width)
- Bottom padding on mobile: `pb-16` (tab bar height)
- No bottom padding on tablet+: `md:pb-0`

## Mobile-Specific Considerations

### Touch Targets
- Minimum 44px height for touch targets
- Tab bar items are 64px tall (h-16)
- Adequate spacing between interactive elements

### Viewport Settings
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
```

### Scrolling
- Content areas are scrollable
- Fixed navigation elements don't scroll
- Smooth scrolling enabled for better UX

## Testing Strategy

### Viewport Testing
Test at these key breakpoints:
1. **Mobile**: 375px (iPhone SE)
2. **Mobile Large**: 414px (iPhone Plus)
3. **Tablet**: 768px (iPad)
4. **Desktop**: 1280px (Standard laptop)
5. **Large Desktop**: 1920px (Full HD)

### Device-Specific Testing
- Use Chrome DevTools device emulation
- Test on actual devices when possible
- Verify touch interactions on mobile
- Check landscape orientation handling

## Performance Optimizations

### Mobile Performance
- Lazy load images below the fold
- Minimize JavaScript execution
- Use CSS transforms for animations
- Optimize font loading

### Responsive Images
- Use Next.js Image component with responsive sizing
- Provide appropriate image sizes for different breakpoints
- Use WebP format when supported

## Accessibility

### Mobile Accessibility
- Ensure sufficient color contrast
- Provide large enough touch targets
- Support screen readers
- Enable keyboard navigation fallbacks

### Responsive Text
- Use relative units (rem, em) for text
- Ensure readable font sizes on all devices
- Adjust line height for optimal readability

## Implementation Examples

### Mobile Tab Bar (MobileTabBar.tsx)
- Only visible on screens < 768px
- Fixed positioning at bottom
- 5-column grid layout
- Special styling for center "Add" button

### App Shell (AppShell.tsx)
- Responsive sidebar: hidden on mobile, visible on tablet+
- Mobile bottom padding for tab bar clearance
- Responsive main content margins

## Future Enhancements

1. **Gesture Support**: Swipe navigation for mobile
2. **Adaptive Loading**: Load different components based on device capabilities
3. **Offline Support**: Enhanced PWA features for mobile
4. **Dark Mode**: Responsive dark mode that respects system preferences