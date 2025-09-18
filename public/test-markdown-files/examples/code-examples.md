# Code Syntax Highlighting Examples

This document tests syntax highlighting for various programming languages.

## Web Development

### JavaScript
```javascript
// Modern JavaScript with ES6+ features
class MarkdownRenderer {
  constructor(options = {}) {
    this.options = { syntax: true, ...options };
    this.cache = new Map();
  }

  async render(content) {
    if (this.cache.has(content)) {
      return this.cache.get(content);
    }
    
    const result = await this.processMarkdown(content);
    this.cache.set(content, result);
    return result;
  }

  processMarkdown(content) {
    return marked(content, {
      highlight: (code, lang) => {
        return hljs.highlight(code, { language: lang }).value;
      },
      breaks: true,
      gfm: true
    });
  }
}

// Usage
const renderer = new MarkdownRenderer({ syntax: true });
renderer.render('# Hello World').then(console.log);
```

### TypeScript
```typescript
interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  lastModified?: Date;
}

class FileTreeManager<T extends FileNode> {
  private nodes: Map<string, T> = new Map();
  private expanded: Set<string> = new Set();

  addNode(node: T): void {
    this.nodes.set(node.path, node);
  }

  toggleExpanded(path: string): boolean {
    if (this.expanded.has(path)) {
      this.expanded.delete(path);
      return false;
    } else {
      this.expanded.add(path);
      return true;
    }
  }

  getExpandedNodes(): T[] {
    return Array.from(this.expanded)
      .map(path => this.nodes.get(path))
      .filter((node): node is T => node !== undefined);
  }
}
```

### CSS
```css
/* Modern CSS with custom properties and grid */
:root {
  --primary-color: #2c3e50;
  --secondary-color: #3498db;
  --background-color: #f5f5f5;
  --text-color: #333;
  --border-radius: 8px;
  --shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.markdown-viewer {
  display: grid;
  grid-template-columns: 300px 1fr;
  grid-template-rows: auto 1fr;
  height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
}

.file-tree {
  grid-column: 1;
  grid-row: 2;
  overflow-y: auto;
  border-right: 1px solid #e1e4e8;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.content-panel {
  grid-column: 2;
  grid-row: 2;
  overflow-y: auto;
  padding: 2rem;
}

@media (max-width: 768px) {
  .markdown-viewer {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr;
  }
  
  .file-tree {
    grid-column: 1;
    grid-row: 2;
    max-height: 200px;
  }
  
  .content-panel {
    grid-column: 1;
    grid-row: 3;
  }
}
```

### HTML
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MarkDown Buddy</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  
  <!-- Mermaid for diagram rendering -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  
  <!-- Main application bundle -->
  <script type="module" src="/src/main.tsx"></script>
  
  <!-- Service Worker for PWA -->
  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered', reg))
        .catch(err => console.log('SW registration failed', err));
    }
  </script>
</body>
</html>
```

## Backend Languages

### Python
```python
import asyncio
import aiohttp
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from pathlib import Path

@dataclass
class MarkdownFile:
    path: Path
    content: str
    metadata: Dict[str, Any]
    
    @classmethod
    async def from_file(cls, file_path: Path) -> 'MarkdownFile':
        """Load markdown file asynchronously"""
        async with aiohttp.ClientSession() as session:
            content = await cls._read_file(file_path)
            metadata = await cls._extract_metadata(content)
            return cls(path=file_path, content=content, metadata=metadata)
    
    @staticmethod
    async def _read_file(path: Path) -> str:
        with open(path, 'r', encoding='utf-8') as file:
            return file.read()
    
    @staticmethod
    async def _extract_metadata(content: str) -> Dict[str, Any]:
        """Extract YAML frontmatter if present"""
        lines = content.split('\n')
        if lines[0] == '---':
            # Find closing ---
            for i, line in enumerate(lines[1:], 1):
                if line == '---':
                    frontmatter = '\n'.join(lines[1:i])
                    # Parse YAML (simplified)
                    return {'raw': frontmatter}
        return {}

# Usage example
async def process_markdown_files(directory: Path) -> List[MarkdownFile]:
    tasks = []
    for file_path in directory.glob('**/*.md'):
        tasks.append(MarkdownFile.from_file(file_path))
    
    return await asyncio.gather(*tasks)
```

### Rust
```rust
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use tokio::fs::File;
use tokio::io::{AsyncReadExt, Result};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarkdownFile {
    pub path: PathBuf,
    pub name: String,
    pub content: Option<String>,
    pub size: u64,
    pub modified: Option<u64>,
}

#[derive(Debug)]
pub struct FileSystemService {
    files: HashMap<PathBuf, MarkdownFile>,
    ignored_dirs: Vec<String>,
}

impl FileSystemService {
    pub fn new() -> Self {
        Self {
            files: HashMap::new(),
            ignored_dirs: vec![
                "node_modules".to_string(),
                ".git".to_string(),
                "target".to_string(),
                "dist".to_string(),
            ],
        }
    }

    pub async fn scan_directory(&mut self, dir: &Path) -> Result<Vec<MarkdownFile>> {
        let mut files = Vec::new();
        self.scan_recursive(dir, &mut files).await?;
        Ok(files)
    }

