import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import { SurfaceTokens } from '../theme/designTokens';
import { highlightMarkdownLines } from '../utils/highlightLines';

interface RawViewerProps {
  /** Unrendered Markdown source of the current file. */
  source: string;
  tokens: SurfaceTokens;
  isDark: boolean;
  zoom: number;
  wordWrap?: boolean;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

/** Markdown token colors (highlight.js class names), tuned for light and dark surfaces. */
const SYNTAX = {
  light: {
    section: '#0550ae', strong: '#24292f', emphasis: '#24292f', code: '#0a7d32',
    bullet: '#cf222e', link: '#8250df', url: '#0969da', quote: '#57606a',
    tag: '#116329', attr: '#953800', string: '#0a3069', meta: '#6e7781',
  },
  dark: {
    section: '#79c0ff', strong: '#e6edf3', emphasis: '#e6edf3', code: '#7ee787',
    bullet: '#ff7b72', link: '#d2a8ff', url: '#58a6ff', quote: '#8b949e',
    tag: '#7ee787', attr: '#ffa657', string: '#a5d6ff', meta: '#8b949e',
  },
};

/** Shows the unrendered Markdown source of the current file with line numbers and syntax colors. */
export const RawViewer: React.FC<RawViewerProps> = ({ source, tokens, isDark, zoom, wordWrap = true }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => highlightMarkdownLines(source), [source]);
  const fontPx = Math.round(14 * zoom / 100);
  const gutterCh = String(lines.length).length + 1;
  const c = isDark ? SYNTAX.dark : SYNTAX.light;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.warn('Copy to clipboard failed:', e);
    }
  }, [source]);

  return (
    <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto', background: tokens.pre }}>
      {/* Floating copy button: sticky, takes no layout space */}
      <Box sx={{ position: 'sticky', top: 0, left: 0, height: 0, zIndex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <Box component="button" type="button" onClick={handleCopy}
          title={t('raw.copy')}
          sx={{
            display: 'flex', alignItems: 'center', gap: '6px',
            height: 28, px: '10px', mt: '10px', mr: '16px',
            border: `1px solid ${tokens.border}`, background: tokens.paper,
            color: tokens.fg2, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
            opacity: 0.85, '&:hover': { opacity: 1, background: tokens.hover },
          }}
        >
          {copied ? <Check sx={{ fontSize: 16 }} /> : <ContentCopy sx={{ fontSize: 16 }} />}
          <span>{copied ? t('raw.copied') : t('raw.copy')}</span>
        </Box>
      </Box>
      <Box
        component="pre"
        className="raw-source"
        sx={{
          m: 0, p: '16px 0 48px',
          minHeight: '100%', boxSizing: 'border-box',
          width: wordWrap ? 'auto' : 'max-content', minWidth: '100%',
          fontFamily: MONO,
          fontSize: `${fontPx}px`,
          lineHeight: 1.6,
          color: tokens.fg1,
          '& .hljs-section': { color: c.section, fontWeight: 600 },
          '& .hljs-strong': { color: c.strong, fontWeight: 700 },
          '& .hljs-emphasis': { color: c.emphasis, fontStyle: 'italic' },
          '& .hljs-code': { color: c.code },
          '& .hljs-bullet': { color: c.bullet },
          '& .hljs-string': { color: c.link },
          '& .hljs-link': { color: c.url, textDecoration: 'underline' },
          '& .hljs-symbol': { color: c.url },
          '& .hljs-quote': { color: c.quote, fontStyle: 'italic' },
          '& .hljs-tag, & .hljs-name': { color: c.tag },
          '& .hljs-attr': { color: c.attr },
          '& .hljs-meta, & .hljs-comment': { color: c.meta },
        }}
      >
        {lines.map((html, i) => (
          <Box key={i} sx={{ display: 'flex' }}>
            <Box component="span" aria-hidden sx={{
              flexShrink: 0, width: `${gutterCh}ch`, pr: '16px', pl: '16px', boxSizing: 'content-box',
              textAlign: 'right', color: tokens.fg3, userSelect: 'none',
              position: 'sticky', left: 0, background: tokens.pre,
            }}>
              {i + 1}
            </Box>
            <Box component="span"
              // highlight.js escapes the source; output contains only its own <span> markup.
              dangerouslySetInnerHTML={{ __html: html }}
              sx={{
                flex: 1, minWidth: 0, pr: '24px', minHeight: '1.6em',
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                overflowWrap: wordWrap ? 'anywhere' : 'normal',
              }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};
