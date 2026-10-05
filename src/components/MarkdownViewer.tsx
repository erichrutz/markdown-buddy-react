import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import DOMPurify from 'dompurify';
import { MarkdownFile } from '../types';
import { SurfaceTokens, BRAND, DOC_WIDTH_MAX } from '../theme/designTokens';
import { LoadingIndicator } from './LoadingIndicator';
import { OutlineEntry } from '../utils/sectionParser';
import { useResizableWidth } from '../hooks/useResizableWidth';
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
  outline,
  onInternalLinkClick,
  onMermaidProcess,
  onPlantUMLProcess,
  onDocMouseUp,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeOutline, setActiveOutline] = useState<string>(outline[0]?.id || '');
  const { width: outlineWidth, onMouseDown: onOutlineResize } = useResizableWidth(236, 160, 420, 'left');

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

  // Set active outline to first entry when outline changes
  useEffect(() => {
    const first = outline[0];
    if (first && !outline.find(o => o.id === activeOutline)) {
      setActiveOutline(first.id);
    }
  }, [outline, activeOutline]);

  if (loading) {
    return <LoadingIndicator variant="markdown" size="medium" type="circular" />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error" gutterBottom>Fehler beim Laden</Typography>
        <Typography variant="body2" color="text.secondary">{error}</Typography>
      </Box>
    );
  }

  if (!file) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
        <Box component="img" src={appLogo} alt="MarkDown Buddy Logo" sx={{ height: 80, width: 'auto', mb: 3, opacity: 0.7 }} />
        <Typography variant="h5" color="text.primary" sx={{ mb: 2, fontWeight: 600 }}>
          Keine Datei ausgewählt
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
          Wählen Sie einen Ordner aus und klicken Sie auf eine Markdown-Datei.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Document body */}
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
          className="markdown-content"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          sx={{
            maxWidth: docWidth >= DOC_WIDTH_MAX ? 'none' : docWidth,
            margin: '0 auto',
            padding: '56px 40px 96px',
            fontSize: `${fontPx}px`,
          }}
        />
      </Box>

      {/* Outline panel */}
      {outline.length > 0 && (
        <Box
          sx={{
            position: 'relative',
            width: outlineWidth,
            flexShrink: 0,
            overflow: 'auto',
            padding: '56px 24px 40px 0',
            borderLeft: `1px solid ${tokens.border}`,
            background: tokens.paper,
          }}
        >
          {/* Resize handle */}
          <Box
            onMouseDown={onOutlineResize}
            sx={{
              position: 'absolute',
              top: 0,
              left: -3,
              width: 6,
              height: '100%',
              cursor: 'col-resize',
              zIndex: 1,
              '&:hover': { background: BRAND.ACCENT },
            }}
          />
          <Box sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '.09em', textTransform: 'uppercase', color: tokens.fg3, pl: '24px', mb: '12px' }}>
            Gliederung
          </Box>
          {outline.map((o, idx) => {
            const active = activeOutline === o.id;
            return (
              <Box
                key={o.id}
                onClick={() => {
                  setActiveOutline(o.id);
                  // Scroll to the matching heading. Outline entries are in
                  // document order, so the Nth entry maps to the Nth heading.
                  const root = contentRef.current;
                  if (!root) return;
                  const headings = root.querySelectorAll('h1, h2, h3');
                  const target = headings[idx] as HTMLElement | undefined;
                  target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                sx={{
                  fontSize: 15,
                  lineHeight: 1.45,
                  padding: '6px 0 6px 21px',
                  cursor: 'pointer',
                  borderLeft: `3px solid ${active ? BRAND.ACCENT : 'transparent'}`,
                  ml: 0,
                  color: active ? tokens.fg1 : tokens.fg3,
                  fontWeight: active ? 600 : 400,
                  pl: o.level === 3 ? '36px' : '21px',
                  '&:hover': { color: BRAND.ACCENT },
                }}
              >
                {o.label}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};
