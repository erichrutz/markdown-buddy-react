export interface MarkdownFile {
  path: string;
  name: string;
  file: File;
  content?: string;
  size: number;
  lastModified: number;
}

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  children?: DirectoryNode[];
  file?: MarkdownFile;
}

export interface FileTreeItem {
  id: string;
  label: string;
  children?: FileTreeItem[];
  file?: MarkdownFile;
  type: 'directory' | 'file';
}

export interface FileStats {
  size: string;
  lines: number;
  characters: number;
  path: string;
}

export interface SessionData {
  lastFolder?: string;
  lastFile?: string;
  expandedFolders: string[];
  language: string;
}

export interface UITexts {
  app: {
    title: string;
  };
  ui: {
    selectFolder: string;
    openInVSCode: string;
    collapseAll: string;
    language: string;
    currentFile: string;
    fileStats: string;
    noFileSelected: string;
    errorLoading: string;
  };
  stats: {
    size: string;
    lines: string;
    characters: string;
    path: string;
  };
}

export const IGNORED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'target',
  '.next',
  '.nuxt',
  'coverage',
  '__pycache__',
  '.pytest_cache',
  'vendor'
];

export const SUPPORTED_FORMATS = ['.md', '.markdown'];