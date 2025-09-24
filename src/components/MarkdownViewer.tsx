import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Box, Typography, Paper, Chip, Fab, IconButton, ButtonGroup } from '@mui/material';
import { FullscreenExit, ZoomIn, ZoomOut, CenterFocusStrong } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
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
  hasFolderSelected?: boolean;
  onInternalLinkClick: (container: HTMLElement) => void;
  onMermaidProcess: (container: HTMLElement) => Promise<void>;
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
  hasFolderSelected = false,
  onInternalLinkClick,
  onMermaidProcess,
  onPlantUMLProcess,
  onExitFocusMode
}) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Zoom state management
  const [zoomLevel, setZoomLevel] = useState(100);
  const minZoom = 50;
  const maxZoom = 200;
  const zoomStep = 10;

  // Zoom control functions
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + zoomStep, maxZoom));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - zoomStep, minZoom));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedContent = useMemo(() => {
    if (!content) return '';
    
    // Configure DOMPurify to allow safe HTML while preserving markdown features
    const config = {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'blockquote', 'code', 'pre', 'kbd', 'samp', 'var',
        'a', 'img', 'figure', 'figcaption',
        'hr', 'details', 'summary',
        // Allow SVG for diagrams (Mermaid/PlantUML)
        'svg', 'g', 'path', 'circle', 'rect', 'line', 'text', 'tspan', 'defs', 'marker', 'polygon', 'polyline', 'ellipse'
      ],
      ALLOWED_ATTR: [
        'class', 'id', 'style', 'title', 'aria-*', 'data-*',
        'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
        'colspan', 'rowspan', 'align', 'valign',
        // SVG attributes
        'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'x1', 'y1', 'x2', 'y2'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
      ADD_TAGS: ['iframe'], // Allow iframes for embedded content (with restrictions)
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
      FORBID_CONTENTS: ['script', 'object', 'embed', 'applet', 'form', 'input', 'textarea', 'select', 'button']
    };
    
    return DOMPurify.sanitize(content, config);
  }, [content]);

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

  // Keyboard shortcuts for zoom
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '+':
          case '=':
            event.preventDefault();
            zoomIn();
            break;
          case '-':
            event.preventDefault();
            zoomOut();
            break;
          case '0':
            event.preventDefault();
            resetZoom();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel]);


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
        {!hasFolderSelected ? (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {t('ui.noFolderSelected')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto', lineHeight: 1.5 }}>
              {t('ui.noFolderHelp')}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 300, mx: 'auto', lineHeight: 1.5 }}>
            {t('ui.noFileSelected')}
          </Typography>
        )}
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
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
            </Box>

            {/* Zoom Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ButtonGroup variant="outlined" size="small">
                <IconButton
                  onClick={zoomOut}
                  disabled={zoomLevel <= minZoom}
                  title="Zoom out"
                  aria-label="Zoom out"
                >
                  <ZoomOut fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={resetZoom}
                  title="Reset zoom"
                  aria-label="Reset zoom to 100%"
                >
                  <CenterFocusStrong fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={zoomIn}
                  disabled={zoomLevel >= maxZoom}
                  title="Zoom in"
                  aria-label="Zoom in"
                >
                  <ZoomIn fontSize="small" />
                </IconButton>
              </ButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                {zoomLevel}%
              </Typography>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
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
          role="article"
          aria-label={file ? `Markdown content for ${file.name}` : 'Markdown content'}
          className={`markdown-content ${
            appearanceSettings?.showLineNumbers ? 'show-line-numbers' : ''
          } ${
            appearanceSettings?.wordWrap ? 'word-wrap-enabled' : 'word-wrap-disabled'
          }`.trim()}
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          style={{
            lineHeight: 1.6,
            fontSize: getContentFontSize(),
            maxWidth: focusMode ? '800px' : 'none',
            margin: focusMode ? '0 auto' : '0',
            fontFamily: appearanceSettings?.fontFamily || 'inherit',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top left',
            width: `${100 / (zoomLevel / 100)}%`
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
          aria-label={t('ui.exitFocusMode')}
        >
          <FullscreenExit />
        </Fab>
      )}
    </Box>
  );
};