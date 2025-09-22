import { MarkdownFile, DirectoryNode, IGNORED_DIRECTORIES, SUPPORTED_FORMATS } from '../types';

export class FileSystemService {
  static async selectDirectory(): Promise<MarkdownFile[]> {
    try {
      // Always use legacy method for better compatibility during testing
      return await this.selectDirectoryLegacy();
    } catch (error) {
      console.error('FileSystemService: Error in selectDirectory', error);
      if ((error as Error).name === 'AbortError') {
        return [];
      }
      throw error;
    }
  }

  static async selectDirectoryLegacy(): Promise<MarkdownFile[]> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      
      input.onchange = async (event) => {
        const files = Array.from((event.target as HTMLInputElement).files || []);
        const markdownFiles = await this.processFileList(files);
        resolve(markdownFiles);
      };
      
      input.onerror = (error) => {
        console.error('FileSystemService: File input error:', error);
        resolve([]);
      };
      
      input.oncancel = () => {
        resolve([]);
      };
      
      input.click();
    });
  }


  private static async processFileList(files: File[]): Promise<MarkdownFile[]> {
    const markdownFiles: MarkdownFile[] = [];
    
    for (const file of files) {
      const path = (file as any).webkitRelativePath || file.name;
      const isMarkdown = this.isMarkdownFile(file.name);
      const isIgnored = this.isInIgnoredDirectory(path);
      
      if (isMarkdown && !isIgnored) {
        markdownFiles.push({
          path,
          name: file.name,
          file,
          size: file.size,
          lastModified: file.lastModified
        });
      }
    }
    
    return markdownFiles;
  }

  static buildDirectoryTree(files: MarkdownFile[]): DirectoryNode[] {
    const nodeMap: Map<string, DirectoryNode> = new Map();
    
    // First pass: create all nodes
    files.forEach(file => {
      const pathParts = file.path.split('/');
      
      // Create all directory nodes in the path
      let currentPath = '';
      pathParts.forEach((part, _index) => {
        const isLast = _index === pathParts.length - 1;
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
      } else {
        // Child node - find parent
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = nodeMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    });
    
    const result = this.sortDirectoryTree(rootNodes);
    return result;
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
    return SUPPORTED_FORMATS.some(ext => filename.toLowerCase().endsWith(ext));
  }

  private static isIgnoredDirectory(dirName: string): boolean {
    return IGNORED_DIRECTORIES.includes(dirName);
  }

  private static isInIgnoredDirectory(filePath: string): boolean {
    const pathParts = filePath.split('/');
    return pathParts.some(part => this.isIgnoredDirectory(part));
  }
}