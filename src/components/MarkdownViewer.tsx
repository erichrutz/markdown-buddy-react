import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MarkdownFile, FileStats } from '../types';
import 'highlight.js/styles/github.css';

interface MarkdownViewerProps {
  file: MarkdownFile | null;
  content: string;
  stats: FileStats | null;
  loading: boolean;
  error: string | null;
  onInternalLinkClick: (container: HTMLElement) => void;
  onMermaidProcess: (container: HTMLElement) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  file,
  content,
  stats,
  loading,
  error,
  onInternalLinkClick,
  onMermaidProcess
}) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && content && !loading) {
      onInternalLinkClick(contentRef.current);
      onMermaidProcess(contentRef.current);
    }
  }, [content, loading, onInternalLinkClick, onMermaidProcess]);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {t('ui.errorLoading')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!file) {
    return (
      <Box 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 3
        }}
      >
        <Typography variant="h6" color="text.secondary">
          {t('ui.noFileSelected')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ fontSize: '1.1rem' }}>
          {file.name}
        </Typography>
        
        {stats && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`${t('stats.size')}: ${stats.size}`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`${t('stats.lines')}: ${stats.lines}`} 
              size="small" 
              variant="outlined" 
            />
            <Chip 
              label={`${t('stats.characters')}: ${stats.characters}`} 
              size="small" 
              variant="outlined" 
            />
          </Box>
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('stats.path')}: {file.path}
        </Typography>
      </Paper>

      {/* Content */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: 3
        }}
      >
        <div
          ref={contentRef}
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            lineHeight: 1.6,
            fontSize: '16px'
          }}
        />
      </Box>
    </Box>
  );
};