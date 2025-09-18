# Mermaid Diagram Examples

This document showcases various Mermaid diagrams supported by MarkDown Buddy.

## Flowchart Example

```mermaid
flowchart TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> E[Fix Issues]
    E --> B
    C --> F[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant MarkdownBuddy
    participant FileSystem
    participant Renderer

    User->>MarkdownBuddy: Select Folder
    MarkdownBuddy->>FileSystem: Read Directory
    FileSystem-->>MarkdownBuddy: Return Files
    MarkdownBuddy->>User: Display File Tree
    
    User->>MarkdownBuddy: Click File
    MarkdownBuddy->>FileSystem: Read File Content
    FileSystem-->>MarkdownBuddy: Return Markdown
    MarkdownBuddy->>Renderer: Process Markdown
    Renderer-->>MarkdownBuddy: Return HTML
    MarkdownBuddy->>User: Display Rendered Content
```

## Class Diagram

```mermaid
classDiagram
    class MarkdownViewer {
        +files: Map
        +currentFile: File
        +selectFile(path)
        +renderContent()
        +processLinks()
    }
    
    class FileSystemService {
        +selectDirectory()
        +buildDirectoryTree()
        +readFileContent()
    }
    
    class MarkdownService {
        +renderMarkdown()
        +processMermaidDiagrams()
        +activateInternalLinks()
    }
    
    MarkdownViewer --> FileSystemService
    MarkdownViewer --> MarkdownService
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: Select Folder
    Loading --> FileTree: Files Loaded
    FileTree --> Rendering: Select File
    Rendering --> Displayed: Render Complete
    Displayed --> Rendering: Select Another File
    Displayed --> FileTree: File Navigation
    FileTree --> Idle: Clear Files
```

## Gantt Chart

```mermaid
gantt
    title MarkDown Buddy Development Timeline
    dateFormat  YYYY-MM-DD
    section Setup
    Project Init       :done,    init, 2024-01-01, 2024-01-03
    Dependencies       :done,    deps, after init, 3d
    
    section Core Features
    File System API    :done,    fs, 2024-01-04, 5d
    Markdown Renderer  :done,    md, after fs, 4d
    UI Components      :done,    ui, after md, 6d
    
    section Advanced
    Mermaid Integration :done,   mermaid, after ui, 3d
    Internationalization :done,  i18n, after mermaid, 2d
    Testing & Polish    :active, polish, after i18n, 4d
```

## Pie Chart

```mermaid
pie title MarkDown Buddy Features
    "File Navigation" : 25
    "Markdown Rendering" : 30
    "Mermaid Diagrams" : 15
    "Internationalization" : 10
    "UI/UX" : 20
```

## Git Graph

```mermaid
gitgraph
    commit id: "Initial setup"
    commit id: "Add file system"
    branch feature-ui
    checkout feature-ui
    commit id: "Create components"
    commit id: "Add styling"
    checkout main
    merge feature-ui
    commit id: "Add Mermaid support"
    branch feature-i18n
    checkout feature-i18n
    commit id: "Add translations"
    checkout main
    merge feature-i18n
    commit id: "Release v1.0"
```

## ER Diagram

```mermaid
erDiagram
    FILE ||--o{ DIRECTORY : contains
    FILE {
        string path
        string name
        number size
        date lastModified
        string content
    }
    
    DIRECTORY {
        string path
        string name
        boolean expanded
    }
    
    SESSION ||--|| USER : stores
    SESSION {
        string lastFolder
        string lastFile
        array expandedFolders
        string language
    }
    
    USER {
        string id
        string preference
    }
```

## Testing Instructions

1. **Scroll through each diagram** to verify proper rendering
2. **Check for errors** - broken diagrams show error messages
3. **Verify responsiveness** - diagrams should scale properly
4. **Test in both languages** - diagrams work in German and English

## Links to Other Examples

- [Code Examples](code-examples.md) - Syntax highlighting test
- [Complex Document](../docs/complex-example.md) - Full feature test
- [Internal Links](../docs/internal-links.md) - Navigation test

---

**Mermaid Version**: Latest supported by the application  
**Diagram Types**: All major Mermaid diagram types are supported!