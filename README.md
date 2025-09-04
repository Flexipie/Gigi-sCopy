# Gigi's Copy Tool (Chrome MV3)

A minimal, robust multi-clipboard extension to save multiple text selections from any webpage and manage them in an in-page overlay. Zero external dependencies.

## Features

- Save selected text via:
  - Cmd/Ctrl+Shift+S (keyboard command), or
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
  - Settings: Theme (Auto/Light/Dark) + Reduce Motion toggle
- Works inside iframes

## Install (Developer Mode)

1. Open Chrome → go to `chrome://extensions`
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked" and select this folder:
   - `/Users/flexipie/Desktop/Code/Projects/HighlightForGigi`

## Usage

- Select text on any page and press Cmd+Shift+U (Mac) or Ctrl+Shift+S (Win/Linux), or right-click the selection and choose "Save selection to Gigi's Copy Tool".
- Toggle the overlay with Cmd+Shift+O (Mac) or Ctrl+Shift+Space (Win/Linux), or click the extension toolbar icon (action button).
- In the overlay:
  - "Copy" to copy a single clip
  - "Delete" to remove a single clip
  - "Copy all" to copy all clips as a bulleted list
  - "Clear" to remove all clips (with confirmation)

## Notes

- Shortcuts can be adjusted at `chrome://extensions/shortcuts`.
- Not available on restricted pages (e.g., `chrome://*`, Chrome Web Store). For `file://` pages, enable "Allow access to file URLs" for this extension in `chrome://extensions`.
- Clipboard operations use the extension page context.

## Development

- Manifest: `manifest.json`
- Background service worker: `background.js`
- In-page overlay UI: `overlay/overlay.js`

No build step required. Reload the extension after changes.
