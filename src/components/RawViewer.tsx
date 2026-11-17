import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { ContentCopy, Check } from '@mui/icons-material';
import { SurfaceTokens, DOC_WIDTH_MAX } from '../theme/designTokens';

interface RawViewerProps {
  /** Unrendered Markdown source of the current file. */
  source: string;
  tokens: SurfaceTokens;
  zoom: number;
  docWidth: number;
  wordWrap?: boolean;
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';

/** Shows the unrendered Markdown source of the current file with line numbers. */
export const RawViewer: React.FC<RawViewerProps> = ({ source, tokens, zoom, docWidth, wordWrap = true }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const lines = useMemo(() => source.replace(/\r\n?/g, '\n').split('\n'), [source]);
  const fontPx = Math.round(14 * zoom / 100);
  const gutterCh = String(lines.length).length + 1;

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
    <Box sx={{ flex: 1, minWidth: 0, overflow: 'auto', background: tokens.paper }}>
      <Box sx={{
        maxWidth: docWidth >= DOC_WIDTH_MAX ? 'none' : docWidth,
        margin: '0 auto',
        padding: '32px 40px 96px',
        position: 'relative',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Box component="button" type="button" onClick={handleCopy}
            title={t('raw.copy')}
            sx={{
              display: 'flex', alignItems: 'center', gap: '6px',
              height: 30, px: '10px', border: `1px solid ${tokens.border}`, background: 'transparent',
              color: tokens.fg2, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              '&:hover': { background: tokens.hover },
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
            m: 0, p: '16px 0',
            background: tokens.pre,
            border: `1px solid ${tokens.border}`,
            fontFamily: MONO,
            fontSize: `${fontPx}px`,
            lineHeight: 1.6,
            color: tokens.fg1,
            overflowX: wordWrap ? 'hidden' : 'auto',
          }}
        >
          {lines.map((line, i) => (
            <Box key={i} sx={{ display: 'flex' }}>
              <Box component="span" aria-hidden sx={{
                flexShrink: 0, width: `${gutterCh}ch`, pr: '16px', pl: '12px', boxSizing: 'content-box',
                textAlign: 'right', color: tokens.fg3, userSelect: 'none',
              }}>
                {i + 1}
              </Box>
              <Box component="span" sx={{
                flex: 1, minWidth: 0, pr: '16px', minHeight: '1.6em',
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                overflowWrap: wordWrap ? 'anywhere' : 'normal',
              }}>
                {line}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};
