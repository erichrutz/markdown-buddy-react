import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  FolderOpen,
  Folder,
  Description,
  Sort,
  UnfoldLess,
  Code,
  Search,
} from '@mui/icons-material';
import { DirectoryNode, MarkdownFile } from '../types';
import { SurfaceTokens, BRAND } from '../theme/designTokens';
import { VSCodeService } from '../services/vscodeService';
import { useResizableWidth } from '../hooks/useResizableWidth';

interface FileTreeProps {
  directoryTree: DirectoryNode[];
  selectedFile: MarkdownFile | null;
  expandedFolders: string[];
  loading?: boolean;
  tokens: SurfaceTokens;
  onFileSelect: (file: MarkdownFile) => void;
  onExpandedChange: (expandedIds: string[]) => void;
  onCollapseAll: () => void;
}

function countFiles(nodes: DirectoryNode[]): number {
  return nodes.reduce(
    (a, n) => a + (n.type === 'file' ? 1 : countFiles(n.children || [])),
    0,
  );
}

function filterNodes(nodes: DirectoryNode[], query: string): DirectoryNode[] {
  const q = query.toLowerCase();
  return nodes.reduce<DirectoryNode[]>((out, node) => {
    const nameMatch = node.name.toLowerCase().includes(q);
    if (node.type === 'file') {
      if (nameMatch) out.push(node);
    } else {
      const filteredChildren = filterNodes(node.children || [], query);
      if (filteredChildren.length > 0 || nameMatch) {
        out.push({ ...node, children: filteredChildren });
      }
    }
    return out;
  }, []);
}

export const FileTree: React.FC<FileTreeProps> = ({
  directoryTree,
  selectedFile,
  expandedFolders,
  loading = false,
  tokens,
  onFileSelect,
  onExpandedChange,
  onCollapseAll,
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const { width, onMouseDown } = useResizableWidth(288, 220, 520, 'right');

  const visibleNodes = useMemo(() => {
    const nodes = filter.trim() ? filterNodes(directoryTree, filter.trim()) : directoryTree;
    return nodes;
  }, [directoryTree, filter]);

  const totalFiles = useMemo(() => countFiles(directoryTree), [directoryTree]);

  const handleVSCodeOpen = () => {
    if (selectedFile) VSCodeService.openInVSCode(selectedFile.path);
  };

  const renderNode = (node: DirectoryNode, level: number) => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedFolders.includes(node.path);
    const isSelected = selectedFile?.path === node.path;

    const padLeft = level * 14 + 9;

    const activate = () => {
      if (isDir) {
        onExpandedChange(
          isExpanded
            ? expandedFolders.filter((id) => id !== node.path)
            : [...expandedFolders, node.path],
        );
      } else if (node.file) {
        onFileSelect(node.file);
      }
    };

    return (
      <React.Fragment key={node.path}>
        <Box
          role="treeitem"
          tabIndex={0}
          aria-level={level + 1}
          aria-expanded={isDir ? isExpanded : undefined}
          aria-selected={isSelected}
          onClick={activate}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              activate();
            }
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: 30,
            pr: '12px',
            pl: `${padLeft}px`,
            cursor: 'pointer',
            fontSize: 15,
            borderLeft: `3px solid ${isSelected ? BRAND.ACCENT : 'transparent'}`,
            background: isSelected ? tokens.selBg : 'transparent',
            color: isSelected ? tokens.selFg : tokens.fg1,
            fontWeight: isSelected ? 600 : 400,
            '&:hover': { background: tokens.hover },
            '&:focus-visible': { outline: `2px solid ${BRAND.ACCENT}`, outlineOffset: '-2px' },
          }}
        >
          {/* Chevron */}
          <Box sx={{ fontSize: 15, flexShrink: 0, color: tokens.fg3, display: 'flex', alignItems: 'center', width: 15 }}>
            {isDir ? (isExpanded ? <ExpandMore sx={{ fontSize: 15 }} /> : <ChevronRight sx={{ fontSize: 15 }} />) : null}
          </Box>

          {/* Type icon */}
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: isSelected ? BRAND.ACCENT : isDir ? tokens.folder : tokens.file }}>
            {isDir ? (
              isExpanded ? <FolderOpen sx={{ fontSize: 16 }} /> : <Folder sx={{ fontSize: 16 }} />
            ) : (
              <Description sx={{ fontSize: 16 }} />
            )}
          </Box>

          {/* Name */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {node.name}
          </Box>
        </Box>

        {/* Children */}
        {isDir && isExpanded && node.children?.map((child) => renderNode(child, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: tokens.chrome,
        borderRight: `1px solid ${tokens.border}`,
        height: '100%',
      }}
    >
      {/* Resize handle */}
      <Box
        onMouseDown={onMouseDown}
        sx={{
          position: 'absolute',
          top: 0,
          right: -3,
          width: 6,
          height: '100%',
          cursor: 'col-resize',
          zIndex: 1,
          '&:hover': { background: BRAND.ACCENT },
        }}
      />
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 8px 10px 20px',
        }}
      >
        <Box
          sx={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.09em',
            textTransform: 'uppercase',
            color: tokens.fg3,
          }}
        >
          {t('ui.markdownFiles')}
        </Box>
        <Box sx={{ display: 'flex' }}>
          {[
            { icon: <Sort sx={{ fontSize: 17 }} />, title: t('tree.sort') },
            { icon: <UnfoldLess sx={{ fontSize: 17 }} />, title: t('ui.collapseAll'), onClick: onCollapseAll },
            { icon: <Code sx={{ fontSize: 17 }} />, title: t('ui.openInVSCode'), onClick: handleVSCodeOpen },
          ].map((btn, i) => (
            <Box
              key={i}
              component="button"
              type="button"
              title={btn.title}
              onClick={btn.onClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                background: 'transparent',
                border: 0,
                cursor: 'pointer',
                color: tokens.fg3,
                '&:hover': { background: tokens.hover, color: tokens.fg1 },
              }}
            >
              {btn.icon}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Filter field */}
      <Box sx={{ px: '16px', pb: '12px' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: 32,
            px: '10px',
            border: `1px solid ${tokens.border}`,
            background: tokens.field,
          }}
        >
          <Search sx={{ fontSize: 16, color: tokens.fg3 }} />
          <Box
            component="input"
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
            placeholder="Nach Dateien suchen…"
            sx={{
              flex: 1,
              minWidth: 0,
              border: 0,
              outline: 'none',
              background: 'transparent',
              font: "400 13px 'Noto Sans', Arial, sans-serif",
              color: tokens.fg1,
              '&::placeholder': { color: tokens.fg3 },
            }}
          />
        </Box>
      </Box>

      {/* Tree */}
      <Box role="tree" aria-label={t('ui.markdownFiles')} sx={{ flex: 1, overflow: 'auto', pb: '12px' }}>
        {loading ? (
          <Box sx={{ p: 3, textAlign: 'center', color: tokens.fg3, fontSize: 13 }}>{t('tree.loading')}</Box>
        ) : (
          visibleNodes.map((node) => renderNode(node, node.type === 'directory' && !node.path.includes('/') ? 0 : 0))
        )}
      </Box>

      {/* Footer */}
      <Box
        sx={{
          flexShrink: 0,
          padding: '10px 20px',
          borderTop: `1px solid ${tokens.border}`,
          fontSize: 11,
          color: tokens.fg3,
        }}
      >
        {totalFiles} Markdown-Dateien
      </Box>
    </Box>
  );
};
