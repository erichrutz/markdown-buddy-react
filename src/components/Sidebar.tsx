import React, { useState, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Menu, MenuItem, Divider } from '@mui/material';
import {
  FolderOpen,
  Folder,
  ExpandMore,
  ChevronRight,
  Description,
  Search,
  Sort,
  UnfoldMore,
  UnfoldLess,
  PlayArrow,
  DarkMode,
  LightMode,
  Keyboard,
  Settings,
  InfoOutlined,
  LibraryBooks,
  Close,
} from '@mui/icons-material';
import { DirectoryNode, MarkdownFile } from '../types';
import { OpenedFileEntry } from '../services/fileSystemService';
import { OutlineEntry } from '../utils/sectionParser';
import { SurfaceTokens, BRAND } from '../theme/designTokens';
import { PRODUCT_NAME, isDBBrand } from '../theme/brand';
import defaultLogo from '../img/logo.svg';

const appLogo = isDBBrand ? `${import.meta.env.BASE_URL}img/DB_logo_red_100px_rgb.svg` : defaultLogo;

const TRANSITION = 'background 180ms cubic-bezier(.4,0,.2,1), color 180ms cubic-bezier(.4,0,.2,1)';
const MENU_SHADOW = '0 8px 24px rgba(17,24,39,.12)';

interface SidebarProps {
  tokens: SurfaceTokens;
  isDark: boolean;
  width: number;
  // Folder
  folderName?: string | null;
  onSelectDirectory: () => void;
  onOpenFiles: () => void;
  // Files
  directoryTree: DirectoryNode[];
  selectedFile: MarkdownFile | null;
  expandedFolders: string[];
  loading?: boolean;
  onFileSelect: (file: MarkdownFile) => void;
  onExpandedChange: (expandedIds: string[]) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  // Opened files
  openedEntries: OpenedFileEntry[];
  openedSectionOpen: boolean;
  onToggleOpenedSection: () => void;
  onRemoveOpenedFile: (id: string) => void;
  onClearOpenedFiles: () => void;
  onRequestPermission: (id: string) => void;
  // Outline
  outline: OutlineEntry[];
  activeOutlineId: string | null;
  onOutlineClick: (id: string) => void;
  onPresentFromSection: (sectionIndex: number) => void;
  // Utility
  onToggleTheme: () => void;
  onShowShortcuts: () => void;
  onShowSettings: () => void;
  onShowAbout: () => void;
  // Section open states
  filesSectionOpen: boolean;
  outlineSectionOpen: boolean;
  onToggleFilesSection: () => void;
  onToggleOutlineSection: () => void;
  // Sort
  sortDescending: boolean;
  onSortChange: (desc: boolean) => void;
}

// ---------------------------------------------------------------------------
// File tree helpers
// ---------------------------------------------------------------------------

function countFiles(nodes: DirectoryNode[]): number {
  return nodes.reduce((a, n) => a + (n.type === 'file' ? 1 : countFiles(n.children || [])), 0);
}

