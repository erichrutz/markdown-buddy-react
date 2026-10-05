import { useState, useCallback, useEffect } from 'react';
import { MarkdownFile, FileStats } from '../types';
import { MarkdownService } from '../services/markdownService';
import { FileSystemService } from '../services/fileSystemService';
import { ImageService } from '../services/imageService';
import i18n from '../i18n/i18n';

const STALE_FILE_ERROR_NAMES = ['NotReadableError', 'NotFoundError', 'NotAllowedError'];

export const useMarkdown = (theme: 'light' | 'dark' = 'light', allFiles: MarkdownFile[] = []) => {
  const [currentFile, setCurrentFile] = useState<MarkdownFile | null>(null);
  const [content, setContent] = useState<string>('');
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (file: MarkdownFile, forceReload = false) => {
    if (!forceReload && currentFile?.path === file.path) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Only render markdown files, skip image files
      if (file.type !== 'markdown') {
        setError('Cannot render non-markdown files');
        return;
      }

      const fileContent = await FileSystemService.readMarkdownFileContent(file);
      
      // Ensure allFiles is an array
      const safeAllFiles = Array.isArray(allFiles) ? allFiles : [];
      
      // Register images for blob URL creation
      ImageService.registerImages(safeAllFiles);
      
      // Use image-aware rendering - first resolve image paths in content
      const contentWithImages = ImageService.resolveImagePaths(fileContent, file.path, safeAllFiles);
      
      // Convert allFiles array to Map for MarkdownService compatibility
      const allFilesMap = new Map(safeAllFiles.map(f => [f.path, f]));
      
      const html = await MarkdownService.renderMarkdown(
        contentWithImages, 
        theme, 
        file.path, 
        allFilesMap
      );
      
      const fileStats = FileSystemService.getFileStats(fileContent, file);
      
      setCurrentFile(file);
      setContent(fileContent);
      setRenderedHtml(html);
      setStats(fileStats);
    } catch (err) {
      const isStaleFileError = err instanceof DOMException && STALE_FILE_ERROR_NAMES.includes(err.name);
      setError(isStaleFileError ? i18n.t('ui.errorStaleFile') : err instanceof Error ? err.message : 'Failed to load file');
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
      // Log mermaid processing calls
      console.log('Mermaid processing triggered');
      
      MarkdownService.updateTheme(theme);
      
      // Simple debounce check - skip if processing is already in progress
      const isProcessing = container.querySelector('.mermaid-diagram[data-processed="processing"]');
      if (isProcessing) {
        console.log('Mermaid processing skipped: already in progress');
        return;
      }
      
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