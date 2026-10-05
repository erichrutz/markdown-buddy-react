import { MarkdownFile, DirectoryNode, IGNORED_DIRECTORIES, SUPPORTED_FORMATS } from '../types';

export class FileSystemService {
  private static allFiles: Map<string, File> = new Map(); // Store all files including images
  private static rootFolderName: string | null = null;

  static getRootFolderName(): string | null {
    return this.rootFolderName;
  }

  static isMarkdownFile(filename: string): boolean {
    const result = SUPPORTED_FORMATS.some(ext => filename.toLowerCase().endsWith(ext));
    console.log('FileSystemService: isMarkdownFile check:', filename, '→', result, 'supported formats:', SUPPORTED_FORMATS);
    return result;
  }

  static isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  static getAllFiles(): Map<string, File> {
    return this.allFiles;
  }

  static async selectDirectory(): Promise<MarkdownFile[]> {
    console.log('FileSystemService: Starting directory selection');
    console.log('FileSystemService: Browser supports showDirectoryPicker:', 'showDirectoryPicker' in window);

    try {
      return await this.selectDirectoryModern();
    } catch (error) {
      console.error('FileSystemService: Error in selectDirectory', error);
      if ((error as Error).name === 'AbortError') {
        console.log('FileSystemService: User cancelled directory selection');
        return [];
      }
      throw error;
    }
  }

  static async selectDirectoryModern(): Promise<MarkdownFile[]> {
    console.log('FileSystemService: Setting up modern directory picker');
    const rootHandle = await window.showDirectoryPicker();
    this.rootFolderName = rootHandle.name;

    this.allFiles.clear();
    const allProcessedFiles: MarkdownFile[] = [];
    await this.walkDirectoryHandle(rootHandle, rootHandle.name, allProcessedFiles);

    console.log('FileSystemService: Modern picker processed', allProcessedFiles.length, 'files');
    return allProcessedFiles;
  }

  private static async walkDirectoryHandle(
    directoryHandle: FileSystemDirectoryHandle,
    path: string,
    collected: MarkdownFile[]
  ): Promise<void> {
    for await (const [name, handle] of directoryHandle.entries()) {
      const entryPath = `${path}/${name}`;

      if (handle.kind === 'directory') {
        if (this.isIgnoredDirectory(name)) {
          console.log('FileSystemService: Skipping ignored directory:', entryPath);
          continue;
        }
        await this.walkDirectoryHandle(handle, entryPath, collected);
        continue;
      }

      const isMarkdown = this.isMarkdownFile(name);
      const isImage = this.isImageFile(name);
      if (!isMarkdown && !isImage) {
        continue;
      }

      const file = await handle.getFile();
      // Strip the root folder name to match the legacy webkitRelativePath-style paths.
      const relativePath = entryPath.split('/').slice(1).join('/');

      this.allFiles.set(relativePath, file);
      collected.push({
        path: relativePath,
        name,
        file,
        handle,
        size: file.size,
        lastModified: file.lastModified,
        type: isMarkdown ? 'markdown' : 'image'
      });
      console.log('FileSystemService: Added file (modern):', relativePath, 'type:', isMarkdown ? 'markdown' : 'image');
    }
  }

  /** Re-fetches the file from disk via its handle instead of a stale File snapshot. */
  static async getFreshFile(markdownFile: MarkdownFile): Promise<File> {
    if (!markdownFile.handle) {
      return markdownFile.file;
    }

    await this.verifyReadPermission(markdownFile.handle);
    return await markdownFile.handle.getFile();
  }

  static async readMarkdownFileContent(markdownFile: MarkdownFile): Promise<string> {
    const file = await this.getFreshFile(markdownFile);
    return this.readFileContent(file);
  }

  static async verifyReadPermission(handle: FileSystemFileHandle | FileSystemDirectoryHandle): Promise<boolean> {
    const options: FileSystemHandlePermissionDescriptor = { mode: 'read' };

    if ((await handle.queryPermission(options)) === 'granted') {
      return true;
    }

    return (await handle.requestPermission(options)) === 'granted';
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
        
        files.forEach((file, index) => {
          console.log(`File ${index}:`, {
            name: file.name,
            path: (file as any).webkitRelativePath,
            size: file.size,
            type: file.type
          });
        });
        
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
    console.log('FileSystemService: Processing file list with', files.length, 'files');
    const allProcessedFiles: MarkdownFile[] = [];
    
    // Clear and rebuild the all files map
    this.allFiles.clear();
    const firstPath = files[0] ? ((files[0] as any).webkitRelativePath || files[0].name) : null;
    this.rootFolderName = firstPath ? firstPath.split('/')[0] : null;
    
    for (const file of files) {
      const path = (file as any).webkitRelativePath || file.name;
      const isMarkdown = this.isMarkdownFile(file.name);
      const isImage = this.isImageFile(file.name);
      const isIgnored = this.isInIgnoredDirectory(path);
      
      console.log('FileSystemService: Processing file', file.name, {
        path,
        isMarkdown,
        isImage,
        isIgnored,
        willInclude: (isMarkdown || isImage) && !isIgnored
      });
      
      // Store all non-ignored files (markdown and images)
      if ((isMarkdown || isImage) && !isIgnored) {
        this.allFiles.set(path, file);
        
        // Add all files (markdown and images) to the processed files array
        allProcessedFiles.push({
          path,
          name: file.name,
          file,
          size: file.size,
          lastModified: file.lastModified,
          type: isMarkdown ? 'markdown' : 'image'
        });
        console.log('FileSystemService: Added file:', path, 'type:', isMarkdown ? 'markdown' : 'image');
      }
    }
    
    console.log('FileSystemService: Final processed files count:', allProcessedFiles.length);
    return allProcessedFiles;
  }

  static buildDirectoryTree(files: MarkdownFile[]): DirectoryNode[] {
    console.log('FileSystemService: Building directory tree from', files.length, 'files');
    const nodeMap: Map<string, DirectoryNode> = new Map();
    
    // Filter to only markdown files for the tree display
    const markdownFiles = files.filter(file => file.type === 'markdown');
    console.log('FileSystemService: Filtering to', markdownFiles.length, 'markdown files for tree display');
    
    // First pass: create all nodes
    markdownFiles.forEach(file => {
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

  private static isIgnoredDirectory(dirName: string): boolean {
    const result = IGNORED_DIRECTORIES.includes(dirName);
    if (result) {
      console.log('FileSystemService: Ignoring directory:', dirName);
    }
    return result;
  }

  private static isInIgnoredDirectory(filePath: string): boolean {
    const pathParts = filePath.split('/');
    const result = pathParts.some(part => this.isIgnoredDirectory(part));
    if (result) {
      console.log('FileSystemService: File in ignored directory:', filePath);
    }
    return result;
  }
}