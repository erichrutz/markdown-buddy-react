import { useCallback, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Drawer, useMediaQuery } from '@mui/material';
import theme from './theme/theme';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppHeader } from './components/AppHeader';
import { FileTree } from './components/FileTree';
import { MarkdownViewer } from './components/MarkdownViewer';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { PDFExportDialog } from './components/PDFExportDialog';
import { useFileSystem } from './hooks/useFileSystem';
import { useMarkdown } from './hooks/useMarkdown';
import { useSession } from './hooks/useSession';
import { useKeyboardShortcuts, createDefaultShortcuts } from './hooks/useKeyboardShortcuts';
import { usePDFExport } from './hooks/usePDFExport';
import { PDFExportOptions } from './services/pdfExportService';
import './i18n/i18n';
import './styles/markdown.css';

const DRAWER_WIDTH = 300;

function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // File system management
  const {
    files,
    directoryTree,
    loading: fileLoading,
    error: fileError,
    selectDirectory
  } = useFileSystem();

  // Markdown rendering
  const {
    currentFile,
    renderedHtml,
    stats,
    loading: markdownLoading,
    error: markdownError,
    loadFile,
    processInternalLinks,
    processMermaidDiagrams,
    processPlantUMLDiagrams
  } = useMarkdown();

  // Session management
  const {
    expandedFolders,
    focusMode,
    sidebarVisible,
    saveExpandedFolders,
    saveCurrentFile,
    toggleFocusMode,
    toggleSidebar
  } = useSession();

  // Dialog states
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);

  // PDF Export
  const { exportToPDF, generateDefaultFilename } = usePDFExport();

  // File change detection (temporarily simplified)
  const hasFileChanged = false;
  
  // Simple refresh function without change detection
  const refreshFile = useCallback(async (): Promise<string | null> => {
    if (!currentFile) return null;
    try {
      return await currentFile.file.text();
    } catch (error) {
      console.error('Error refreshing file:', error);
      throw error;
    }
  }, [currentFile]);

  // Event handlers
  const handleFileSelect = useCallback((file: any) => {
    loadFile(file);
    saveCurrentFile(file.path);
  }, [loadFile, saveCurrentFile]);

  const handleCollapseAll = useCallback(() => {
    saveExpandedFolders([]);
  }, [saveExpandedFolders]);

  const handleInternalLinkClick = useCallback((container: HTMLElement) => {
    processInternalLinks(container, files, handleFileSelect);
  }, [processInternalLinks, files, handleFileSelect]);

  const handleMermaidProcess = useCallback((container: HTMLElement) => {
    processMermaidDiagrams(container);
  }, [processMermaidDiagrams]);

  const handlePlantUMLProcess = useCallback(async (container: HTMLElement) => {
    await processPlantUMLDiagrams(container);
  }, [processPlantUMLDiagrams]);

  // PDF Export handlers
  const handlePDFExport = useCallback(async (options: PDFExportOptions) => {
    if (!currentFile) return;
    
    // Find the markdown content element
    const contentElement = document.querySelector('.markdown-content') as HTMLElement;
    if (!contentElement) {
      throw new Error('Content element not found');
    }

    await exportToPDF(contentElement, currentFile, options);
  }, [currentFile, exportToPDF]);

  const handleShowPDFExport = useCallback(() => {
    if (currentFile) {
      setShowPDFExport(true);
    }
  }, [currentFile]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    if (currentFile) {
      try {
        // Use the file change detection hook for consistent refresh
        const freshContent = await refreshFile();
        
        if (freshContent !== null) {
          // Simply reload the current file using the existing loadFile function
          await loadFile(currentFile);
          console.log('File refreshed:', currentFile.path);
        }
      } catch (error) {
        console.error('Error refreshing file:', error);
        // Error handling is already done by useMarkdown hook
      }
    }
  }, [currentFile, refreshFile, loadFile]);

  // Keyboard shortcuts
  const shortcuts = createDefaultShortcuts({
    toggleSidebar: () => {
      if (!focusMode) toggleSidebar();
    },
    toggleFocusMode,
    exitFocusMode: () => {
      if (focusMode) toggleFocusMode();
    },
    selectDirectory,
    collapseAll: handleCollapseAll,
    showHelp: () => setShowShortcutsHelp(true),
    exportPDF: handleShowPDFExport,
    refresh: handleRefresh
  });

  const { formatShortcut } = useKeyboardShortcuts({
    shortcuts,
    enabled: true
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          {/* Header - Hide in focus mode */}
          {!focusMode && (
            <AppHeader
              onSelectDirectory={selectDirectory}
              loading={fileLoading}
              focusMode={focusMode}
              onToggleFocusMode={toggleFocusMode}
              onShowShortcuts={() => setShowShortcutsHelp(true)}
              onExportPDF={handleShowPDFExport}
              onRefresh={handleRefresh}
              hasCurrentFile={!!currentFile}
              hasFileChanged={hasFileChanged}
            />
          )}

          {/* Main Content */}
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* File Tree Sidebar - Hide in focus mode or when toggled off */}
            {!focusMode && sidebarVisible && (
              <Drawer
                variant={isMobile ? 'temporary' : 'permanent'}
                sx={{
                  width: DRAWER_WIDTH,
                  flexShrink: 0,
                  '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    position: 'relative',
                    height: '100%'
                  },
                }}
              >
                <FileTree
                  directoryTree={directoryTree}
                  selectedFile={currentFile}
                  expandedFolders={expandedFolders}
                  onFileSelect={handleFileSelect}
                  onExpandedChange={saveExpandedFolders}
                  onCollapseAll={handleCollapseAll}
                />
              </Drawer>
            )}

            {/* Content Panel */}
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                width: focusMode ? '100%' : 'auto'
              }}
            >
              <MarkdownViewer
                file={currentFile}
                content={renderedHtml}
                stats={stats}
                loading={markdownLoading}
                error={markdownError || fileError}
                focusMode={focusMode}
                onInternalLinkClick={handleInternalLinkClick}
                onMermaidProcess={handleMermaidProcess}
                onPlantUMLProcess={handlePlantUMLProcess}
                onExitFocusMode={toggleFocusMode}
              />
            </Box>
          </Box>

          {/* Keyboard Shortcuts Help Dialog */}
          <KeyboardShortcutsHelp
            open={showShortcutsHelp}
            onClose={() => setShowShortcutsHelp(false)}
            shortcuts={shortcuts}
            formatShortcut={formatShortcut}
          />

          {/* PDF Export Dialog */}
          <PDFExportDialog
            open={showPDFExport}
            onClose={() => setShowPDFExport(false)}
            onExport={handlePDFExport}
            defaultFilename={currentFile ? generateDefaultFilename(currentFile) : 'document.pdf'}
          />
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;