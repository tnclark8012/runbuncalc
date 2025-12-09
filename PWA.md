# PWA Implementation

This document describes the Progressive Web App (PWA) implementation for the Pokémon Damage Calculator.

## Overview

The PWA implementation enables the calculator to be used offline by caching essential assets and providing a native app-like experience when installed.

## Components

### 1. Web App Manifest (`src/manifest.json`)

The manifest file defines how the app appears when installed:
- **name**: "Pokémon Damage Calculator" - Full name shown in app lists
- **short_name**: "Damage Calc" - Used when space is limited
- **display**: "standalone" - App runs without browser UI
- **theme_color** and **background_color**: "#1a1a2e" - Matches the dark theme

### 2. Service Worker (`src/sw.js`)

The service worker handles:
- **Caching**: Pre-caches all essential assets on install
- **Offline support**: Serves cached content when offline
- **Cache-first strategy**: Returns cached responses first, then fetches updates
- **Cache versioning**: Uses `CACHE_NAME` version to manage cache updates

### 3. PWA Meta Tags (in `index.template.html`)

Added to the `<head>`:
- `<meta name="viewport">` - Responsive viewport
- `<meta name="theme-color">` - Browser theme color
- `<meta name="description">` - App description for SEO/install
- `<link rel="manifest">` - Points to manifest.json
- `<link rel="apple-touch-icon">` - iOS home screen icon

### 4. Service Worker Registration

Added at the end of `<body>`:
```javascript
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
}
```

## Special Considerations

### Cache Size
The service worker caches a significant number of files including:
- HTML, CSS, and JavaScript files
- Generation-specific data files (gen1.js through gen9.js)
- Vendor libraries (jQuery, select2, etc.)
- Calculator core files

**Note**: The total cache size can be several megabytes due to the large amount of Pokémon data.

### External Resources
External resources (like sprite images from pokesprite) are **not cached** and require an internet connection. The calculator functionality works offline, but some visual elements may not load.

### Cache Updates
When updating the PWA:
1. Increment the version in `CACHE_NAME` (e.g., 'pokemon-calc-v2')
2. The new service worker will install and cache new assets
3. The old cache will be deleted on activation

### Browser Compatibility
PWA features are supported in:
- Chrome/Chromium (full support)
- Firefox (limited, no install prompt)
- Safari/iOS (requires adding to home screen manually)
- Edge (full support)

### Local Development
The service worker requires HTTPS in production. For local development:
- Use `localhost` (service workers work on localhost)
- Or use a local HTTPS setup

## Installation

Users can install the PWA by:
1. Visiting the page in a supported browser
2. Looking for the "Install" or "Add to Home Screen" option
3. The app will then be available offline

## Testing Offline Mode

1. Open the calculator in a browser
2. Wait for the service worker to install (check console for "ServiceWorker registration successful")
3. Open DevTools > Application > Service Workers
4. Check "Offline" mode
5. Reload the page - it should still work

## Future Improvements

- Add PNG fallback icons for better iOS/older browser support
- Implement background sync for potential future features
- Add update notifications when new versions are available
