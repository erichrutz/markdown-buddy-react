import { useState, useCallback, useEffect } from 'react';
import { MarkdownFile, FileStats } from '../types';
import { MarkdownService } from '../services/markdownService';
import { FileSystemService } from '../services/fileSystemService';
import { ImageService } from '../services/imageService';

export const useMarkdown = (theme: 'light' | 'dark' = 'light', allFiles: MarkdownFile[] = []) => {
  const [currentFile, setCurrentFile] = useState<MarkdownFile | null>(null);
  const [content, setContent] = useState<string>('');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: MarkdownFile) => {
    if (currentFile?.path === file.path) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Only render markdown files, skip image files
      if (file.type !== 'markdown') {
        setError('Cannot render non-markdown files');
        return;
      }

      const fileContent = await FileSystemService.readFileContent(file.file);
      
      // Register images for blob URL creation
      ImageService.registerImages(allFiles);
      
      // Use image-aware rendering
      const html = await MarkdownService.renderMarkdownWithImages(fileContent, file.path, allFiles, theme);
      const fileStats = FileSystemService.getFileStats(fileContent, file);
      
      setCurrentFile(file);
      setContent(fileContent);
      setRenderedHtml(html);
      setStats(fileStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setLoading(false);
    }
  }, [currentFile, theme, allFiles]);

  const processInternalLinks = useCallback((
    container: HTMLElement,
    allFiles: Map<string, MarkdownFile>,
    onNavigate: (file: MarkdownFile) => void
  ) => {
    MarkdownService.activateInternalLinks(container, (path) => {
      if (!currentFile) return;
      
      const targetFile = MarkdownService.findInternalFile(
        path, 
        currentFile.path, 
        allFiles
      );
      
      if (targetFile) {
        onNavigate(targetFile);
      } else {
        console.warn('Internal link target not found:', path);
      }
    });
  }, [currentFile]);

  const processMermaidDiagrams = useCallback(async (container: HTMLElement) => {
    try {
      MarkdownService.updateTheme(theme);
      await MarkdownService.processMermaidDiagrams(container);
    } catch (err) {
      console.error('Failed to process Mermaid diagrams:', err);
    }
  }, [theme]);

  const processPlantUMLDiagrams = useCallback(async (container: HTMLElement) => {
    try {
      await MarkdownService.processPlantUMLDiagrams(container, theme);
    } catch (err) {
      console.error('Failed to process PlantUML diagrams:', err);
    }
  }, [theme]);

  useEffect(() => {
    MarkdownService.initialize(theme);
  }, [theme]);

  return {
    currentFile,
    content,
    renderedHtml,
    stats,
    loading,
    error,
    loadFile,
    processInternalLinks,
    processMermaidDiagrams,
    processPlantUMLDiagrams
  };
};