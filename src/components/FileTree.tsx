import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Tooltip, 
  Collapse, 
  List, 
  ListItem, 
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import { 
  Folder, 
  FolderOpen, 
  Description,
  UnfoldLess,
  Code,
  Search,
  Clear,
  Image
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { DirectoryNode, MarkdownFile } from '../types';
import { VSCodeService } from '../services/vscodeService';

interface FileTreeProps {
  directoryTree: DirectoryNode[];
  selectedFile: MarkdownFile | null;
  expandedFolders: string[];
  onFileSelect: (file: MarkdownFile) => void;
  onExpandedChange: (expandedIds: string[]) => void;
  onCollapseAll: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  directoryTree,
  selectedFile,
  expandedFolders,
  onFileSelect,
  onExpandedChange,
  onCollapseAll
}) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');

  // Filter nodes recursively based on filter text
  const filterNodes = useMemo(() => {
    if (!filter.trim()) return directoryTree;

    const filterText = filter.toLowerCase();
    
    const filterNodeRecursive = (nodes: DirectoryNode[]): DirectoryNode[] => {
      return nodes.reduce((filtered: DirectoryNode[], node) => {
        const nameMatches = node.name.toLowerCase().includes(filterText);
        const pathMatches = node.path.toLowerCase().includes(filterText);
        
        if (node.type === 'file') {
          // Include file if name or path matches
          if (nameMatches || pathMatches) {
            filtered.push(node);
          }
        } else {
          // For directories, check if they contain matching files
          const filteredChildren = filterNodeRecursive(node.children || []);
          if (filteredChildren.length > 0 || nameMatches) {
            filtered.push({
              ...node,
              children: filteredChildren
            });
          }
        }
        
        return filtered;
      }, []);
    };

    return filterNodeRecursive(directoryTree);
  }, [directoryTree, filter]);

  // Count filtered results
  const countFilteredFiles = (nodes: DirectoryNode[]): number => {
    return nodes.reduce((count, node) => {
      if (node.type === 'file') {
        return count + 1;
      }
      return count + countFilteredFiles(node.children || []);
    }, 0);
  };

  const filteredFileCount = useMemo(() => countFilteredFiles(filterNodes), [filterNodes]);
  const totalFileCount = useMemo(() => countFilteredFiles(directoryTree), [directoryTree]);

  const renderTreeItems = (nodes: DirectoryNode[], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedFolders.includes(node.path);
      const isSelected = selectedFile?.path === node.path;
      
      return (
        <Box key={node.path}>
          <ListItem
            role="treeitem"
            tabIndex={0}
            aria-expanded={node.type === 'directory' ? isExpanded : undefined}
            aria-selected={isSelected}
            aria-level={level + 1}
            aria-label={node.type === 'directory' ? `${node.name} folder` : `${node.name} file`}
            sx={{
              py: 0.5,
              pl: level * 2 + 1,
              cursor: (node.type === 'directory' || node.file?.type === 'markdown') ? 'pointer' : 'default',
              opacity: (node.type === 'directory' || node.file?.type === 'markdown') ? 1 : 0.6,
              '&:hover': {
                backgroundColor: (node.type === 'directory' || node.file?.type === 'markdown') ? 'action.hover' : 'transparent'
              },
              backgroundColor: isSelected ? 'action.selected' : 'transparent',
              '&:focus': {
                backgroundColor: 'action.focus',
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: '-2px'
              }
            }}
            onClick={() => {
              if (node.type === 'directory') {
                const newExpanded = isExpanded
                  ? expandedFolders.filter(id => id !== node.path)
                  : [...expandedFolders, node.path];
                onExpandedChange(newExpanded);
              } else if (node.file && node.file.type === 'markdown') {
                onFileSelect(node.file);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (node.type === 'directory') {
                  const newExpanded = isExpanded
                    ? expandedFolders.filter(id => id !== node.path)
                    : [...expandedFolders, node.path];
                  onExpandedChange(newExpanded);
                } else if (node.file && node.file.type === 'markdown') {
                  onFileSelect(node.file);
                }
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {node.type === 'directory' ? (
                isExpanded ? (
                  <FolderOpen sx={{ mr: 1, fontSize: 18, color: 'primary.main' }} />
                ) : (
                  <Folder sx={{ mr: 1, fontSize: 18, color: 'action.active' }} />
                )
              ) : node.file?.type === 'image' ? (
                <Image sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
              ) : (
                <Description sx={{ mr: 1, fontSize: 18, color: 'action.active' }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? 'primary.main' : 'text.primary',
                  userSelect: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {node.name}
              </Typography>
            </Box>
          </ListItem>
          
          {node.type === 'directory' && node.children && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              {renderTreeItems(node.children, level + 1)}
            </Collapse>
          )}
        </Box>
      );
    });
  };

  const handleVSCodeOpen = () => {
    if (selectedFile) {
      VSCodeService.openInVSCode(selectedFile.path);
    }
  };

  return (
    <Box 
      role="navigation"
      aria-label="File tree navigation"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box 
        sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
          {t('ui.markdownFiles')}
        </Typography>
        <Box>
          <Tooltip title={t('ui.collapseAll')}>
            <IconButton 
              size="small" 
              onClick={onCollapseAll}
              aria-label={t('ui.collapseAll')}
            >
              <UnfoldLess />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('ui.openInVSCode')}>
            <IconButton 
              size="small" 
              onClick={handleVSCodeOpen}
              disabled={!selectedFile}
              aria-label={t('ui.openInVSCode')}
            >
              <Code />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter Input */}
      <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder={t('search.placeholder', 'Search files...')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: filter && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => setFilter('')}
                  aria-label="Clear search"
                >
                  <Clear sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            )
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '0.875rem',
              '& fieldset': {
                borderColor: 'divider'
              },
              '&:hover fieldset': {
                borderColor: 'primary.main'
              }
            }
          }}
        />
        
        {/* Filter Results Count */}
        {filter && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              label={`${filteredFileCount} of ${totalFileCount} files`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.75rem', height: 24 }}
            />
            {filteredFileCount === 0 && (
              <Typography variant="caption" color="text.secondary">
                {t('search.noResults', 'No files found')}
              </Typography>
            )}
          </Box>
        )}
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {directoryTree.length > 0 ? (
          <List 
            dense 
            role="tree"
            aria-label="File and folder tree"
            sx={{ py: 0 }}
          >
            {renderTreeItems(filterNodes)}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            {t('ui.noFileSelected')}
          </Typography>
        )}
      </Box>
    </Box>
  );
};