# MarkDown Buddy React

A modern, React-based markdown viewer with Material-UI components, featuring a two-panel interface for browsing and viewing markdown files with live rendering, syntax highlighting, and Mermaid diagram support.

## ✨ Features

- **📁 Directory Browser**: Recursive directory exploration with intelligent filtering
- **🎨 Live Markdown Rendering**: GitHub-flavored markdown with syntax highlighting
- **📊 Mermaid Diagrams**: Automatic rendering of flowcharts, sequence diagrams, and more
- **🔗 Internal Link Navigation**: Click on markdown links to navigate between files
- **💾 Session Persistence**: Remember last opened folder and file
- **🌐 Internationalization**: German and English language support
- **📱 Responsive Design**: Works on desktop and mobile devices
- **💻 VS Code Integration**: Open files directly in VS Code
- **📈 File Statistics**: Display file size, line count, and character count

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MarkdownBuddyReact
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📖 Usage

1. **Select a Directory**: Click "Select Folder" in the header to choose a directory containing markdown files
2. **Browse Files**: Use the file tree on the left to navigate through your markdown files
3. **View Content**: Click on any `.md` or `.markdown` file to view its rendered content
4. **Internal Links**: Click on internal markdown links to navigate between files
5. **VS Code Integration**: Click the VS Code icon to open the current file in VS Code
6. **Language Switch**: Use the language icon to switch between German and English

## 🛠️ Built With

- **React 18** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **Vite** - Build tool and dev server
- **marked.js** - Markdown parsing
- **highlight.js** - Syntax highlighting
- **Mermaid.js** - Diagram rendering
- **react-i18next** - Internationalization

## 📁 Project Structure

```
src/
├── components/        # React components
│   ├── AppHeader.tsx
│   ├── ErrorBoundary.tsx
│   ├── FileTree.tsx
│   └── MarkdownViewer.tsx
├── hooks/            # Custom React hooks
│   ├── useFileSystem.ts
│   ├── useMarkdown.ts
│   └── useSession.ts
├── services/         # Business logic
│   ├── fileSystemService.ts
│   ├── markdownService.ts
│   ├── sessionService.ts
│   └── vscodeService.ts
├── i18n/            # Internationalization
│   ├── i18n.ts
│   └── translations.ts
├── theme/           # MUI theme configuration
│   └── theme.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── styles/          # CSS styles
│   └── markdown.css
└── App.tsx          # Main application component
```

## 🎨 Features in Detail

### File System Support
- Modern File System Access API with fallback to legacy file input
- Automatic filtering of ignored directories (node_modules, .git, etc.)
- Support for .md and .markdown files

### Markdown Rendering
- GitHub Flavored Markdown support
- Syntax highlighting for 180+ programming languages
- Responsive tables and lists
- Custom link handling for internal navigation

### Mermaid Diagrams
Supports all Mermaid diagram types:
- Flowcharts
- Sequence diagrams
- Class diagrams
- State diagrams
- Gantt charts
- Pie charts
- Git graphs

### Session Management
- Automatic saving of last opened folder and file
- Persistent folder expansion state
- Language preference storage

## 🌐 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with responsive design

## 🔧 Configuration

### Ignored Directories
Edit `src/types/index.ts` to modify the list of ignored directories:

```typescript
export const IGNORED_DIRECTORIES = [
  'node_modules', '.git', '.vscode', 'dist', 'build'
];
```

### Supported File Extensions
Modify the supported file extensions in `src/types/index.ts`:

```typescript
export const SUPPORTED_FORMATS = ['.md', '.markdown'];
```

### Theme Customization
Edit `src/theme/theme.ts` to customize colors and styling.

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.