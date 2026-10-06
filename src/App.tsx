import { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, Snackbar } from '@mui/material';
import { createAppTheme } from './theme/theme';
import { getSurfaceTokens, getStageTokens, getSurroundTokens, BRAND } from './theme/designTokens';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar } from './components/Sidebar';
import { Toolbar } from './components/Toolbar';
import { MarkdownViewer } from './components/MarkdownViewer';
import { SectionsView } from './components/SectionsView';
import { PresentationMode } from './components/PresentationMode';
import { Pointer } from './components/Pointer';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';
import { PDFExportDialog } from './components/PDFExportDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { AboutDialog } from './components/AboutDialog';
import { useFileSystem } from './hooks/useFileSystem';
import { useMarkdown } from './hooks/useMarkdown';
import { useSession } from './hooks/useSession';
import { useSettings } from './hooks/useSettings';
import { useOpenedFiles } from './hooks/useOpenedFiles';
import { useKeyboardShortcuts, createDefaultShortcuts } from './hooks/useKeyboardShortcuts';
import { usePDFExport } from './hooks/usePDFExport';
import { useFileChangeDetection } from './hooks/useFileChangeDetection';
import { useTextMarker } from './hooks/useTextMarker';
import { usePresentationConfig } from './hooks/usePresentationConfig';
import { parseSectionsFromHTML, extractOutline, Section, OutlineEntry } from './utils/sectionParser';
import { PDFExportOptions } from './services/pdfExportService';
import { MarkdownService } from './services/markdownService';
import { FileSystemService } from './services/fileSystemService';
import { ViewMode } from './components/Toolbar';
import './i18n/i18n';
import './styles/markdown.css';

