# Bit Tracker Extension

A Chrome browser extension for tracking information, featuring a user interface (popup) and a background service worker.

## Project Structure

```
bit-tracker/
├── manifest.json           # Main extension configuration file
├── assets/
│   └── logo.png            # Graphics and icon assets
├── popup/
│   ├── popup.html          # HTML structure for the user interface
│   ├── popup.css           # Styles for the interface
│   ├── popup.js            # Main logic for the interface
│   └── components/         # Web Components for different views
│       ├── artists-view.js
│       └── events-view.js
├── background/
│   └── service-worker.js   # Background logic
├── mocks/
│   └── artist-mock.html    # Test data and mocks
└── package.json            # Project dependencies and scripts
```

## Technologies

- **Frontend (Popup)**: HTML, CSS, Vanilla JavaScript with Web Components.
- **Backend (Service Worker)**: Vanilla JavaScript and `node-html-parser` for data processing.
- **Dependency Management**: npm.

## Installation

1.  **Install project dependencies** using npm:
    ```bash
    npm install
    ```

2.  **Load the extension** in Google Chrome:
    -   Navigate to `chrome://extensions/`.
    -   Enable "Developer mode".
    -   Click "Load unpacked".
    -   Select the entire `bit-tracker` project folder.

## Features

- **User Interface (Popup)**: Allows interaction with the main features of the extension. Built with components to display different views, such as artists (`artists-view`) and events (`events-view`).
- **Service Worker**: A background script that handles business logic, even when the popup is closed.
- **Data Storage**: Application state and user data are saved using the `chrome.storage` API.
- **Communication**: The popup communicates with the service worker to exchange data and delegate tasks.

## Privacy

For information about how this extension handles user data, please see our [Privacy Policy](privacy-policy.md).

## Notes

- The extension is compliant with the **Manifest V3** specification.
- Using `node-html-parser` in the service worker may require special attention to Content Security Policy (CSP) handling.