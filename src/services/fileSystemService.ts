import { MarkdownFile, DirectoryNode, IGNORED_DIRECTORIES, SUPPORTED_FORMATS } from '../types';

export class FileSystemService {
  static async selectDirectory(): Promise<MarkdownFile[]> {
    console.log('FileSystemService: Starting directory selection');
    console.log('FileSystemService: Browser supports showDirectoryPicker:', 'showDirectoryPicker' in window);
    
    try {
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
    const markdownFiles: MarkdownFile[] = [];
    
    for (const file of files) {
      const path = (file as any).webkitRelativePath || file.name;
      const isMarkdown = this.isMarkdownFile(file.name);
      const isIgnored = this.isInIgnoredDirectory(path);
      
      console.log('FileSystemService: Processing file', file.name, {
        path,
        isMarkdown,
        isIgnored,
        willInclude: isMarkdown && !isIgnored
      });
      
      if (isMarkdown && !isIgnored) {
        markdownFiles.push({
          path,
          name: file.name,
          file,
          size: file.size,
          lastModified: file.lastModified
        });
        console.log('FileSystemService: Added markdown file:', path);
      }
    }
    
    console.log('FileSystemService: Final markdown files count:', markdownFiles.length);
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
    result.forEach((node, index) => {
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

  private static isMarkdownFile(filename: string): boolean {
    const result = SUPPORTED_FORMATS.some(ext => filename.toLowerCase().endsWith(ext));
    console.log('FileSystemService: isMarkdownFile check:', filename, '→', result, 'supported formats:', SUPPORTED_FORMATS);
    return result;
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