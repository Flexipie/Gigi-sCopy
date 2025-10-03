# AGENTS.md - Gigi's Copy Tool Chrome Extension

## Build/Test Commands
- **No build step required** - Pure JavaScript Chrome extension
- **Test**: Manual testing in Chrome Extensions page (`chrome://extensions`)
- **Reload**: Click "Reload" button in Chrome Extensions page after changes
- **Debug**: Use Chrome DevTools → Sources → Extension service worker

## Code Style Guidelines

### Architecture
- **Manifest V3** Chrome extension with service worker background script
- **Zero external dependencies** - vanilla JavaScript only
- **Storage**: `chrome.storage.local` for clips, folders, and settings
- **Content injection**: Uses `chrome.scripting.executeScript` with `world: 'MAIN'` and `world: 'ISOLATED'`

### File Structure
- `manifest.json` - Extension configuration and permissions
- `background.js` - Service worker for commands, context menus, native messaging
- `overlay/overlay.js` - Injected overlay UI (shadow DOM)
- `icons/` - Extension icons (16, 24, 32, 48, 128px PNG)

### JavaScript Conventions
- **ES modules** (`"type": "module"` in manifest)
- **Async/await** preferred over callbacks
- **Error handling**: Try-catch blocks with silent failure for non-critical operations
- **Naming**: camelCase for variables/functions, UPPER_CASE for constants
- **Storage keys**: camelCase (e.g., `activeFolderId`, `overlayTheme`)

### UI/UX Patterns
- **Dark/light theme** support with `prefers-color-scheme` and manual override
- **Keyboard shortcuts**: Arrow keys for navigation, Enter to copy, Delete to remove, A for copy-all
- **Visual feedback**: Toast notifications, selection highlights, hover effects
- **Accessibility**: Focus management, reduced motion support, semantic HTML

### Chrome Extension Specifics
- **Permissions**: `storage`, `contextMenus`, `scripting`, `clipboardWrite`, `alarms`, `activeTab`, `nativeMessaging`
- **Host permissions**: `<all_urls>` for content injection
- **Commands**: `save-selection` (Ctrl+Shift+S), `toggle-popup` (Ctrl+Shift+Space)
- **Context menu**: Right-click "Save selection to Gigi's Copy Tool"

### Error Handling
- Silent failure for non-critical operations (e.g., native messaging disconnect)
- User-facing error messages via toast notifications
- Console logging for debugging with `console.warn`/`console.error`