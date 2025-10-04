# Gigi's Copy Tool (Chrome MV3)

A minimal, robust multi-clipboard extension to save multiple text selections from any webpage and manage them in an in-page overlay. Zero external dependencies.

## Features

- Save selected text via:
  - Cmd/Ctrl+Shift+U (keyboard command), or
  - Right-click → "Save selection to Gigi's Copy Tool"
- Visual feedback:
  - Brief toast ("Saved")
  - Non-destructive flash highlight (rect overlays; no DOM mutation)
- In-page overlay (Cmd/Ctrl+Shift+Space or toolbar icon):
  - List of saved clips (latest first)
  - Search/filter input (live filtering)
  - Pin/star clips to keep them at the top
  - Folder collections (create/select/delete); new saves go to the active folder
  - Per-clip Copy/Delete; Copy all (with formatting presets)
  - Inline edit a clip
  - Undo delete via toast
  - Keyboard navigation (↑/↓ select, Enter copy, Del delete, A copy-all)
  - Tag chips per clip
  - Tag filter dropdown in the toolbar
  - Settings: Theme (Auto/Light/Dark), Reduce Motion, and Tag Rules editor (add/remove rules)
- Centralized storage helpers (`storage.js`) wrap `chrome.storage.local` for clips, folders, tag rules, overlay preferences, and layout state.
- Works inside iframes

- Smart Deduplication on save
  - Saves identical or whitespace/case-only variations as a single clip, incrementing a small ×N indicator.
  - Keeps storage tidy; existing clip’s `dupCount` increases and `updatedAt` is set.

- Auto-Tag Rules + Retroactive updates
  - Rule types: URL contains <substring>, Text matches regex.
  - Tags are applied on save and recomputed for all existing clips whenever rules change (add/remove).

## Install (Developer Mode)

1. Open Chrome → go to `chrome://extensions`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked" and select this folder:
   - `/Users/flexipie/Desktop/Code/Projects/Gigi'sCopyTools/ChromeExtension`

## Usage

- Select text on any page and press Cmd+Shift+U (Mac) or Ctrl+Shift+S (Win/Linux), or right-click the selection and choose "Save selection to Gigi's Copy Tool".
- Toggle the overlay with Cmd+Shift+O (Mac) or Ctrl+Shift+Space (Win/Linux), or click the extension toolbar icon (action button).
- In the overlay:
  - "Copy" to copy a single clip
  - "Delete" to remove a single clip
  - "Copy all" to copy all clips as a bulleted list
  - "Clear" to remove all clips (with confirmation)
  - Use the Tag filter dropdown to show only clips with a specific tag
  - Open Settings (gear) → Tag Rules to add/remove rules
    - Example: URL contains `stackoverflow.com` → tag `StackOverflow`
    - Example: Text matches regex `\bTODO\b` → tag `Notes`
  - Tags apply retroactively: editing rules updates existing clips automatically
  - A small ×N on a clip indicates duplicate saves (dedup)

## Notes

- Shortcuts can be adjusted at `chrome://extensions/shortcuts`.
- Not available on restricted pages (e.g., `chrome://*`, Chrome Web Store). For `file://` pages, enable "Allow access to file URLs" for this extension in `chrome://extensions`.
- Clipboard operations use the extension page context.

### Known limitations

- Some complex web editors (e.g., Google Docs) render selections on a virtual surface; the standard Selection API may return empty text. Workarounds:
  - Use the document’s "Publish to the web" (view-only HTML) and capture from the published page
  - Download as HTML and open locally (enable "Allow access to file URLs")
  - Optional: use the macOS helper to capture via the OS clipboard

## Desktop Bridge (Native Messaging)

- This extension can import clips captured by the macOS helper (GigiCopyHelper) via Chrome Native Messaging.
- Ensure your extension has the `nativeMessaging` and `alarms` permissions (already present in `manifest.json`).
- Install the native host manifest using the helper repo script and your extension ID. See:
  - GigiCopyHelper/README.md → "Install the Chrome Native Messaging Host Manifest"
- The background service worker connects to `com.gigi.copytool` periodically and merges incoming `{type: 'clip'}` messages into `chrome.storage.local`, routing to the current folder.

## Shortcuts in Chrome

- Chrome may not auto-assign suggested shortcuts for unpacked extensions.
- Set them manually at `chrome://extensions/shortcuts`:
  - Save selection: Command+Shift+U (macOS)
  - Toggle overlay: Command+Shift+O (macOS)

## Development

- Manifest: `manifest.json`
- Background service worker: `background.js`
- In-page overlay UI: `overlay/overlay.js`
- Storage helpers: `storage.js`

No build step required. Reload the extension after changes.

### Architecture notes

- **Persistence layer**: `storage.js` exports async helpers (`getClips()`, `setClips()`, `getFolders()`, `getOverlaySettings()`, etc.) used by both the background service worker and overlay UI. This keeps all reads/writes consistent and simplifies future migrations.
- **Overlay importing**: `overlay/overlay.js` dynamically imports the storage helpers via `chrome.runtime.getURL('storage.js')`, so `storage.js` is listed under `web_accessible_resources` in `manifest.json`.
- **Feature separation**:
  - `background.js` handles capture, deduplication, tagging, native messaging.
  - `overlay/overlay.js` focuses on rendering and user interaction by calling storage helpers.

### Manual testing checklist

- **Reload**: `chrome://extensions` → Reload the unpacked extension.
- **Toggle overlay**: Cmd+Shift+O / Ctrl+Shift+Space (or toolbar icon) to ensure the UI loads.
- **Save clip**: Select text and press Cmd+Shift+U / Ctrl+Shift+S. Confirm toast, flash, and new clip entry.
- **CRUD flows**: Pin, edit, delete, undo delete, and clear clips—verify persistence after reload.
- **Folders/tags**: Add a folder, save to it, delete the folder (clips should fall back to “All”). Adjust tag rules and confirm tags update.
- **Layout prefs**: Drag or resize the overlay, toggle theme/reduce-motion, then reopen the overlay to confirm the stored preferences stick.
