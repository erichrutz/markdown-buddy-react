import { useCallback, useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { createAppTheme } from './theme/theme';
import { getSurfaceTokens, getStageTokens, getSurroundTokens } from './theme/designTokens';
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
import { useKeyboardShortcuts, createDefaultShortcuts } from './hooks/useKeyboardShortcuts';
import { usePDFExport } from './hooks/usePDFExport';
import { useFileChangeDetection } from './hooks/useFileChangeDetection';
import { useTextMarker } from './hooks/useTextMarker';
import { usePresentationConfig } from './hooks/usePresentationConfig';
import { parseSectionsFromHTML, extractOutline, Section, OutlineEntry } from './utils/sectionParser';
import { PDFExportOptions } from './services/pdfExportService';
import { MarkdownService } from './services/markdownService';
import { ViewMode } from './components/Toolbar';
import './i18n/i18n';
import './styles/markdown.css';

function App() {
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
    currentFile,
    renderedHtml,
    stats,
    loading: markdownLoading,
    error: markdownError,
    loadFile,
    processInternalLinks,
    processMermaidDiagrams,
    processPlantUMLDiagrams
  } = useMarkdown(getEffectiveTheme(), allFiles, {
    openLinksInNewTab: settings.behavior.openLinksInNewTab,
    plantUMLServer: settings.diagrams.plantUMLServer,
  });

  const {
    expandedFolders,
    saveExpandedFolders,
    saveCurrentFile,
  } = useSession();

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
  const [filesSectionOpen, setFilesSectionOpen] = useState(true);
  const [outlineSectionOpen, setOutlineSectionOpen] = useState(true);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const [sortDescending, setSortDescending] = useState(false);

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
    const parts = currentFile.path.split('/');
    parts.pop();
    return parts.join(' / ') || folderName || 'Document Store';
  }, [currentFile, folderName]);

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
        <Box sx={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          background: tokens.canvas,
          color: tokens.fg1,
          fontFamily: "'Noto Sans', Arial, sans-serif",
          WebkitFontSmoothing: 'antialiased',
          '& *, & *::before, & *::after': { boxSizing: 'border-box' },
        }}>
          {/* Sidebar */}
          <Sidebar
            tokens={tokens}
            isDark={isDark}
            folderName={folderName}
            onSelectDirectory={selectDirectory}
            directoryTree={directoryTree}
            selectedFile={currentFile}
            expandedFolders={expandedFolders}
            loading={fileLoading}
            onFileSelect={handleFileSelect}
            onExpandedChange={saveExpandedFolders}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
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
        </Box>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