    async fn scan_recursive(
        &self,
        dir: &Path,
        files: &mut Vec<MarkdownFile>,
    ) -> Result<()> {
        let mut entries = tokio::fs::read_dir(dir).await?;
        
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            
            if path.is_dir() && !self.is_ignored_dir(&path) {
                Box::pin(self.scan_recursive(&path, files)).await?;
            } else if self.is_markdown_file(&path) {
                let metadata = entry.metadata().await?;
                let file = MarkdownFile {
                    path: path.clone(),
                    name: path.file_name()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string(),
                    content: None,
                    size: metadata.len(),
                    modified: metadata.modified()
                        .ok()
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs()),
                };
                files.push(file);
            }
        }
        
        Ok(())
    }

    fn is_markdown_file(&self, path: &Path) -> bool {
        path.extension()
            .and_then(|ext| ext.to_str())
            .map(|ext| matches!(ext, "md" | "markdown"))
            .unwrap_or(false)
    }

    fn is_ignored_dir(&self, path: &Path) -> bool {
        path.file_name()
            .and_then(|name| name.to_str())
            .map(|name| self.ignored_dirs.iter().any(|ignored| ignored == name))
            .unwrap_or(false)
    }
}
```

### Go
```go
package main

import (
    "encoding/json"
    "fmt"
    "io/fs"
    "path/filepath"
    "strings"
    "time"
)

type MarkdownFile struct {
    Path         string    `json:"path"`
    Name         string    `json:"name"`
    Size         int64     `json:"size"`
    LastModified time.Time `json:"lastModified"`
    Content      string    `json:"content,omitempty"`
}

type FileService struct {
    ignoredDirs []string
    files       map[string]*MarkdownFile
}

func NewFileService() *FileService {
    return &FileService{
        ignoredDirs: []string{
            "node_modules", ".git", ".vscode", 
            "dist", "build", "target",
        },
        files: make(map[string]*MarkdownFile),
    }
}

func (fs *FileService) ScanDirectory(root string) ([]*MarkdownFile, error) {
    var files []*MarkdownFile
    
    err := filepath.WalkDir(root, func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err
        }
        
        // Skip ignored directories
        if d.IsDir() && fs.isIgnoredDir(d.Name()) {
            return filepath.SkipDir
        }
        
        // Process markdown files
        if !d.IsDir() && fs.isMarkdownFile(path) {
            info, err := d.Info()
            if err != nil {
                return err
            }
            
            file := &MarkdownFile{
                Path:         path,
                Name:         d.Name(),
                Size:         info.Size(),
                LastModified: info.ModTime(),
            }
            
            files = append(files, file)
            fs.files[path] = file
        }
        
        return nil
    })
    
    return files, err
}

func (fs *FileService) isMarkdownFile(filename string) bool {
    ext := strings.ToLower(filepath.Ext(filename))
    return ext == ".md" || ext == ".markdown"
}

func (fs *FileService) isIgnoredDir(dirname string) bool {
    for _, ignored := range fs.ignoredDirs {
        if dirname == ignored {
            return true
        }
    }
    return false
}

func (fs *FileService) ToJSON() ([]byte, error) {
    var files []*MarkdownFile
    for _, file := range fs.files {
        files = append(files, file)
    }
    return json.MarshalIndent(files, "", "  ")
}

func main() {
    service := NewFileService()
    files, err := service.ScanDirectory("./docs")
    if err != nil {
        fmt.Printf("Error scanning directory: %v\n", err)
        return
    }
    
    fmt.Printf("Found %d markdown files\n", len(files))
    
    if jsonData, err := service.ToJSON(); err == nil {
        fmt.Println(string(jsonData))
    }
}
```

## Configuration & Data

### JSON
```json
{
  "name": "markdown-buddy",
  "version": "1.0.0",
  "description": "Modern markdown viewer with file tree navigation",
  "main": "dist/index.html",
  "scripts": {
    "dev": "vite --port 3002",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@mui/material": "^5.0.0",
    "@emotion/react": "^11.0.0",
    "@emotion/styled": "^11.0.0",
    "marked": "^5.0.0",
    "highlight.js": "^11.0.0",
    "mermaid": "^10.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "react-i18next": "^13.0.0"
  },
  "devDependencies": {
    "@types/marked": "^5.0.0",
    "@types/react": "^18.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "browserslist": [
    "> 1%",
    "last 2 versions",
    "not dead",
    "not ie <= 11"
  ]
}
```

### YAML
```yaml
# GitHub Actions workflow
name: Build and Deploy MarkDown Buddy

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  CACHE_PREFIX: 'v1'

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v3
      
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run type checking
      run: npm run type-check
      
    - name: Run linting
      run: npm run lint
      
    - name: Build application
      run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to production
      run: echo "Deploying to production..."
      env:
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
```

### SQL
```sql
-- Database schema for MarkDown Buddy user sessions
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_data JSONB NOT NULL,
    last_folder TEXT,
    last_file TEXT,
    expanded_folders TEXT[],
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE markdown_files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    last_modified TIMESTAMP,
    content_hash VARCHAR(64),
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_user_file UNIQUE (user_id, file_path)
);

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_markdown_files_user_id ON markdown_files(user_id);
CREATE INDEX idx_markdown_files_path ON markdown_files(file_path);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_sessions_updated_at 
    BEFORE UPDATE ON user_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Testing Instructions

1. **Verify syntax highlighting** for each language above
2. **Check color coding** - keywords, strings, comments should be colored
3. **Test code block scrolling** for long code snippets
4. **Verify line breaks** and formatting are preserved
5. **Test in both light/dark themes** if available

---

[← Back to Examples](../README.md) | [Next: Mermaid Examples](mermaid-examples.md)