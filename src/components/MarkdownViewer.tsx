import React, { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography } from '@mui/material';
import DOMPurify from 'dompurify';
import { MarkdownFile } from '../types';
import { SurfaceTokens, DOC_WIDTH_MAX } from '../theme/designTokens';
import { LoadingIndicator } from './LoadingIndicator';
import { OutlineEntry } from '../utils/sectionParser';
import 'highlight.js/styles/github.css';

import appLogo from '../img/logo.svg';

interface MarkdownViewerProps {
  file: MarkdownFile | null;
  content: string;
  loading: boolean;
  error: string | null;
  tokens: SurfaceTokens;
  isDark: boolean;
  zoom: number;
  docWidth: number;
  docPointer: boolean;
  outline: OutlineEntry[];
  onInternalLinkClick: (container: HTMLElement) => void;
  wordWrap?: boolean;
  onMermaidProcess: (container: HTMLElement) => void;
  onPlantUMLProcess: (container: HTMLElement) => Promise<void>;
  onDocMouseUp?: (x: number, y: number) => void;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  file,
  content,
  loading,
  error,
  tokens,
  zoom,
  docWidth,
  docPointer,
  wordWrap = true,
  onInternalLinkClick,
  onMermaidProcess,
  onPlantUMLProcess,
  onDocMouseUp,
}) => {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);

  // Sanitize HTML
  const sanitizedContent = useMemo(() => {
    if (!content) return '';
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        'div', 'span', 'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'dl', 'dt', 'dd',
        'blockquote', 'pre', 'code', 'kbd', 'samp', 'var', 'sub', 'sup',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
        'a', 'img', 'hr',
        'svg', 'g', 'path', 'rect', 'circle', 'line', 'text', 'tspan',
        'marker', 'polygon', 'polyline', 'ellipse',
      ],
      ALLOWED_ATTR: [
        'class', 'id', 'style', 'title', 'aria-*', 'data-*',
        'href', 'target', 'rel', 'src', 'alt', 'width', 'height',
        'colspan', 'rowspan', 'align', 'valign',
        'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
        'x', 'y', 'cx', 'cy', 'r', 'rx', 'ry', 'd', 'points', 'x1', 'y1', 'x2', 'y2',
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|xxx|data|blob):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
      ADD_TAGS: ['iframe'],
      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
      FORBID_CONTENTS: ['script', 'object', 'embed', 'applet', 'form', 'input', 'textarea', 'select', 'button'],
    });
  }, [content]);

  const fontPx = Math.round(16 * zoom / 100);

  // Process content after render
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

  if (loading) {
    return <LoadingIndicator variant="markdown" size="medium" type="circular" />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>{t('viewer.errorLoading')}</Typography>
        <Typography variant="body2" color="text.secondary">{error}</Typography>
      </Box>
    );
  }

  if (!file) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <Box component="img" src={appLogo} alt="MarkDown Buddy Logo" sx={{ height: 80, width: 'auto', mb: 3, opacity: 0.7 }} />
        <Typography variant="h5" color="text.primary" sx={{ mb: 2, fontWeight: 600 }}>
          {t('viewer.noFile')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          {t('viewer.noFileHelp')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      onMouseUp={(e) => onDocMouseUp?.(e.clientX, e.clientY)}
      sx={{
        flex: 1,
        minWidth: 0,
        overflow: 'auto',
        background: tokens.paper,
        cursor: docPointer ? 'none' : 'auto',
      }}
    >
      <Box
        ref={contentRef}
        className={`markdown-content ${wordWrap ? 'word-wrap-enabled' : 'word-wrap-disabled'}`}
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        sx={{
          maxWidth: docWidth >= DOC_WIDTH_MAX ? 'none' : docWidth,
          margin: '0 auto',
          padding: '56px 40px 96px',
          fontSize: `${fontPx}px`,
        }}
      />
    </Box>
  );
};
