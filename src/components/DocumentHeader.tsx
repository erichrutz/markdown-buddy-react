import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Slider } from '@mui/material';
import { Remove, Add, MyLocation, FormatColorReset, AspectRatio } from '@mui/icons-material';
import { SurfaceTokens, BRAND, DOC_WIDTH_MIN, DOC_WIDTH_MAX, DOC_WIDTH_STEP } from '../theme/designTokens';

export type ViewMode = 'doc' | 'slides';

interface DocumentHeaderProps {
  tokens: SurfaceTokens;
  fileName: string;
  breadcrumb: string;
  stats: { size: string; lines: number; characters: number; sections: number } | null;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  docWidth: number;
  onDocWidthChange: (width: number) => void;
  docPointer: boolean;
  onToggleDocPointer: () => void;
  markCount: number;
  onClearMarks: () => void;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  tokens,
  fileName,
  breadcrumb,
  stats,
  view,
  onViewChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  docWidth,
  onDocWidthChange,
  docPointer,
  onToggleDocPointer,
  markCount,
  onClearMarks,
}) => {
  const { t, i18n } = useTranslation();
  const [widthOpen, setWidthOpen] = useState(false);
  const tabBtnSx = (active: boolean) => ({
    height: 30,
    px: '14px',
    border: 0,
    background: active ? BRAND.ACCENT : 'transparent',
    color: active ? '#ffffff' : tokens.fg2,
    font: "600 12px 'Noto Sans', Arial, sans-serif",
    cursor: 'pointer',
  });

  const zoomBtnSx = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    border: 0,
    background: 'transparent',
    cursor: 'pointer',
    color: tokens.fg2,
  };

  return (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: '24px',
        padding: '16px 32px 0',
        background: tokens.chrome,
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
      {/* Left: file info */}
      <Box sx={{ minWidth: 0, pb: '14px' }}>
        <Box sx={{ fontSize: 11, color: tokens.fg3, letterSpacing: '.02em', mb: '5px' }}>
          {breadcrumb}
        </Box>
        <Box sx={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', mb: '6px' }}>
          {fileName}
        </Box>
        {stats && (
          <Box sx={{ fontSize: 11, color: tokens.fg3 }}>
            {stats.size} &nbsp;|&nbsp; {t('doc.statsLines', { count: stats.lines })} &nbsp;|&nbsp; {t('doc.statsCharacters', { count: stats.characters, formatted: stats.characters.toLocaleString(i18n.language) })} &nbsp;|&nbsp; {t('doc.statsSections', { count: stats.sections })}
          </Box>
        )}
      </Box>

      {/* Right: controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', pb: '10px', flexShrink: 0 }}>
        {/* View switcher */}
        <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${tokens.border}` }}>
          <Box component="button" type="button" onClick={() => onViewChange('doc')} sx={tabBtnSx(view === 'doc')}>
            {t('doc.document')}
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => onViewChange('slides')}
            sx={{ ...tabBtnSx(view === 'slides'), borderLeft: `1px solid ${tokens.border}` }}
          >
            {t('doc.sections')}
          </Box>
        </Box>

        {/* Zoom */}
        <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${tokens.border}` }}>
          <Box component="button" type="button" onClick={onZoomOut} title={t('doc.zoomOut')} sx={zoomBtnSx}>
            <Remove sx={{ fontSize: 17 }} />
          </Box>
          <Box
            onClick={onZoomReset}
            sx={{
              minWidth: 44,
              textAlign: 'center',
              fontSize: 11,
              fontVariantNumeric: 'tabular-nums',
              color: tokens.fg2,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {zoom} %
          </Box>
          <Box component="button" type="button" onClick={onZoomIn} title={t('doc.zoomIn')} sx={zoomBtnSx}>
            <Add sx={{ fontSize: 17 }} />
          </Box>
        </Box>

        {/* Reading width */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pr: widthOpen ? '10px' : 0,
            border: `1px solid ${tokens.border}`,
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => setWidthOpen(o => !o)}
            title={t('doc.textWidth')}
            sx={{ ...zoomBtnSx, color: widthOpen ? BRAND.ACCENT : tokens.fg2 }}
          >
            <AspectRatio sx={{ fontSize: 16 }} />
          </Box>
          {widthOpen && (
            <>
              <Slider
                value={docWidth}
                onChange={(_, v) => onDocWidthChange(v as number)}
                min={DOC_WIDTH_MIN}
                max={DOC_WIDTH_MAX}
                step={DOC_WIDTH_STEP}
                size="small"
                title={t('doc.textWidth')}
                sx={{ width: 90, color: BRAND.ACCENT, '& .MuiSlider-thumb': { width: 12, height: 12 } }}
              />
              <Box sx={{ minWidth: 46, fontSize: 11, fontVariantNumeric: 'tabular-nums', color: tokens.fg2, userSelect: 'none' }}>
                {docWidth >= DOC_WIDTH_MAX ? t('doc.fullWidth') : `${docWidth}px`}
              </Box>
            </>
          )}
        </Box>

        {/* Pointer toggle */}
        <Box
          component="button"
          type="button"
          onClick={onToggleDocPointer}
          title={t('doc.pointerHint')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            height: 32,
            px: '12px',
            border: `1px solid ${docPointer ? BRAND.ACCENT : tokens.border}`,
            background: 'transparent',
            font: "600 11.5px 'Noto Sans', Arial, sans-serif",
            cursor: 'pointer',
            color: docPointer ? BRAND.ACCENT : tokens.fg2,
          }}
        >
          <MyLocation sx={{ fontSize: 17 }} />
          {t('doc.pointer')}
        </Box>

        {/* Markers clear button */}
        {markCount > 0 && (
          <Box
            component="button"
            type="button"
            onClick={onClearMarks}
            title={t('doc.clearMarks')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              height: 32,
              px: '12px',
              border: `1px solid ${tokens.border}`,
              background: 'transparent',
              font: "600 11.5px 'Noto Sans', Arial, sans-serif",
              cursor: 'pointer',
              color: tokens.fg2,
              '&:hover': { borderColor: BRAND.DANGER, color: BRAND.DANGER },
            }}
          >
            <FormatColorReset sx={{ fontSize: 16 }} />
            {markCount} {markCount === 1 ? t('doc.markOne') : t('doc.markMany')}
          </Box>
        )}
      </Box>
    </Box>
  );
};
