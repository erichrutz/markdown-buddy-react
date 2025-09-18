import { useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Drawer, useMediaQuery } from '@mui/material';
import theme from './theme/theme';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppHeader } from './components/AppHeader';
import { FileTree } from './components/FileTree';
import { MarkdownViewer } from './components/MarkdownViewer';
import { useFileSystem } from './hooks/useFileSystem';
import { useMarkdown } from './hooks/useMarkdown';
import { useSession } from './hooks/useSession';
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
    saveExpandedFolders,
    saveCurrentFile,
    toggleFocusMode
  } = useSession();

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
            />
          )}

          {/* Main Content */}
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* File Tree Sidebar - Hide in focus mode */}
            {!focusMode && (
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
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;