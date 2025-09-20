import React, { useEffect, useRef } from 'react';
import { Box, Typography, Paper, Chip, Fab } from '@mui/material';
import { FullscreenExit } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { MarkdownFile, FileStats } from '../types';
import { AppearanceSettings } from '../types/settings';
import 'highlight.js/styles/github.css';

interface MarkdownViewerProps {
  file: MarkdownFile | null;
  content: string;
  stats: FileStats | null;
  loading: boolean;
  error: string | null;
  focusMode?: boolean;
  appearanceSettings?: AppearanceSettings;
  onInternalLinkClick: (container: HTMLElement) => void;
  onMermaidProcess: (container: HTMLElement) => void;
  onPlantUMLProcess: (container: HTMLElement) => Promise<void>;
  onExitFocusMode?: () => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  file,
  content,
  stats,
  loading,
  error,
  focusMode = false,
  appearanceSettings,
  onInternalLinkClick,
  onMermaidProcess,
  onPlantUMLProcess,
  onExitFocusMode
}) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Calculate font size based on settings
  const getContentFontSize = () => {
    const baseSize = 16; // 16px base
    switch (appearanceSettings?.fontSize) {
      case 'small': return `${baseSize * 0.875}px`;
      case 'large': return `${baseSize * 1.125}px`;
      case 'medium':
      default: return `${baseSize}px`;
    }
  };

  useEffect(() => {
    const processContent = async () => {
      if (contentRef.current && content && !loading) {
        onInternalLinkClick(contentRef.current);
        await onMermaidProcess(contentRef.current);
        await onPlantUMLProcess(contentRef.current);
      }
    };
    
    processContent();
  }, [content, loading, onInternalLinkClick, onMermaidProcess, onPlantUMLProcess]);

  // Update CSS variable for font size when appearance settings change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.setProperty('--md-font-size-base', getContentFontSize());
    }
  }, [appearanceSettings?.fontSize]);

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Toolbar - Hide in focus mode */}
      {!focusMode && (
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
      )}

      {/* Content */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          p: focusMode ? 4 : 3
        }}
      >
        <div
          ref={contentRef}
          className={`markdown-content ${
            appearanceSettings?.showLineNumbers ? 'show-line-numbers' : ''
          } ${
            appearanceSettings?.wordWrap ? 'word-wrap-enabled' : 'word-wrap-disabled'
          }`.trim()}
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            lineHeight: 1.6,
            fontSize: getContentFontSize(),
            maxWidth: focusMode ? '800px' : 'none',
            margin: focusMode ? '0 auto' : '0',
            fontFamily: appearanceSettings?.fontFamily || 'inherit'
          }}
        />
      </Box>

      {/* Floating exit button in focus mode */}
      {focusMode && onExitFocusMode && (
        <Fab
          color="primary"
          size="medium"
          onClick={onExitFocusMode}
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 1000
          }}
          title={t('ui.exitFocusMode')}
        >
          <FullscreenExit />
        </Fab>
      )}
    </Box>
  );
};