# DevFlow - A Productivity Chrome Extension for Front-End Developers

DevFlow is a powerful Chrome extension designed to enhance the productivity of front-end developers. It provides essential tools for managing code snippets, tracking tasks, saving resources, and maintaining focus during development sessions.

## Features

### 1. Code Snippets Manager
- Save and organize frequently used code snippets
- Categorize snippets by language (React, TypeScript, HTML, CSS)
- Search snippets using keywords or tags
- Copy snippets to clipboard with one click

### 2. Task Tracker
- Kanban-style board with "To-Do," "In Progress," and "Completed" columns
- Add tasks with title, description, priority, and deadline
- Drag-and-drop functionality for easy task management
- Track task progress and deadlines

### 3. Resource Hub
- Save and organize useful development resources
- Add titles, descriptions, and URLs
- Mark resources as favorites for quick access
- Search and filter saved resources

### 4. Focus Mode
- Pomodoro timer with customizable intervals
- Website blocker to prevent distractions
- Customizable work/break durations
- Desktop notifications for timer events

## Installation

### For Users
1. Download the latest release from the Chrome Web Store (coming soon)
2. Click "Add to Chrome" to install the extension
3. Click the DevFlow icon in your browser's toolbar to start using the extension

### For Developers
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/devflow.git
   cd devflow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build the extension:
   ```bash
   npm run build:extension
   ```

5. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory from the project

## Development

### Project Structure
```
devflow/
├── public/
│   ├── icons/
│   ├── manifest.json
│   ├── blocked.html
│   └── onboarding.html
├── src/
│   ├── components/
│   │   └── features/
│   │       ├── CodeSnippets.tsx
│   │       ├── TaskTracker.tsx
│   │       ├── ResourceHub.tsx
│   │       ├── FocusMode.tsx
│   │       └── Settings.tsx
│   ├── background.ts
│   ├── contentScript.ts
│   └── App.tsx
├── scripts/
│   └── build.js
└��─ package.json
```

### Technologies Used
- React
- TypeScript
- Tailwind CSS
- Vite
- Chrome Extension APIs

### Building for Production
1. Run the build script:
   ```bash
   npm run build:extension
   ```

2. The built extension will be in the `dist` directory
3. You can then zip the `dist` directory for distribution

## Contributing
1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Submit a pull request

## License
MIT License - feel free to use this project for your own purposes.

## Support
If you encounter any issues or have suggestions, please open an issue on GitHub.
