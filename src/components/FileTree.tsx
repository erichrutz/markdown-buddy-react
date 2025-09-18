import React from 'react';
import { Box, Typography, IconButton, Tooltip, Collapse, List, ListItem } from '@mui/material';
import { 
  Folder, 
  FolderOpen, 
  Description,
  UnfoldLess,
  Code
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
  
  console.log('FileTree: Component props:', {
    directoryTreeLength: directoryTree.length,
    selectedFile: selectedFile?.path,
    expandedFoldersLength: expandedFolders.length,
    expandedFolders
  });

  const renderTreeItems = (nodes: DirectoryNode[], level = 0) => {
    console.log(`FileTree: Rendering ${nodes.length} nodes at level ${level}`);
    nodes.forEach((node, index) => {
      console.log(`FileTree: Node ${index}:`, {
        name: node.name,
        path: node.path,
        type: node.type,
        hasChildren: node.children ? node.children.length : 0
      });
    });
    
    return nodes.map((node) => {
      const isExpanded = expandedFolders.includes(node.path);
      const isSelected = selectedFile?.path === node.path;
      
      console.log(`FileTree: Rendering node ${node.name}:`, {
        path: node.path,
        type: node.type,
        isExpanded,
        isSelected,
        hasChildren: node.children ? node.children.length : 0
      });
      
      return (
        <Box key={node.path}>
          <ListItem
            sx={{
              py: 0.5,
              pl: level * 2 + 1,
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'action.hover'
              },
              backgroundColor: isSelected ? 'action.selected' : 'transparent'
            }}
            onClick={() => {
              console.log(`FileTree: Clicked on ${node.name}:`, {
                path: node.path,
                type: node.type,
                currentlyExpanded: isExpanded,
                hasChildren: node.children ? node.children.length : 0
              });
              
              if (node.type === 'directory') {
                const newExpanded = isExpanded
                  ? expandedFolders.filter(id => id !== node.path)
                  : [...expandedFolders, node.path];
                console.log('FileTree: New expanded state:', newExpanded);
                onExpandedChange(newExpanded);
              } else if (node.file) {
                console.log('FileTree: Selecting file:', node.file.path);
                onFileSelect(node.file);
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
            <IconButton size="small" onClick={onCollapseAll}>
              <UnfoldLess />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('ui.openInVSCode')}>
            <IconButton 
              size="small" 
              onClick={handleVSCodeOpen}
              disabled={!selectedFile}
            >
              <Code />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {directoryTree.length > 0 ? (
          <List dense sx={{ py: 0 }}>
            {renderTreeItems(directoryTree)}
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