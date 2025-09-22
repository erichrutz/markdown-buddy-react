import { useState, useCallback } from 'react';
import { MarkdownFile, DirectoryNode } from '../types';
import { FileSystemService } from '../services/fileSystemService';

export const useFileSystem = () => {
  const [files, setFiles] = useState<Map<string, MarkdownFile>>(new Map());
  const [directoryTree, setDirectoryTree] = useState<DirectoryNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let markdownFiles: MarkdownFile[];
      
      if ('showDirectoryPicker' in window) {
        markdownFiles = await FileSystemService.selectDirectory();
      } else {
        markdownFiles = await FileSystemService.selectDirectoryLegacy();
      }
      
      if (markdownFiles.length === 0) {
        setError('No markdown files found in the selected directory');
        return;
      }
      
      const fileMap = new Map(markdownFiles.map(file => [file.path, file]));
      const tree = FileSystemService.buildDirectoryTree(markdownFiles);
      
      setFiles(fileMap);
      setDirectoryTree(tree);
    } catch (err) {
      console.error('useFileSystem: Error during directory selection', err);
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearFiles = useCallback(() => {
    setFiles(new Map());
    setDirectoryTree([]);
    setError(null);
  }, []);

  const getFile = useCallback((path: string): MarkdownFile | undefined => {
    return files.get(path);
  }, [files]);

  return {
    files,
    directoryTree,
    loading,
    error,
    selectDirectory,
    clearFiles,
    getFile,
    hasFiles: files.size > 0
  };
};