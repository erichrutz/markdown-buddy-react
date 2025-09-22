import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  InputAdornment,
  IconButton,
  Paper,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  InsertDriveFile as FileIcon,
  Folder as FolderIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
  ArrowUpward,
  ArrowDownward
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import Fuse from 'fuse.js';
import { MarkdownFile } from '../types';

interface SearchResult {
  type: 'file' | 'content';
  file: MarkdownFile;
  matches?: string[];
  score?: number;
  preview?: string;
}

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
  files: Map<string, MarkdownFile>;
  onFileSelect: (file: MarkdownFile) => void;
  searchHistory?: string[];
  onSearchHistoryUpdate?: (searches: string[]) => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({
  open,
  onClose,
  files,
  onFileSelect,
  searchHistory = [],
  onSearchHistoryUpdate
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Convert files Map to array for Fuse.js
  const filesArray = useMemo(() => Array.from(files.values()), [files]);
  
  // Fuse.js configuration for file name search
  const fuseOptions = useMemo(() => ({
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'path', weight: 0.3 }
    ],
    threshold: 0.6, // More lenient threshold (0.0 = perfect match, 1.0 = match everything)
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1,
    ignoreLocation: true, // Don't consider position in string
    findAllMatches: true, // Find all matches, not just the first
    shouldSort: true, // Sort by score
    distance: 100 // How far from expected position a match can be
  }), []);
  
  const fuse = useMemo(() => {
    return new Fuse(filesArray, fuseOptions);
  }, [filesArray, fuseOptions]);
  
  // Perform search
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // File name search with Fuse.js
      const fuseResults = fuse.search(query);
      
      const fileResults = fuseResults.map(result => ({
        type: 'file' as const,
        file: result.item,
        matches: result.matches?.map(match => match.key || '') || [],
        score: result.score || 0
      }));
      
      setSearchResults(fileResults.slice(0, 50)); // Limit results
      setSelectedIndex(0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [fuse, filesArray]);
  
  // Handle search input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 150); // Debounce search
    
    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          event.preventDefault();
          if (searchResults[selectedIndex]) {
            handleFileSelect(searchResults[selectedIndex].file);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, searchResults, selectedIndex, onClose]);
  
  // Handle file selection
  const handleFileSelect = useCallback((file: MarkdownFile) => {
    onFileSelect(file);
    
    // Add to search history
    if (searchQuery.trim() && onSearchHistoryUpdate) {
      const newHistory = [
        searchQuery,
        ...searchHistory.filter(item => item !== searchQuery)
      ].slice(0, 10); // Keep last 10 searches
      onSearchHistoryUpdate(newHistory);
    }
    
    onClose();
  }, [onFileSelect, searchQuery, searchHistory, onSearchHistoryUpdate, onClose]);
  
  // Handle search history item click
  const handleHistoryClick = useCallback((historyItem: string) => {
    setSearchQuery(historyItem);
  }, []);
  
  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedIndex(0);
  }, []);
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedIndex(0);
    }
  }, [open]);
  
  // Format file path for display
  const formatPath = useCallback((path: string) => {
    const parts = path.split('/');
    if (parts.length > 3) {
      return `.../${parts.slice(-2).join('/')}`;
    }
    return path;
  }, []);
  
  // Render search result item
  const renderSearchResult = useCallback((result: SearchResult, index: number) => {
    const isSelected = index === selectedIndex;
    const icon = result.type === 'file' ? <FileIcon /> : <FolderIcon />;
    
    return (
      <ListItem
        key={`${result.file.path}-${index}`}
        disablePadding
        sx={{
          bgcolor: isSelected ? 'action.hover' : 'transparent',
          borderRadius: 1,
          mb: 0.5
        }}
      >
        <ListItemButton
          onClick={() => handleFileSelect(result.file)}
          sx={{ borderRadius: 1 }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            {icon}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" noWrap>
                  {result.file.name}
                </Typography>
                {result.matches && result.matches.length > 0 && (
                  <Chip
                    label={result.matches[0]}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                )}
              </Box>
            }
            secondary={
              <Typography variant="caption" color="text.secondary" noWrap>
                {formatPath(result.file.path)}
              </Typography>
            }
          />
        </ListItemButton>
      </ListItem>
    );
  }, [selectedIndex, handleFileSelect, formatPath]);
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '10vh',
          m: 0,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            autoFocus
            fullWidth
            variant="outlined"
            placeholder={t('search.placeholder', 'Search files...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {searchQuery ? 
                `${searchResults.length} ${t('search.resultsFound', 'results found')}` :
                t('search.typeToSearch', 'Type to search files')
              }
            </Typography>
            {searchResults.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 12 }} />
                <ArrowDownward sx={{ fontSize: 12 }} />
                <Typography variant="caption" color="text.secondary">
                  {t('search.navigate', 'to navigate')}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        
        <Paper sx={{ maxHeight: '50vh', overflow: 'auto', mx: 2, mb: 2 }}>
          <List sx={{ py: 1 }}>
            {/* Search Results */}
            {searchResults.length > 0 && (
              searchResults.map((result, index) => renderSearchResult(result, index))
            )}
            
            {/* No Results */}
            {searchQuery && searchResults.length === 0 && !isLoading && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      {t('search.noResults', 'No files found matching your search')}
                    </Typography>
                  }
                />
              </ListItem>
            )}
            
            {/* Loading */}
            {isLoading && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      {t('search.searching', 'Searching...')}
                    </Typography>
                  }
                />
              </ListItem>
            )}
            
            {/* Search History */}
            {!searchQuery && searchHistory.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <HistoryIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        {t('search.recentSearches', 'Recent Searches')}
                      </Typography>
                    }
                  />
                </ListItem>
                {searchHistory.map((historyItem, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton
                      onClick={() => handleHistoryClick(historyItem)}
                      sx={{ pl: 5, borderRadius: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Typography variant="body2" color="text.secondary">
                            {historyItem}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </>
            )}
          </List>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};