import { useState, useCallback } from 'react';
import { MarkdownFile, DirectoryNode } from '../types';
import { FileSystemService } from '../services/fileSystemService';

export const useFileSystem = () => {
  const [files, setFiles] = useState<Map<string, MarkdownFile>>(new Map());
  const [allFiles, setAllFiles] = useState<MarkdownFile[]>([]);
  const [directoryTree, setDirectoryTree] = useState<DirectoryNode[]>([]);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectDirectory = useCallback(async () => {
    console.log('useFileSystem: Starting directory selection');
    setLoading(true);
    setError(null);
    
    try {
      let markdownFiles: MarkdownFile[];
      
      if ('showDirectoryPicker' in window) {
        console.log('useFileSystem: Using modern API');
        markdownFiles = await FileSystemService.selectDirectory();
      } else {
        console.log('useFileSystem: Using legacy API');
        markdownFiles = await FileSystemService.selectDirectoryLegacy();
      }
      
      console.log('useFileSystem: Received', markdownFiles.length, 'markdown files');
      
      if (markdownFiles.length === 0) {
        console.log('useFileSystem: No files found');
        setError('No markdown files found in the selected directory');
        return;
      }
      
      const fileMap = new Map(markdownFiles.map(file => [file.path, file]));
      const tree = FileSystemService.buildDirectoryTree(markdownFiles);
      
      console.log('useFileSystem: Built tree with', tree.length, 'root nodes');
      console.log('useFileSystem: All files (including images):', markdownFiles.length);
      
      setFiles(fileMap);
      setAllFiles(markdownFiles); // Now markdownFiles includes both markdown and image files
      setDirectoryTree(tree);
      setFolderName(FileSystemService.getRootFolderName());
    } catch (err) {
      console.error('useFileSystem: Error during directory selection', err);
      setError(err instanceof Error ? err.message : 'Failed to load directory');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearFiles = useCallback(() => {
    setFiles(new Map());
    setAllFiles([]);
    setDirectoryTree([]);
    setFolderName(null);
    setError(null);
  }, []);

  const getFile = useCallback((path: string): MarkdownFile | undefined => {
    return files.get(path);
  }, [files]);

  return {
    files,
    allFiles,
    directoryTree,
    folderName,
    loading,
    error,
    selectDirectory,
    clearFiles,
    getFile,
    hasFiles: files.size > 0
  };
};