function filterNodes(nodes: DirectoryNode[], query: string): DirectoryNode[] {
  const q = query.toLowerCase();
  return nodes.reduce<DirectoryNode[]>((out, node) => {
    const nameMatch = node.name.toLowerCase().includes(q);
    if (node.type === 'file') {
      if (nameMatch) out.push(node);
    } else {
      const filteredChildren = filterNodes(node.children || [], query);
      if (filteredChildren.length > 0 || nameMatch) out.push({ ...node, children: filteredChildren });
    }
    return out;
  }, []);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const IconBtn: React.FC<{
  icon: React.ReactNode;
  title: string;
  tokens: SurfaceTokens;
  onClick?: React.MouseEventHandler<HTMLButtonElement> | (() => void);
  size?: number;
}> = ({ icon, title, tokens, onClick, size = 28 }) => (
  <Box
    component="button"
    type="button"
    title={title}
    onClick={onClick}
    sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, border: 0, background: 'transparent',
      color: tokens.fg2, cursor: 'pointer', transition: TRANSITION, flexShrink: 0,
      '&:hover': { background: tokens.hover, color: tokens.fg1 },
    }}
  >
    {icon}
  </Box>
);

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export const Sidebar: React.FC<SidebarProps> = ({
  tokens, isDark, width, folderName, onSelectDirectory, onOpenFiles,
  directoryTree, selectedFile, expandedFolders, loading,
  onFileSelect, onExpandedChange, onCollapseAll, onExpandAll,
  openedEntries, openedSectionOpen, onToggleOpenedSection,
  onRemoveOpenedFile, onClearOpenedFiles, onRequestPermission,
  outline, activeOutlineId, onOutlineClick, onPresentFromSection,
  onToggleTheme, onShowShortcuts, onShowSettings, onShowAbout,
  filesSectionOpen, outlineSectionOpen, onToggleFilesSection, onToggleOutlineSection,
  sortDescending, onSortChange,
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [folderMenuAnchor, setFolderMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // --- Files / Outline split drag ---
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState(0.5); // fraction of space for files
  const splitDragging = useRef(false);

  const handleSplitMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    splitDragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!splitDragging.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const ratio = (ev.clientY - rect.top) / rect.height;
      setSplitRatio(Math.max(0.15, Math.min(0.85, ratio)));
    };
    const onUp = () => {
      splitDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const totalFiles = useMemo(() => countFiles(directoryTree) + openedEntries.length, [directoryTree, openedEntries]);
  const visibleNodes = useMemo(() => {
    return filter.trim() ? filterNodes(directoryTree, filter.trim()) : directoryTree;
  }, [directoryTree, filter]);

  const filteredOpenedEntries = useMemo(() => {
    if (!filter.trim()) return openedEntries;
    const q = filter.toLowerCase();
    return openedEntries.filter(e => e.file.name.toLowerCase().includes(q));
  }, [openedEntries, filter]);

  // Detect name clashes between opened files and folder files for disambiguation
  const nameClashMap = useMemo(() => {
    const allNames: string[] = [];
    // Collect names from folder tree
    const collectNames = (nodes: DirectoryNode[]) => {
      for (const n of nodes) {
        if (n.type === 'file') allNames.push(n.name);
        else if (n.children) collectNames(n.children);
      }
    };
    collectNames(directoryTree);
    // Collect names from opened entries
    for (const e of openedEntries) allNames.push(e.file.name);

    // Find duplicates
    const counts = new Map<string, number>();
    for (const name of allNames) {
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return counts;
  }, [directoryTree, openedEntries]);

  const hasFolderOpen = !!folderName;
  const hasOpenedFiles = openedEntries.length > 0;
  const showFilesSection = hasFolderOpen || hasOpenedFiles;
  const showOutline = !!selectedFile;

  // --- File tree row renderer ---
  const renderNode = (node: DirectoryNode, level: number) => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedFolders.includes(node.path);
    const isSelected = selectedFile?.path === node.path;
    // Folders show chevron+icon, files only icon — add 24px for files to align with folder content
    const padLeft = isDir ? (12 + level * 20) : (12 + level * 20 + 24);

    const activate = () => {
      if (isDir) {
        onExpandedChange(
          isExpanded ? expandedFolders.filter(id => id !== node.path) : [...expandedFolders, node.path],
        );
      } else if (node.file) {
        onFileSelect(node.file);
      }
    };

    return (
      <React.Fragment key={node.path}>
        <Box
          onClick={activate}
          sx={{
            display: 'flex', alignItems: 'center', gap: '8px',
            height: 28, fontSize: 13, pl: `${padLeft}px`, pr: '12px',
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: isSelected ? `inset 3px 0 0 ${BRAND.ACCENT}` : 'none',
            background: isSelected ? tokens.selBg : 'transparent',
            color: isSelected ? tokens.selFg : tokens.fg1,
            fontWeight: isSelected ? 600 : 400,
            transition: TRANSITION,
            '&:hover': { background: isSelected ? tokens.selBg : tokens.hover },
          }}
        >
          {isDir && (
            <ChevronRight sx={{ fontSize: 16, color: tokens.fg3, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }} />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', color: isSelected ? BRAND.ACCENT : isDir ? tokens.folder : tokens.file, flexShrink: 0 }}>
            {isDir ? <Folder sx={{ fontSize: 16 }} /> : <Description sx={{ fontSize: 15 }} />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.name}</Box>
        </Box>
        {isDir && isExpanded && node.children?.map(child => renderNode(child, level + 1))}
      </React.Fragment>
    );
  };

  // --- Section toggle header ---
  const SectionHeader: React.FC<{
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    rightContent?: React.ReactNode;
    borderTop?: boolean;
  }> = ({ label, isOpen, onToggle, rightContent, borderTop }) => (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: '2px',
      padding: '10px 12px 6px 20px',
      ...(borderTop ? { borderTop: `1px solid ${tokens.border}` } : {}),
    }}>
      <Box
        component="button" type="button" onClick={onToggle}
        sx={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '4px',
          padding: 0, border: 0, background: 'transparent',
          fontSize: 11, fontWeight: 600, letterSpacing: '.1em', color: tokens.fg2,
          fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <ChevronRight sx={{ fontSize: 14, color: tokens.fg3, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }} />
        {label}
      </Box>
      {rightContent}
    </Box>
  );

  return (
    <Box sx={{
      width, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: `1px solid ${tokens.border}`, background: tokens.chrome,
      height: '100%', position: 'relative', zIndex: 16,
    }}>

      {/* ===== Brand row ===== */}
      <Box sx={{
        height: 56, flexShrink: 0, display: 'flex', alignItems: 'center',
        gap: '12px', px: '20px', borderBottom: `1px solid ${tokens.border}`,
      }}>
        <img src={appLogo} alt={PRODUCT_NAME} style={{ height: 24, width: 'auto', display: 'block', flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: tokens.fg1, whiteSpace: 'nowrap' }}>
          {PRODUCT_NAME}
        </span>
      </Box>

      {/* ===== Folder block ===== */}
      <Box sx={{ padding: '12px 12px 4px', position: 'relative' }}>
        <Box
          component="button" type="button"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => setFolderMenuAnchor(e.currentTarget)}
          sx={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', border: `1px solid ${tokens.border}`,
            background: tokens.chrome, fontFamily: 'inherit', cursor: 'pointer',
            textAlign: 'left', transition: TRANSITION,
            '&:hover': { background: tokens.hover },
          }}
        >
          <FolderOpen sx={{ fontSize: 20, color: tokens.fg2, flexShrink: 0 }} />
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: tokens.fg1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {folderName || t('header.openFolder')}
            </span>
            <span style={{ fontSize: 11, color: tokens.fg2 }}>
              {t('sidebar.changeFolder')} · ⌘O
            </span>
          </Box>
          <ExpandMore sx={{ fontSize: 16, color: tokens.fg3, flexShrink: 0 }} />
        </Box>
        <Menu
          anchorEl={folderMenuAnchor}
          open={!!folderMenuAnchor}
          onClose={() => setFolderMenuAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                width: 276, borderRadius: 0, border: `1px solid ${tokens.border}`,
                boxShadow: MENU_SHADOW, mt: '2px',
              },
            },
          }}
        >
          <MenuItem
            onClick={() => { setFolderMenuAnchor(null); onSelectDirectory(); }}
            sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, py: '8px', px: '14px' }}
          >
            <span>{t('sidebar.openFolderAction')}</span>
            <span style={{ fontSize: 11, color: tokens.fg3 }}>⌘O</span>
          </MenuItem>
          <MenuItem
            onClick={() => { setFolderMenuAnchor(null); onOpenFiles(); }}
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: 13, py: '8px', px: '14px' }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{t('sidebar.openFilesAction')}</span>
              <span style={{ fontSize: 11, color: tokens.fg3 }}>⌘⇧O</span>
            </Box>
            <span style={{ fontSize: 11, color: tokens.fg3 }}>{t('sidebar.openFilesHint')}</span>
          </MenuItem>
          {hasFolderOpen && <Divider sx={{ my: '6px !important' }} />}
          {hasFolderOpen && (
            <Box sx={{ padding: '6px 14px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '.08em', color: tokens.fg3 }}>
              {t('sidebar.recent')}
            </Box>
          )}
          {hasFolderOpen && (
            <MenuItem sx={{ fontSize: 13, py: '8px', px: '14px', display: 'flex', justifyContent: 'space-between' }}>
              <span>{folderName}</span>
              <span style={{ color: BRAND.ACCENT, fontSize: 12 }}>✓</span>
            </MenuItem>
          )}
        </Menu>
      </Box>

      {/* ===== Main flex area: FILES + OUTLINE ===== */}
      {!showFilesSection && <Box sx={{ flex: 1 }} />}
      {showFilesSection && (
        <Box ref={splitContainerRef} sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>

          {/* --- FILES pane --- */}
          <Box sx={{
            flex: showOutline ? `0 0 ${splitRatio * 100}%` : 1,
            minHeight: 60, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}>
            {/* FILES section header */}
            <SectionHeader
              label={t('sidebar.files')}
              isOpen={filesSectionOpen}
              onToggle={onToggleFilesSection}
              rightContent={hasFolderOpen ? <>
                <Box sx={{ position: 'relative' }}>
                  <IconBtn
                    icon={<Sort sx={{ fontSize: 16 }} />}
                    title={t('sidebar.sortTooltip', { order: sortDescending ? 'Z–A' : 'A–Z' })}
                    tokens={tokens}
                    onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                  />
                  <Menu
                    anchorEl={sortMenuAnchor}
                    open={!!sortMenuAnchor}
                    onClose={() => setSortMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    slotProps={{ paper: { sx: { width: 180, borderRadius: 0, border: `1px solid ${tokens.border}`, boxShadow: MENU_SHADOW } } }}
                  >
                    <MenuItem onClick={() => { onSortChange(false); setSortMenuAnchor(null); }} sx={{ fontSize: 13 }}>{t('sidebar.sortAZ')}</MenuItem>
                    <MenuItem onClick={() => { onSortChange(true); setSortMenuAnchor(null); }} sx={{ fontSize: 13 }}>{t('sidebar.sortZA')}</MenuItem>
                  </Menu>
                </Box>
                <IconBtn icon={<UnfoldMore sx={{ fontSize: 16 }} />} title={t('sidebar.expandAll')} tokens={tokens} onClick={onExpandAll} />
                <IconBtn icon={<UnfoldLess sx={{ fontSize: 16 }} />} title={t('sidebar.collapseAll')} tokens={tokens} onClick={onCollapseAll} />
              </> : undefined}
            />

            {/* FILES content */}
            {filesSectionOpen && <>
              {/* Filter field */}
              {totalFiles > 0 && (
                <Box sx={{ px: '12px', pb: '6px' }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    height: 32, px: '10px', background: tokens.hover,
                  }}>
                    <Search sx={{ fontSize: 15, color: tokens.fg3 }} />
                    <Box
                      component="input"
                      value={filter}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
                      placeholder={t('sidebar.filterFiles', { count: totalFiles })}
                      sx={{
                        flex: 1, minWidth: 0, border: 0, outline: 'none',
                        background: 'transparent', fontSize: 13, fontFamily: 'inherit',
                        color: tokens.fg1, '&::placeholder': { color: tokens.fg3 },
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* Tree */}
              <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {/* Opened files virtual group */}
                {filteredOpenedEntries.length > 0 && (
                  <>
                    {/* Opened files header row */}
                    <Box
                      onClick={onToggleOpenedSection}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        height: 28, fontSize: 13, pl: '12px', pr: '12px',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        transition: TRANSITION,
                        '&:hover': { background: tokens.hover },
                      }}
                    >
                      <ChevronRight sx={{ fontSize: 16, color: tokens.fg3, transform: openedSectionOpen ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }} />
                      <LibraryBooks sx={{ fontSize: 16, color: BRAND.ACCENT }} />
                      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontStyle: 'italic', color: tokens.fg2 }}>{t('sidebar.openedFiles')}</span>
                        <span style={{ fontSize: 12, color: tokens.fg3 }}>· {openedEntries.length}</span>
                      </Box>
                      <Box
                        component="button" type="button"
                        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onClearOpenedFiles(); }}
                        sx={{
                          border: 0, background: 'transparent', padding: '2px 6px',
                          fontSize: 11, color: tokens.fg3, cursor: 'pointer',
                          fontFamily: 'inherit', transition: TRANSITION,
                          '&:hover': { color: tokens.fg1, background: tokens.hover, border: `1px solid ${tokens.border}` },
                        }}
                      >
                        {t('sidebar.clearOpenedFiles')}
                      </Box>
                    </Box>
                    {/* Opened files children */}
                    {openedSectionOpen && filteredOpenedEntries.map(entry => {
                      const isSelected = selectedFile?.path === entry.id;
                      const dimmed = entry.needsPermission;
                      return (
                        <Box
                          key={entry.id}
                          onClick={() => {
                            if (dimmed) {
                              onRequestPermission(entry.id);
                            } else {
                              onFileSelect(entry.file);
                            }
                          }}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            height: 28, fontSize: 13, pl: '56px', pr: '6px',
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            opacity: dimmed ? 0.5 : 1,
                            boxShadow: isSelected ? `inset 3px 0 0 ${BRAND.ACCENT}` : 'none',
                            background: isSelected ? tokens.selBg : 'transparent',
                            color: isSelected ? tokens.selFg : tokens.fg1,
                            fontWeight: isSelected ? 600 : 400,
                            transition: TRANSITION,
                            '&:hover': { background: isSelected ? tokens.selBg : tokens.hover },
                            '&:hover .opened-file-remove': { opacity: 1 },
                          }}
                        >
                          <Description sx={{ fontSize: 15, color: isSelected ? BRAND.ACCENT : tokens.file, flexShrink: 0 }} />
                          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '4px', overflow: 'hidden' }}>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {entry.file.name}
                            </span>
                            {(nameClashMap.get(entry.file.name) || 0) > 1 && (
                              <span style={{ fontSize: 12, color: tokens.fg3, fontWeight: 400, flexShrink: 0 }}>
                                — {entry.parentName || 'opened'}
                              </span>
                            )}
                            {dimmed && (
                              <span style={{ fontSize: 11, color: tokens.fg3 }}>{t('sidebar.clickToReopen')}</span>
                            )}
                          </Box>
                          <Box
                            component="button" type="button"
                            className="opened-file-remove"
                            title={t('sidebar.removeOpenedFile')}
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onRemoveOpenedFile(entry.id); }}
                            sx={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 20, height: 20, border: 0, background: 'transparent',
                              color: tokens.fg3, cursor: 'pointer', opacity: 0,
                              flexShrink: 0, transition: TRANSITION,
                              '&:hover': { color: tokens.fg1, background: tokens.hover },
                            }}
                          >
                            <Close sx={{ fontSize: 13 }} />
                          </Box>
                        </Box>
                      );
                    })}
                  </>
                )}

                {loading ? (
                  <Box sx={{ p: 2, textAlign: 'center', color: tokens.fg3, fontSize: 13 }}>{t('tree.loading')}</Box>
                ) : (
                  visibleNodes.map(node => renderNode(node, 0))
                )}
              </Box>
            </>}
          </Box>

          {/* --- Draggable split handle --- */}
          {showOutline && (
            <Box
              onMouseDown={handleSplitMouseDown}
              sx={{
                height: 5, flexShrink: 0, cursor: 'row-resize',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderTop: `1px solid ${tokens.border}`,
                borderBottom: `1px solid ${tokens.border}`,
                background: tokens.chrome,
                '&:hover': { background: tokens.hover },
              }}
            >
              <Box sx={{ width: 24, height: 2, borderRadius: 1, background: tokens.fg3, opacity: 0.5 }} />
            </Box>
          )}

          {/* --- OUTLINE pane --- */}
          {showOutline && (
            <Box sx={{
              flex: 1, minHeight: 60, display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              {/* OUTLINE section header */}
              <SectionHeader
                label={t('sidebar.outline')}
                isOpen={outlineSectionOpen}
                onToggle={onToggleOutlineSection}
                rightContent={
                  <span style={{ fontSize: 11, color: tokens.fg3 }}>{t('sidebar.presentHint')}</span>
                }
              />

              {/* OUTLINE content */}
              {outlineSectionOpen && outline.length > 0 && (
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', pb: '8px' }}>
                  {outline.map((o, i) => {
                    const isActive = o.id === activeOutlineId;
                    const indent = o.level <= 2 ? 20 : 34;
                    return (
                      <Box
                        key={o.id}
                        sx={{
                          display: 'flex', alignItems: 'center', pr: '10px',
                          boxShadow: isActive ? `inset 3px 0 0 ${BRAND.ACCENT}` : 'none',
                          transition: TRANSITION,
                          '&:hover': { background: tokens.hover },
                        }}
                      >
                        <Box
                          onClick={() => onOutlineClick(o.id)}
                          sx={{
                            flex: 1, minWidth: 0, padding: `5px 0 5px ${indent}px`,
                            fontSize: 13, lineHeight: 1.35, cursor: 'pointer',
                            color: isActive ? tokens.fg1 : (o.level === 3 ? tokens.fg2 : '#374151'),
                            fontWeight: isActive ? 600 : 400,
                          }}
                        >
                          {o.label}
                        </Box>
                        <Box
                          component="button" type="button"
                          title={t('toolbar.presentFromHere')}
                          onClick={() => onPresentFromSection(i)}
                          sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 24, height: 24, flexShrink: 0,
                            border: 0, background: 'transparent',
                            color: tokens.fg3, cursor: 'pointer', transition: TRANSITION,
                            '&:hover': { color: BRAND.ACCENT, background: tokens.selBg },
                          }}
                        >
                          <PlayArrow sx={{ fontSize: 13 }} />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* ===== Utility bar ===== */}
      <Box sx={{
        display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        borderTop: `1px solid ${tokens.border}`, padding: '6px', flexShrink: 0,
      }}>
        {[
          {
            icon: isDark ? <LightMode sx={{ fontSize: 18 }} /> : <DarkMode sx={{ fontSize: 18 }} />,
            label: isDark ? t('sidebar.light') : t('sidebar.dark'),
            onClick: onToggleTheme,
          },
          { icon: <Keyboard sx={{ fontSize: 18 }} />, label: t('sidebar.shortcuts'), onClick: onShowShortcuts, title: t('shortcuts.title') + ' (?)' },
          { icon: <Settings sx={{ fontSize: 18 }} />, label: t('header.settings'), onClick: onShowSettings },
          { icon: <InfoOutlined sx={{ fontSize: 18 }} />, label: t('header.about'), onClick: onShowAbout },
        ].map((btn, i) => (
          <Box
            key={i}
            component="button" type="button"
            title={btn.title}
            onClick={btn.onClick}
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '3px', padding: '6px 0', border: 0, background: 'transparent',
              color: tokens.fg2, fontSize: 11, fontFamily: 'inherit',
              cursor: 'pointer', transition: TRANSITION,
              '&:hover': { background: tokens.hover, color: tokens.fg1 },
            }}
          >
            {btn.icon}
            <span>{btn.label}</span>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
