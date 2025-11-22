# Title Picker

Lightweight Chrome MV3 extension to set custom tab titles. Save titles by selecting page elements or entering text, and enable auto-restore on a per-URL whitelist.

Read this in Chinese: [中文说明](README.zh-CN.md)

## Features
- Select element text as the tab title
- Enter titles via a simple input modal
- Per-URL auto-restore whitelist (explicit opt-in per address)
- Keyboard shortcuts: `Alt+T` (selector), `Alt+Shift+T` (input modal)
- No backend; data stored locally in `chrome.storage.local`

## Structure
```
.
├── manifest.json
└── src/
    ├── background/
    │   └── index.js            // Service Worker (background)
    └── content/
        ├── selector.js         // Pick element, save title
        ├── ui.js               // Input modal UI
        └── restore.js          // Auto-restore based on URL whitelist
```

## Installation
- Open `chrome://extensions`
- Enable Developer Mode
- Click “Load unpacked” and choose the project root

## Permissions
- `scripting`: inject selector and input scripts
- `activeTab`: run scripts on the active tab
- `storage`: persist titles and the per-URL whitelist
- `contextMenus`: toggle “Auto Restore This URL” from the action menu

## Usage
- Save via selector: press `Alt+T`, hover a target element and click to save its text as the tab title
- Save via input: press `Alt+Shift+T` and confirm the title in the modal
- Enable auto-restore for the current URL: click the extension icon and check “Auto Restore This URL”; whitelist is exact `location.href`

## Behavior
- Saving
  - Both selector and input store a mapping from `location.href` to the chosen title in `chrome.storage.local`
- Auto-restore
  - `autoRestoreUrls` keeps the per-URL whitelist (array)
  - Only if the whitelist contains the current `location.href` and a saved title exists will `restore.js` set `document.title`
- Internationalization
  - Menu labels and UI copy adapt to the browser language (English/Chinese)

## Development
- Manifest V3 architecture with a Service Worker background script
- Debug by loading the unpacked extension directly; no build required
- Keyboard shortcuts configured in `manifest.json` under `commands`
- Code locations
  - Background and script injection: `src/background/index.js`
  - Selector logic: `src/content/selector.js`
  - Input modal: `src/content/ui.js`
  - Auto-restore: `src/content/restore.js`

## Privacy
- Data stays in local browser storage; nothing is sent to any server
- Storage keys include `<location.href> -> title` mapping and `autoRestoreUrls` whitelist

## Contributing
Issues and PRs are welcome. Please ensure:
- Code style and file organization remain consistent
- Functionality works on the latest stable Chrome

## License
MIT License
