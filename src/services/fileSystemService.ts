import { MarkdownFile, DirectoryNode, IGNORED_DIRECTORIES } from '../types';

export class FileSystemService {
  static async selectDirectory(): Promise<MarkdownFile[]> {
    console.log('FileSystemService: Starting directory selection');
    console.log('FileSystemService: Browser supports showDirectoryPicker:', 'showDirectoryPicker' in window);
    
    try {
      // Clear caches before new directory selection
      this.ignoredPathCache.clear();
      this.markdownCache.clear();
      
      // Always use legacy method for better compatibility during testing
      console.log('FileSystemService: Using legacy file input for better compatibility');
      return await this.selectDirectoryLegacy();
    } catch (error) {
      console.error('FileSystemService: Error in selectDirectory', error);
      if ((error as Error).name === 'AbortError') {
        console.log('FileSystemService: User cancelled directory selection');
        return [];
      }
      throw error;
    }
  }

  static async selectDirectoryLegacy(): Promise<MarkdownFile[]> {
    console.log('FileSystemService: Setting up legacy directory picker');
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      
      console.log('FileSystemService: Created input element with webkitdirectory:', input.webkitdirectory);
      
      input.onchange = async (event) => {
        console.log('FileSystemService: File input changed');
        const files = Array.from((event.target as HTMLInputElement).files || []);
        console.log('FileSystemService: Raw files from input:', files.length);
        
        // Early performance warning
        if (files.length > 10000) {
          console.warn('FileSystemService: Large directory detected with', files.length, 'files. This may take a moment to process.');
        }
        
        // Quick preview of files being processed (limit logging for large directories)
        const logLimit = Math.min(files.length, 20);
        for (let i = 0; i < logLimit; i++) {
          const file = files[i];
          console.log(`File ${i}:`, {
            name: file.name,
            path: (file as any).webkitRelativePath,
            size: file.size,
            type: file.type
          });
        }
        
        if (files.length > logLimit) {
          console.log(`... and ${files.length - logLimit} more files`);
        }
        
        const markdownFiles = await this.processFileList(files);
        console.log('FileSystemService: Processed to', markdownFiles.length, 'markdown files');
        resolve(markdownFiles);
      };
      
      input.onerror = (error) => {
        console.error('FileSystemService: File input error:', error);
        resolve([]);
      };
      
      input.oncancel = () => {
        console.log('FileSystemService: User cancelled file selection');
        resolve([]);
      };
      
      console.log('FileSystemService: Triggering file input click');
      input.click();
    });
  }


  private static async processFileList(files: File[]): Promise<MarkdownFile[]> {
    const startTime = performance.now();
    console.log('FileSystemService: Processing file list with', files.length, 'files');
    
    // Fast path: if very few files, process immediately
    if (files.length <= 100) {
      const markdownFiles = files
        .filter(file => {
          const path = (file as any).webkitRelativePath || file.name;
          return this.isMarkdownFile(file.name) && !this.isInIgnoredDirectory(path);
        })
        .map(file => ({
          path: (file as any).webkitRelativePath || file.name,
          name: file.name,
          file,
          size: file.size,
          lastModified: file.lastModified
        }));
      
      console.log(`FileSystemService: Fast path completed in ${performance.now() - startTime}ms`);
      return markdownFiles;
    }

    // For larger directories: aggressive early filtering with performance monitoring
    const markdownFiles: MarkdownFile[] = [];
    let processedCount = 0;
    let ignoredCount = 0;
    
    // Process in smaller chunks for better responsiveness
    const chunkSize = 50;
    
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);
      const chunkStart = performance.now();
      
      for (const file of chunk) {
        const path = (file as any).webkitRelativePath || file.name;
        
        // Super fast early rejection
        if (!this.isMarkdownFile(file.name)) {
          processedCount++;
          continue;
        }
        
        if (this.isInIgnoredDirectory(path)) {
          ignoredCount++;
          processedCount++;
          continue;
        }
        
        markdownFiles.push({
          path,
          name: file.name,
          file,
          size: file.size,
          lastModified: file.lastModified
        });
        processedCount++;
      }
      
      const chunkTime = performance.now() - chunkStart;
      
      // Progress reporting every 1000 files
      if (processedCount % 1000 === 0) {
        const elapsedTime = performance.now() - startTime;
        const filesPerSec = Math.round(processedCount / (elapsedTime / 1000));
        const eta = ((files.length - processedCount) / filesPerSec).toFixed(1);
        
        console.log(`FileSystemService: ${processedCount}/${files.length} files processed (${filesPerSec} files/sec, ETA: ${eta}s, found: ${markdownFiles.length}, ignored: ${ignoredCount})`);
      }
      
      // Yield to UI every 250 files or if chunk processing took >10ms
      if (processedCount % 250 === 0 || chunkTime > 10) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    const totalTime = performance.now() - startTime;
    console.log(`FileSystemService: Completed in ${totalTime.toFixed(1)}ms. Found ${markdownFiles.length} markdown files, ignored ${ignoredCount} files.`);
    
    return markdownFiles;
  }

  static buildDirectoryTree(files: MarkdownFile[]): DirectoryNode[] {
    console.log('FileSystemService: Building directory tree from', files.length, 'files');
    const nodeMap: Map<string, DirectoryNode> = new Map();
    
    // First pass: create all nodes
    files.forEach(file => {
      console.log('FileSystemService: Processing file path:', file.path);
      const pathParts = file.path.split('/');
      
      // Create all directory nodes in the path
      let currentPath = '';
      pathParts.forEach((part, index) => {
        const isLast = index === pathParts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!nodeMap.has(currentPath)) {
          const node: DirectoryNode = {
            name: part,
            path: currentPath,
            type: isLast ? 'file' : 'directory',
            children: isLast ? undefined : [],
            file: isLast ? file : undefined
          };
          nodeMap.set(currentPath, node);
          console.log('FileSystemService: Created node:', currentPath, 'type:', node.type);
        }
      });
    });
    
    // Second pass: build parent-child relationships
    const rootNodes: DirectoryNode[] = [];
    
    nodeMap.forEach((node, path) => {
      const pathParts = path.split('/');
      if (pathParts.length === 1) {
        // Root level node
        rootNodes.push(node);
        console.log('FileSystemService: Added root node:', node.name);
      } else {
        // Child node - find parent
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = nodeMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
          console.log('FileSystemService: Added child', node.name, 'to parent', parent.name);
        }
      }
    });
    
    const result = this.sortDirectoryTree(rootNodes);
    console.log('FileSystemService: Built directory tree with', result.length, 'root nodes');
    result.forEach((node) => {
      this.logTreeNode(node, 0);
    });
    return result;
  }
  
  private static logTreeNode(node: DirectoryNode, depth: number): void {
    const indent = '  '.repeat(depth);
    console.log(`${indent}${node.type === 'directory' ? '📁' : '📄'} ${node.name} (${node.path})`);
    if (node.children) {
      node.children.forEach(child => this.logTreeNode(child, depth + 1));
    }
  }

  private static sortDirectoryTree(nodes: DirectoryNode[]): DirectoryNode[] {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    }).map(node => ({
      ...node,
      children: node.children ? this.sortDirectoryTree(node.children) : undefined
    }));
  }

  static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileStats(content: string, file: MarkdownFile) {
    return {
      size: this.formatFileSize(file.size),
      lines: content.split('\n').length,
      characters: content.length,
      path: file.path
    };
  }

  // Cache for markdown file checks
  private static markdownCache = new Map<string, boolean>();
  
  private static isMarkdownFile(filename: string): boolean {
    // Check cache first
    if (this.markdownCache.has(filename)) {
      return this.markdownCache.get(filename)!;
    }
    
    // Fast case-sensitive check first for common extensions
    if (filename.endsWith('.md') || filename.endsWith('.markdown')) {
      this.markdownCache.set(filename, true);
      return true;
    }
    
    // Fallback to case-insensitive check
    const lowerFilename = filename.toLowerCase();
    const result = lowerFilename.endsWith('.md') || lowerFilename.endsWith('.markdown');
    
    this.markdownCache.set(filename, result);
    return result;
  }

  private static isIgnoredDirectory(dirName: string): boolean {
    const result = IGNORED_DIRECTORIES.includes(dirName);
    if (result) {
      console.log('FileSystemService: Ignoring directory:', dirName);
    }
    return result;
  }

  // Cache for ignored directory checks to avoid repeated calculations
  private static ignoredPathCache = new Map<string, boolean>();
  
  private static isInIgnoredDirectory(filePath: string): boolean {
    // Check cache first
    if (this.ignoredPathCache.has(filePath)) {
      return this.ignoredPathCache.get(filePath)!;
    }
    
    // Super fast common cases first
    if (filePath.includes('/node_modules/') || 
        filePath.includes('/.git/') ||
        filePath.includes('/.vscode/') ||
        filePath.includes('/.idea/') ||
        filePath.includes('/dist/') ||
        filePath.includes('/build/')) {
      this.ignoredPathCache.set(filePath, true);
      return true;
    }
    
    const pathParts = filePath.split('/');
    
    // Fast path component check
    for (const part of pathParts) {
      if (this.isIgnoredDirectory(part)) {
        this.ignoredPathCache.set(filePath, true);
        return true;
      }
    }
    
    // File-level pattern checks (only if needed)
    const fileName = pathParts[pathParts.length - 1];
    for (const pattern of IGNORED_DIRECTORIES) {
      if (pattern.includes('*')) {
        if (pattern === '*.log' && fileName.endsWith('.log')) {
          this.ignoredPathCache.set(filePath, true);
          return true;
        }
        // Add other specific patterns as needed
      } else if (fileName === pattern) {
        this.ignoredPathCache.set(filePath, true);
        return true;
      }
    }
    
    this.ignoredPathCache.set(filePath, false);
    return false;
  }
}