function App() {
  const { t } = useTranslation();
  const {
    settings,
    updateAppearanceSettings,
    updateBehaviorSettings,
    updateViewSettings,
    updateDiagramSettings,
    updateExportSettings,
    updateKeyboardSettings,
    updatePerformanceSettings,
    resetSettings,
    exportSettings,
    importSettings,
    getEffectiveTheme
  } = useSettings();

  const theme = createAppTheme(getEffectiveTheme(), settings.appearance);
  const isDark = getEffectiveTheme() === 'dark';
  const tokens = getSurfaceTokens(getEffectiveTheme());

  const {
    allFiles,
    directoryTree,
    folderName,
    loading: fileLoading,
    error: fileError,
    selectDirectory
  } = useFileSystem();

  const {
    expandedFolders,
    saveExpandedFolders,
    saveCurrentFile,
  } = useSession();

  const {
    openedEntries,
    openedSectionOpen,
    setOpenedSectionOpen,
    addFiles: addOpenedFiles,
    removeFile: removeOpenedFile,
    clearAll: clearOpenedFiles,
    requestPermission,
    getFileById: getOpenedFileById,
  } = useOpenedFiles();

  // Combine folder files with opened files for markdown rendering
  const combinedAllFiles = useMemo(() => {
    const opened = openedEntries.filter(e => !e.needsPermission).map(e => e.file);
    return [...allFiles, ...opened];
  }, [allFiles, openedEntries]);

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
  } = useMarkdown(getEffectiveTheme(), combinedAllFiles, {
    openLinksInNewTab: settings.behavior.openLinksInNewTab,
    plantUMLServer: settings.diagrams.plantUMLServer,
  });

  // Drag & drop state
  const [dragOver, setDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  // Toast state
  const [toast, setToast] = useState<string | null>(null);

  // Dialog states
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showPDFExport, setShowPDFExport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // View & presentation state
  const [view, setView] = useState<ViewMode>('doc');
  const [zoom, setZoom] = useState(settings.view.zoom);
  const [docWidth, setDocWidth] = useState(settings.view.docWidth);
  const [docPointer, setDocPointer] = useState(settings.view.docPointer);
  const [presenting, setPresenting] = useState(false);
  const [presIndex, setPresIndex] = useState(0);
  const [presPointer, setPresPointer] = useState(settings.view.presPointer);
  const [presTheme, setPresTheme] = useState<'light' | 'dark'>(settings.view.presTheme);
  const [skipped, setSkipped] = useState<number[]>([]);

  // Sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(300);
  const [filesSectionOpen, setFilesSectionOpen] = useState(true);
  const [outlineSectionOpen, setOutlineSectionOpen] = useState(true);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const [sortDescending, setSortDescending] = useState(false);
  const sidebarDragging = useRef(false);

  const handleSidebarResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    sidebarDragging.current = true;
    const onMove = (ev: globalThis.MouseEvent) => {
      if (!sidebarDragging.current) return;
      setSidebarWidth(Math.max(200, Math.min(600, ev.clientX)));
    };
    const onUp = () => {
      sidebarDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // Persist view state
  useEffect(() => {
    updateViewSettings({ zoom, docWidth, docPointer, presPointer, presTheme });
  }, [zoom, docWidth, docPointer, presPointer, presTheme, updateViewSettings]);

  const { markCount, addMark, removeMarkAtPoint, clearMarks, reanchorStage, clearStage } = useTextMarker();
  const { exportToPDF, generateDefaultFilename } = usePDFExport();
  const { resetChangeState } = useFileChangeDetection(currentFile);

  // Parse sections from rendered HTML
  const sections: Section[] = useMemo(() => {
    if (!renderedHtml) return [];
    return parseSectionsFromHTML(renderedHtml);
  }, [renderedHtml]);

  const outline: OutlineEntry[] = useMemo(() => extractOutline(sections), [sections]);

  // Set initial active outline when outline changes
  useEffect(() => {
    if (outline.length > 0 && (!activeOutlineId || !outline.find(o => o.id === activeOutlineId))) {
      setActiveOutlineId(outline[0]?.id ?? null);
    }
  }, [outline, activeOutlineId]);

  const stageTokens = useMemo(() => getStageTokens(presTheme), [presTheme]);
  const surroundTokens = useMemo(() => getSurroundTokens(presTheme), [presTheme]);

  // Breadcrumb from file path
  const breadcrumb = useMemo(() => {
    if (!currentFile) return '';
    if (currentFile.path.startsWith('@opened/')) {
      return t('sidebar.openedFiles');
    }
    const parts = currentFile.path.split('/');
    parts.pop();
    return parts.join(' / ') || folderName || 'Document Store';
  }, [currentFile, folderName, t]);

  // Document title (first h1)
  const documentTitle = useMemo(() => {
    if (sections.length === 0) return '';
    const first = sections.find(s => s.level === 1);
    return first?.title || sections[0]?.title || '';
  }, [sections]);

  // Presentation config
  const presConfig = usePresentationConfig();

  // Author from frontmatter
  const author = useMemo(() => {
    const content = currentFile?.content;
    if (!content) return '';
    const fm = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
    if (!fm) return '';
    const authorLine = (fm[1] ?? '')
      .split(/\r?\n/)
      .find(l => /^author\s*:/i.test(l));
    if (!authorLine) return '';
    return authorLine
      .replace(/^author\s*:/i, '')
      .trim()
      .replace(/^["']|["']$/g, '');
  }, [currentFile]);

  // Stats with sections count
  const headerStats = useMemo(() => {
    if (!stats) return null;
    return { ...stats, sections: sections.length };
  }, [stats, sections]);

  // Current section title for present menu
  const currentSectionTitle = useMemo(() => {
    if (!activeOutlineId || outline.length === 0) return '';
    const entry = outline.find(o => o.id === activeOutlineId);
    return entry?.label || outline[0]?.label || '';
  }, [activeOutlineId, outline]);

  // Included sections count (total minus skipped)
  const includedSections = sections.length - skipped.length;

  // Event handlers
  const handleFileSelect = useCallback((file: any) => {
    loadFile(file);
    saveCurrentFile(file.path);
  }, [loadFile, saveCurrentFile]);

  const handleCollapseAll = useCallback(() => {
    saveExpandedFolders([]);
  }, [saveExpandedFolders]);

  const handleExpandAll = useCallback(() => {
    const allPaths: string[] = [];
    const collect = (nodes: any[]) => {
      for (const n of nodes) {
        if (n.type === 'directory') {
          allPaths.push(n.path);
          if (n.children) collect(n.children);
        }
      }
    };
    collect(directoryTree);
    saveExpandedFolders(allPaths);
  }, [directoryTree, saveExpandedFolders]);

  const handleInternalLinkClick = useCallback((container: HTMLElement) => {
    const allFilesMap = new Map(allFiles.map(file => [file.path, file]));
    processInternalLinks(container, allFilesMap, handleFileSelect);
  }, [processInternalLinks, allFiles, handleFileSelect]);

  const handleMermaidProcess = useCallback((container: HTMLElement) => {
    if (!settings.diagrams.enableMermaid) return;
    processMermaidDiagrams(container);
  }, [processMermaidDiagrams, settings.diagrams.enableMermaid]);

  const handlePlantUMLProcess = useCallback(async (container: HTMLElement) => {
    if (!settings.diagrams.enablePlantUML) return;
    await processPlantUMLDiagrams(container);
  }, [processPlantUMLDiagrams, settings.diagrams.enablePlantUML]);

  const handlePDFExport = useCallback(async (options: PDFExportOptions) => {
    if (!currentFile) return;
    const contentElement = document.querySelector('.markdown-content') as HTMLElement;
    if (!contentElement) throw new Error('Content element not found');
    await exportToPDF(contentElement, currentFile, options);
  }, [currentFile, exportToPDF]);

  const handleShowPDFExport = useCallback(() => {
    if (currentFile) setShowPDFExport(true);
  }, [currentFile]);

  const handleRefresh = useCallback(async () => {
    if (currentFile) {
      await loadFile(currentFile, true);
      resetChangeState();
    }
  }, [currentFile, loadFile, resetChangeState]);

  const handleToggleTheme = useCallback(() => {
    updateAppearanceSettings({ theme: isDark ? 'light' : 'dark' });
  }, [isDark, updateAppearanceSettings]);

  // Opened files handlers
  const handleOpenFiles = useCallback(async () => {
    try {
      const files = await FileSystemService.pickFiles();
      if (files.length === 0) return;
      const { added, names, entries: newEntries } = addOpenedFiles(files);
      if (added === 1) {
        setToast(t('ui.addedToOpened', { name: names[0] }));
      } else if (added > 1) {
        setToast(t('ui.addedMultipleToOpened', { count: added }));
      }
      // Select the first newly added file
      const firstNew = newEntries[0];
      if (firstNew) {
        handleFileSelect(firstNew.file);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Failed to open files:', e);
      }
    }
  }, [addOpenedFiles, handleFileSelect, t]);

  const handleRemoveOpenedFile = useCallback((id: string) => {
    const selectNextId = removeOpenedFile(id, currentFile);
    if (selectNextId) {
      const nextFile = getOpenedFileById(selectNextId);
      if (nextFile) handleFileSelect(nextFile);
    }
  }, [removeOpenedFile, currentFile, getOpenedFileById, handleFileSelect]);

  const handleClearOpenedFiles = useCallback(() => {
    clearOpenedFiles();
  }, [clearOpenedFiles]);

  const handleRequestPermission = useCallback(async (id: string) => {
    const file = await requestPermission(id);
    if (file) handleFileSelect(file);
  }, [requestPermission, handleFileSelect]);

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes('Files')) return;
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const mdFiles = await FileSystemService.processDroppedFiles(droppedFiles);
    if (mdFiles.length === 0) {
      setToast(t('ui.onlyMarkdownFiles'));
      return;
    }

    const { added, names, entries: newEntries } = addOpenedFiles(mdFiles);
    if (added === 1) {
      setToast(t('ui.addedToOpened', { name: names[0] }));
    } else if (added > 1) {
      setToast(t('ui.addedMultipleToOpened', { count: added }));
    }
    const firstNew = newEntries[0];
    if (firstNew) {
      handleFileSelect(firstNew.file);
    }
  }, [addOpenedFiles, handleFileSelect, t]);

  // Zoom
  const zoomIn = useCallback(() => setZoom(z => Math.min(z + 10, 200)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 10, 50)), []);
  const zoomReset = useCallback(() => setZoom(100), []);

  // Outline click: scroll to heading
  const handleOutlineClick = useCallback((id: string) => {
    setActiveOutlineId(id);
    const idx = outline.findIndex(o => o.id === id);
    if (idx < 0) return;
    const root = document.querySelector('.markdown-content');
    if (!root) return;
    const headings = root.querySelectorAll('h1, h2, h3');
    const target = headings[idx] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [outline]);

  // Presentation
  const startPresent = useCallback((fromIndex = 0) => {
    setPresIndex(fromIndex);
    setPresenting(true);
    try {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch { /* fullscreen API unavailable */ }
  }, []);

  const stopPresent = useCallback(() => {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    } catch { /* fullscreen API unavailable */ }
    setPresenting(false);
    clearStage();
  }, [clearStage]);

  const handleToggleSkip = useCallback((i: number) => {
    setSkipped(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }, []);

  // Present from current outline section
  const handlePresentFromCurrent = useCallback(() => {
    if (!activeOutlineId || outline.length === 0) {
      startPresent(0);
      return;
    }
    const idx = outline.findIndex(o => o.id === activeOutlineId);
    startPresent(idx >= 0 ? idx : 0);
  }, [activeOutlineId, outline, startPresent]);

  const handleDocMouseUp = useCallback((x: number, y: number) => {
    setTimeout(() => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const el = document.querySelector('.markdown-content') as HTMLElement;
        if (!el) return;
        addMark(el);
      } else {
        removeMarkAtPoint(x, y);
      }
    }, 10);
  }, [addMark, removeMarkAtPoint]);

  // Keyboard shortcuts
  const shortcuts = createDefaultShortcuts({
    toggleSidebar: () => {},
    toggleFocusMode: () => {},
    exitFocusMode: () => {},
    selectDirectory,
    openFiles: handleOpenFiles,
    collapseAll: handleCollapseAll,
    showHelp: () => setShowShortcutsHelp(true),
    exportPDF: handleShowPDFExport,
    refresh: handleRefresh,
    showSettings: () => setShowSettings(true),
    zoomIn,
    zoomOut,
    zoomReset
  });

  const { formatShortcut } = useKeyboardShortcuts({ shortcuts, enabled: !presenting && settings.keyboard.enableShortcuts });

  // Set data-theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', getEffectiveTheme());
  }, [getEffectiveTheme]);

  // Cleanup
  useEffect(() => {
    return () => { MarkdownService.cleanup(); };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <Box
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            display: 'flex',
            height: '100vh',
            overflow: 'hidden',
            background: tokens.canvas,
            color: tokens.fg1,
            fontFamily: "'Noto Sans', Arial, sans-serif",
            WebkitFontSmoothing: 'antialiased',
            '& *, & *::before, & *::after': { boxSizing: 'border-box' },
            position: 'relative',
          }}>
          {/* Drag & drop overlay */}
          {dragOver && (
            <Box sx={{
              position: 'absolute', inset: 8, zIndex: 100,
              border: `2px dashed ${BRAND.ACCENT}`,
              background: `rgba(2, 132, 199, 0.06)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}>
              <Box sx={{
                background: tokens.chrome, border: `1px solid ${tokens.border}`,
                boxShadow: '0 8px 24px rgba(17,24,39,.12)',
                px: 3, py: 1.5, fontSize: 15, fontWeight: 600,
                color: tokens.selFg,
              }}>
                {t('ui.dropToAdd')}
              </Box>
            </Box>
          )}
          {/* Sidebar */}
          <Sidebar
            tokens={tokens}
            isDark={isDark}
            width={sidebarWidth}
            folderName={folderName}
            onSelectDirectory={selectDirectory}
            onOpenFiles={handleOpenFiles}
            directoryTree={directoryTree}
            selectedFile={currentFile}
            expandedFolders={expandedFolders}
            loading={fileLoading}
            onFileSelect={handleFileSelect}
            onExpandedChange={saveExpandedFolders}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
            openedEntries={openedEntries}
            openedSectionOpen={openedSectionOpen}
            onToggleOpenedSection={() => setOpenedSectionOpen(o => !o)}
            onRemoveOpenedFile={handleRemoveOpenedFile}
            onClearOpenedFiles={handleClearOpenedFiles}
            onRequestPermission={handleRequestPermission}
            outline={outline}
            activeOutlineId={activeOutlineId}
            onOutlineClick={handleOutlineClick}
            onPresentFromSection={startPresent}
            onToggleTheme={handleToggleTheme}
            onShowShortcuts={() => setShowShortcutsHelp(true)}
            onShowSettings={() => setShowSettings(true)}
            onShowAbout={() => setShowAbout(true)}
            filesSectionOpen={filesSectionOpen}
            outlineSectionOpen={outlineSectionOpen}
            onToggleFilesSection={() => setFilesSectionOpen(o => !o)}
            onToggleOutlineSection={() => setOutlineSectionOpen(o => !o)}
            sortDescending={sortDescending}
            onSortChange={setSortDescending}
          />

          {/* Sidebar resize handle */}
          <Box
            onMouseDown={handleSidebarResizeMouseDown}
            sx={{
              width: 5, flexShrink: 0, cursor: 'col-resize',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', zIndex: 17,
              '&:hover': { background: tokens.hover },
            }}
          />

          {/* Main column */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <Toolbar
              tokens={tokens}
              fileName={currentFile?.name || ''}
              breadcrumb={breadcrumb}
              stats={headerStats}
              hasCurrentFile={!!currentFile}
              view={view}
              onViewChange={setView}
              zoom={zoom}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onZoomReset={zoomReset}
              docWidth={docWidth}
              onDocWidthChange={setDocWidth}
              docPointer={docPointer}
              onToggleDocPointer={() => setDocPointer(p => !p)}
              markCount={markCount}
              onClearMarks={clearMarks}
              onReload={handleRefresh}
              onExportPDF={handleShowPDFExport}
              onPresentFromStart={() => startPresent(0)}
              onPresentFromCurrent={handlePresentFromCurrent}
              onChooseSections={() => setView('slides')}
              includedSections={includedSections}
              totalSections={sections.length}
              currentSectionTitle={currentSectionTitle}
            />

            {/* Document or Sections view */}
            {view === 'doc' ? (
              <MarkdownViewer
                file={currentFile}
                content={renderedHtml}
                loading={markdownLoading}
                error={markdownError || fileError}
                tokens={tokens}
                isDark={isDark}
                zoom={zoom}
                docWidth={docWidth}
                docPointer={docPointer}
                wordWrap={settings.appearance.wordWrap}
                outline={outline}
                onInternalLinkClick={handleInternalLinkClick}
                onMermaidProcess={handleMermaidProcess}
                onPlantUMLProcess={handlePlantUMLProcess}
                onDocMouseUp={handleDocMouseUp}
              />
            ) : (
              <SectionsView
                tokens={tokens}
                sections={sections}
                skipped={skipped}
                onToggleSkip={handleToggleSkip}
                onPresentFrom={startPresent}
              />
            )}
          </Box>

          {/* Presentation mode overlay */}
          {presenting && (
            <PresentationMode
              sections={sections}
              presIndex={presIndex}
              onPresIndexChange={setPresIndex}
              pointer={presPointer}
              onTogglePointer={() => setPresPointer(p => !p)}
              presTheme={presTheme}
              onTogglePresTheme={() => setPresTheme(t => t === 'dark' ? 'light' : 'dark')}
              onStop={stopPresent}
              pc={stageTokens}
              surround={surroundTokens}
              fileName={currentFile?.name || ''}
              documentTitle={documentTitle}
              skipped={skipped}
              headerTemplate={presConfig.header}
              footerTemplate={presConfig.footer}
              presDefaults={presConfig.defaults}
              author={author}
              onReanchorMarks={reanchorStage}
              onRemoveMarkAtPoint={removeMarkAtPoint}
              onMermaidProcess={handleMermaidProcess}
              onPlantUMLProcess={handlePlantUMLProcess}
            />
          )}

          {/* Pointers */}
          {presenting && <Pointer active={presPointer} zIndex={60} />}
          {!presenting && <Pointer active={docPointer} zIndex={40} />}

          {/* Dialogs */}
          <KeyboardShortcutsHelp
            open={showShortcutsHelp}
            onClose={() => setShowShortcutsHelp(false)}
            shortcuts={shortcuts}
            formatShortcut={formatShortcut}
          />

          <PDFExportDialog
            open={showPDFExport}
            onClose={() => setShowPDFExport(false)}
            onExport={handlePDFExport}
            defaultFilename={currentFile ? generateDefaultFilename(currentFile) : 'document.pdf'}
            defaultFormat={settings.export.defaultFormat}
            defaultOrientation={settings.export.defaultOrientation}
          />

          <SettingsDialog
            open={showSettings}
            onClose={() => setShowSettings(false)}
            settings={settings}
            onUpdateSettings={() => {}}
            onUpdateAppearanceSettings={updateAppearanceSettings}
            onUpdateBehaviorSettings={updateBehaviorSettings}
            onUpdateDiagramSettings={updateDiagramSettings}
            onUpdateExportSettings={updateExportSettings}
            onUpdateKeyboardSettings={updateKeyboardSettings}
            onUpdatePerformanceSettings={updatePerformanceSettings}
            onResetSettings={resetSettings}
            onExportSettings={exportSettings}
            onImportSettings={importSettings}
          />

          <AboutDialog
            open={showAbout}
            onClose={() => setShowAbout(false)}
          />

          {/* Toast notifications */}
          <Snackbar
            open={!!toast}
            autoHideDuration={3000}
            onClose={() => setToast(null)}
            message={toast}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          />
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
