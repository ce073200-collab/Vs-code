# VS Code Replica

This project is a fully interactive, web-based frontend replica of Visual Studio Code. It is built using vanilla web technologies (HTML, CSS, and JavaScript) to demonstrate a rich web application experience replicating a popular desktop application interface. 

The editor functionality is powered by the [Monaco Editor](https://microsoft.github.io/monaco-editor/), the same code editor that powers the real VS Code.

## Project Structure

The project has been separated into three main files for better maintainability and organization:
- `vs code replica.html`: Contains the structural markup, including the Activity Bar, Sidebar, Editor Area, Bottom Panel, Status Bar, and UI overlays (like the Command Palette and contextual menus).
- `vs code replica.css`: Contains all styling. Uses CSS variables heavily for theming (supporting dark, light, and high-contrast modes) and flexbox/grid for mimicking the complex VS Code layout.
- `vs code replica.js`: Contains the logic for the Virtual File System (VFS), Monaco Editor initialization, UI interactivity (tab switching, resizers), Command Palette logic, and a simulated terminal.

## Key Features Built

### 1. Monaco Editor Integration
- Complete syntax highlighting, autocompletion (with custom HTML snippets), and IntelliSense enabled by Monaco Editor.
- Support for multiple languages: HTML, CSS, JavaScript, JSON, Markdown.
- Find functionality and keyboard shortcut hooking.

### 2. Virtual File System (VFS)
- A mock file system stored in the browser's `localStorage` (`vscode-vfs`).
- Supports creating new files, modifying existing pseudo-files, and persisting content across page reloads.
- Pre-populated with boilerplate files simulating a React project.

### 3. User Interface & Layout Resizing
- **Activity Bar & Sidebar:** Easily toggleable. Features a file explorer and a functional mock-search panel.
- **Draggable Resizers:** Click-and-drag logic lets users resize the width of the sidebar and the height of the bottom panel natively using mouse events.
- **Tab Management:** Open, close, and switch between multiple active files via a top tab bar.
- **Welcome Screen:** Appears when all tabs are closed, providing quick action shortcuts.

### 4. Interactive Terminal
- A mock bash-like terminal in the bottom panel.
- Supports commands: `help`, `clear`, `ls`, `cat <filename>`, `date`, `whoami`, and `npm start` (which fakes a development server spin-up).
- Prints standard output and color-coded errors.

### 5. Command Palette & Shortcuts
- Accessible via `Ctrl+Shift+P` (or the top Command Center).
- Execute workbench commands such as:
  - Toggle Themes (Dark, Light, High Contrast)
  - Toggle Sidebar (`Ctrl+B`) / Panel (`Ctrl+` `)
  - File Operations (New File (`Ctrl+N`), Save (`Ctrl+S`))
  - Close active tab (`Ctrl+W`)

## How to Run

1. Clone or download this repository.
2. Open `vs code replica.html` in any modern web browser.
3. No build tools or dev environments are strictly required, though running it through a simple local server (e.g., Live Server) is recommended to ensure no cross-origin `localStorage` restrictions occur.

## Code Deep Dive

### State Management
State is handled manually in vanilla JS. Global variables like `activeFile`, `openTabs` (an array of file paths), and `monacoModels` are used to sync the UI logic with the editor logic.

### Monaco Editor Sync
When a file is opened, its content text is mapped into a Monaco "Model". As the user types, the `onDidChangeContent` event listener updates the Virtual File System object and triggers an automatic background save to LocalStorage.

### Simulated Window Menus
The main titlebar has replicated dropdown menus (File, Edit, Selection, etc.) that toggle based on explicit UI click detection, closing other overlays gracefully upon outside clicks.
