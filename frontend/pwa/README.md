# Progressive Web App (PWA) Configuration

## Overview
Fridgr is configured as a Progressive Web App to provide an app-like experience on mobile devices with offline capabilities and installability.

## PWA Strategy

### Core Features
1. **Installability**: Users can install Fridgr to their home screen
2. **Offline Support**: Basic app shell and static assets are cached for offline access
3. **App-like Experience**: Standalone display mode without browser chrome
4. **Push Notifications**: Ready for future push notification support
5. **Background Sync**: Prepared for offline data sync when connection returns

## Technical Implementation

### Service Worker Configuration
The service worker is configured using `next-pwa` with the following settings:

```typescript
// next.config.ts
const withPWA = require("next-pwa")({
  dest: "public",              // Output directory for SW files
  register: true,              // Auto-register service worker
  skipWaiting: true,          // Skip waiting for old SW
  disable: process.env.NODE_ENV === "development", // Disabled in dev
  runtimeCaching: [...]       // Caching strategies
});
```

### Caching Strategies

#### Static Assets (CacheFirst)
- **Fonts**: Google Fonts cached for 365 days
- **JS/CSS**: Next.js static assets cached for 24 hours
- Maximum performance for static resources

#### Dynamic Content (StaleWhileRevalidate)
- **Images**: Cached for 24 hours, updates in background
- **Font Files**: Local fonts cached for 7 days
- Balance between performance and freshness

#### API Calls (NetworkFirst)
- **GET Requests**: Try network first, fall back to cache
- **Timeout**: 10 seconds before cache fallback
- Ensures fresh data when online

#### Other Resources (NetworkFirst)
- Default strategy for uncategorized resources
- 24-hour cache with network priority

## Web App Manifest

### Configuration (`/public/manifest.json`)
```json
{
  "name": "Fridgr - Food Inventory Management",
  "short_name": "Fridgr",
  "description": "Keep your food fresh, waste less",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#22c55e",
  "background_color": "#ffffff"
}
```

### Display Modes
- **standalone**: App runs in its own window without browser UI
- **portrait-primary**: Optimized for portrait orientation on mobile

### Icons
Multiple icon sizes provided for different contexts:
- 72x72, 96x96, 128x128: Small device icons
- 144x144, 152x152: Medium device icons
- 192x192: Standard PWA requirement
- 384x384, 512x512: Large device icons and splash screens

All icons use `"purpose": "maskable any"` for adaptive icon support.

## What Is Cached

### App Shell (Always Cached)
- HTML structure
- Core CSS files
- Essential JavaScript
- Navigation components
- Layout elements

### Static Assets (Cached on First Visit)
- Images and icons
- Fonts
- Static pages
- Component bundles

### Dynamic Data (Cached Strategically)
- API responses (GET requests only)
- User preferences
- Recent activity
- Inventory lists

## Expected Offline Behavior

### Full Offline Support
- App shell loads instantly
- Navigation between cached pages works
- Previously viewed data is available
- Forms can be filled (queued for sync)

### Partial Offline Support
- New data fetching shows offline message
- Real-time updates are paused
- Background sync queues actions

### Online-Only Features
- Real-time notifications
- Live inventory updates
- Shopping list collaboration
- Data synchronization

## Installation Instructions

### Mobile Installation

#### iOS (Safari)
1. Open Fridgr in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Name the app and tap "Add"

#### Android (Chrome)
1. Open Fridgr in Chrome
2. Tap the menu (three dots)
3. Select "Add to Home screen"
4. Confirm installation

### Desktop Installation

#### Chrome/Edge
1. Look for install icon in address bar
2. Click "Install Fridgr"
3. App opens in standalone window

## Development & Testing

### Local Development
- Service worker is disabled in development mode
- Use production build to test PWA features:
  ```bash
  npm run build
  npm start
  ```

### Testing PWA Features
1. **Service Worker Registration**
   ```javascript
   navigator.serviceWorker.ready.then(registration => {
     console.log('SW registered:', registration);
   });
   ```

2. **Cache Inspection**
   - Chrome DevTools > Application > Cache Storage
   - View cached resources and strategies

3. **Offline Testing**
   - Chrome DevTools > Network > Offline
   - Verify app shell loads and navigation works

### Lighthouse Audit
Run PWA audit for compliance:
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Select "Progressive Web App" category
4. Run audit

Target scores:
- Performance: >90
- PWA: 100
- Accessibility: >90
- Best Practices: >90

## Performance Optimizations

### Initial Load
- Service worker pre-caches critical resources
- App shell pattern for instant loading
- Lazy loading for non-critical components

### Runtime Performance
- Background sync for data updates
- Optimistic UI updates
- Request coalescing for API calls

### Cache Management
- Automatic cache expiration
- Size limits per cache
- LRU eviction for old entries

## Future Enhancements

### Planned Features
1. **Push Notifications**
   - Expiry alerts
   - Shopping reminders
   - Household activity

2. **Background Sync**
   - Offline data entry
   - Automatic sync on reconnection
   - Conflict resolution

3. **Advanced Caching**
   - Predictive prefetching
   - User-specific cache strategies
   - Image optimization

4. **Native Features**
   - Camera access for barcode scanning
   - Share API for list sharing
   - File API for receipts

## Troubleshooting

### Common Issues

#### Service Worker Not Registering
- Ensure HTTPS in production
- Check browser compatibility
- Clear browser cache and data

#### App Not Installing
- Verify manifest.json is served
- Check icon files exist
- Ensure start_url is valid

#### Cache Issues
- Clear service worker cache
- Update service worker version
- Check cache storage quota

### Debug Commands
```javascript
// Check SW registration
navigator.serviceWorker.getRegistrations()

// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
})

// Force update SW
navigator.serviceWorker.getRegistration().then(reg => {
  reg.update()
})
```

## Browser Support

### Full Support
- Chrome 68+
- Edge 79+
- Firefox 57+
- Safari 11.3+ (iOS)
- Samsung Internet 8.2+

### Partial Support
- Older Safari versions (limited features)
- Opera Mini (no service worker)

### Required Features
- Service Worker API
- Cache API
- Fetch API
- Web App Manifest