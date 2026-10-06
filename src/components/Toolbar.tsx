import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Popover, Slider, Menu, MenuItem, Divider } from '@mui/material';
import {
  FormatSize,
  MyLocation,
  Refresh,
  PictureAsPdf,
  PlayArrow,
  ExpandMore,
  Remove,
  Add,
  FormatColorReset,
} from '@mui/icons-material';
import { SurfaceTokens, BRAND, DOC_WIDTH_MIN, DOC_WIDTH_MAX, DOC_WIDTH_STEP, DOC_WIDTH_DEFAULT } from '../theme/designTokens';

export type ViewMode = 'doc' | 'slides';

const TRANSITION = 'background 180ms cubic-bezier(.4,0,.2,1), color 180ms cubic-bezier(.4,0,.2,1)';
const MENU_SHADOW = '0 8px 24px rgba(17,24,39,.12)';

interface ToolbarProps {
  tokens: SurfaceTokens;
  // File info
  fileName: string;
  breadcrumb: string;
  stats: { size: string; lines: number; characters: number; sections: number } | null;
  hasCurrentFile: boolean;
  // View
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  // Zoom & width
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  docWidth: number;
  onDocWidthChange: (width: number) => void;
  // Pointer
  docPointer: boolean;
  onToggleDocPointer: () => void;
  // Marks
  markCount: number;
  onClearMarks: () => void;
  // Actions
  onReload: () => void;
  onExportPDF: () => void;
  // Present
  onPresentFromStart: () => void;
  onPresentFromCurrent: () => void;
  onChooseSections: () => void;
  includedSections: number;
  totalSections: number;
  currentSectionTitle: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  tokens, fileName, breadcrumb, stats, hasCurrentFile,
  view, onViewChange,
  zoom, onZoomIn, onZoomOut, onZoomReset,
  docWidth, onDocWidthChange,
  docPointer, onToggleDocPointer,
  markCount, onClearMarks,
  onReload, onExportPDF,
  onPresentFromStart, onPresentFromCurrent, onChooseSections,
  includedSections, totalSections, currentSectionTitle,
}) => {
  const { t, i18n } = useTranslation();
  const [viewAnchor, setViewAnchor] = useState<null | HTMLElement>(null);
  const [presentAnchor, setPresentAnchor] = useState<null | HTMLElement>(null);

  const toolBtnSx = (disabled?: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '6px',
    height: 34, px: '10px', border: 0, background: 'transparent',
    color: disabled ? tokens.fg2 : '#374151',
    opacity: disabled ? 0.4 : 1,
    fontSize: 13, fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
    transition: TRANSITION, flexShrink: 0,
    '&:hover': disabled ? {} : { background: tokens.hover },
  });

  const widthLabel = docWidth >= DOC_WIDTH_MAX ? t('doc.fullWidth') : `${docWidth}px`;

  return (
    <Box sx={{
      height: 72, flexShrink: 0, display: 'flex', alignItems: 'center',
      gap: '16px', padding: '0 20px 0 32px',
      borderBottom: `1px solid ${tokens.border}`, background: tokens.chrome,
      position: 'relative', zIndex: 20,
    }}>

      {/* === Left: file info === */}
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {hasCurrentFile && <>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            <span style={{ fontSize: 13, color: tokens.fg3 }}>{breadcrumb}</span>
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em', color: tokens.fg1 }}>{fileName}</span>
          </Box>
          {stats && (
            <Box sx={{ fontSize: 11, color: tokens.fg3 }}>
              {stats.size} &nbsp;|&nbsp; {t('doc.statsLines', { count: stats.lines })} &nbsp;|&nbsp; {t('doc.statsCharacters', { count: stats.characters, formatted: stats.characters.toLocaleString(i18n.language) })} &nbsp;|&nbsp; {t('doc.statsSections', { count: stats.sections })}
            </Box>
          )}
        </>}
      </Box>

      {hasCurrentFile && <>
        {/* === View switch === */}
        <Box sx={{ display: 'flex', border: `1px solid ${tokens.border}`, flexShrink: 0 }}>
          <Box component="button" type="button" onClick={() => onViewChange('doc')}
            sx={{
              height: 32, px: '14px', border: 0, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              background: view === 'doc' ? BRAND.ACCENT : 'transparent',
              color: view === 'doc' ? '#ffffff' : tokens.fg2,
            }}
          >
            {t('toolbar.read')}
          </Box>
          <Box component="button" type="button" onClick={() => onViewChange('slides')}
            sx={{
              height: 32, px: '14px', border: 0, borderLeft: `1px solid ${tokens.border}`,
              fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              background: view === 'slides' ? BRAND.ACCENT : 'transparent',
              color: view === 'slides' ? '#ffffff' : tokens.fg2,
            }}
          >
            {t('toolbar.prepareSlides')}
          </Box>
        </Box>

        {/* === Tool group === */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>

          {/* View popover button */}
          <Box component="button" type="button" onClick={e => setViewAnchor(e.currentTarget)}
            title={t('toolbar.zoomAndWidth')}
            sx={toolBtnSx()}
          >
            <FormatSize sx={{ fontSize: 18, color: tokens.fg2 }} />
            <span>{t('toolbar.view')}</span>
            <span style={{ fontSize: 11, color: tokens.fg3, fontVariantNumeric: 'tabular-nums' }}>{zoom} %</span>
          </Box>
          <Popover
            open={!!viewAnchor}
            anchorEl={viewAnchor}
            onClose={() => setViewAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: {
              width: 260, borderRadius: 0, border: `1px solid ${tokens.border}`,
              boxShadow: MENU_SHADOW, p: '14px', mt: '6px',
            }}}}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Zoom row */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13 }}>{t('toolbar.zoom')}</span>
                <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${tokens.border}` }}>
                  <Box component="button" type="button" onClick={onZoomOut}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 28, border: 0, background: 'transparent', color: tokens.fg2, cursor: 'pointer', '&:hover': { background: tokens.hover } }}
                  ><Remove sx={{ fontSize: 15 }} /></Box>
                  <Box sx={{ minWidth: 44, textAlign: 'center', fontSize: 11, color: tokens.fg2, fontVariantNumeric: 'tabular-nums' }}>{zoom} %</Box>
                  <Box component="button" type="button" onClick={onZoomIn}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 28, border: 0, background: 'transparent', color: tokens.fg2, cursor: 'pointer', '&:hover': { background: tokens.hover } }}
                  ><Add sx={{ fontSize: 15 }} /></Box>
                </Box>
              </Box>
              {/* Text width row */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13 }}>{t('toolbar.textWidth')}</span>
                  <span style={{ fontSize: 11, color: tokens.fg2, fontVariantNumeric: 'tabular-nums' }}>{widthLabel}</span>
                </Box>
                <Slider
                  value={docWidth}
                  onChange={(_, v) => onDocWidthChange(v as number)}
                  min={DOC_WIDTH_MIN} max={DOC_WIDTH_MAX} step={DOC_WIDTH_STEP}
                  size="small"
                  sx={{ color: BRAND.ACCENT, '& .MuiSlider-thumb': { width: 12, height: 12 } }}
                />
              </Box>
              {/* Hints + reset row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: tokens.fg3 }}>
                <span>⌘+ / ⌘− / ⌘0</span>
                <Box
                  component="span"
                  onClick={() => { onZoomReset(); onDocWidthChange(DOC_WIDTH_DEFAULT); }}
                  sx={{ color: BRAND.ACCENT, cursor: 'pointer' }}
                >
                  {t('toolbar.reset')}
                </Box>
              </Box>
            </Box>
          </Popover>

          {/* Pointer */}
          <Box component="button" type="button" onClick={onToggleDocPointer}
            title={`${t('toolbar.pointer')} (P)`}
            sx={{
              ...toolBtnSx(),
              border: `1px solid ${docPointer ? BRAND.ACCENT : 'transparent'}`,
              color: docPointer ? BRAND.ACCENT : '#374151',
            }}
          >
            <MyLocation sx={{ fontSize: 17, color: docPointer ? BRAND.ACCENT : tokens.fg2 }} />
            <span>{t('toolbar.pointer')}</span>
          </Box>

          {/* Clear marks (conditional) */}
          {markCount > 0 && (
            <Box component="button" type="button" onClick={onClearMarks}
              title={t('doc.clearMarks')}
              sx={toolBtnSx()}
            >
              <FormatColorReset sx={{ fontSize: 17, color: tokens.fg2 }} />
              <span>{markCount} {markCount === 1 ? t('doc.markOne') : t('doc.markMany')}</span>
            </Box>
          )}

          {/* Reload */}
          <Box component="button" type="button" onClick={hasCurrentFile ? onReload : undefined}
            title={`${t('toolbar.reload')} (⌘R)`}
            sx={toolBtnSx(!hasCurrentFile)}
          >
            <Refresh sx={{ fontSize: 17, color: tokens.fg2 }} />
            <span>{t('toolbar.reload')}</span>
          </Box>

          {/* PDF */}
          <Box component="button" type="button" onClick={hasCurrentFile ? onExportPDF : undefined}
            title={`${t('toolbar.pdf')} (⌘P)`}
            sx={toolBtnSx(!hasCurrentFile)}
          >
            <PictureAsPdf sx={{ fontSize: 17, color: tokens.fg2 }} />
            <span>{t('toolbar.pdf')}</span>
          </Box>
        </Box>

        {/* === Present split button === */}
        <Box sx={{ display: 'flex', flexShrink: 0 }}>
          <Box component="button" type="button" onClick={onPresentFromStart}
            sx={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: 36, padding: '0 14px 0 16px', border: 0,
              background: BRAND.ACCENT, color: '#fff',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              transition: TRANSITION,
              '&:hover': { background: BRAND.ACCENT_HOVER },
            }}
          >
            <PlayArrow sx={{ fontSize: 18 }} />
            <span>{t('toolbar.present')}</span>
          </Box>
          <Box component="button" type="button"
            onClick={e => setPresentAnchor(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 36, border: 0,
              borderLeft: '1px solid rgba(255,255,255,.35)',
              background: BRAND.ACCENT, color: '#fff', cursor: 'pointer',
              transition: TRANSITION,
              '&:hover': { background: BRAND.ACCENT_HOVER },
            }}
          >
            <ExpandMore sx={{ fontSize: 16 }} />
          </Box>
          <Menu
            anchorEl={presentAnchor}
            open={!!presentAnchor}
            onClose={() => setPresentAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { width: 300, borderRadius: 0, border: `1px solid ${tokens.border}`, boxShadow: MENU_SHADOW, mt: '6px' }}}}
          >
            <MenuItem onClick={() => { setPresentAnchor(null); onPresentFromStart(); }}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', py: '9px', px: '14px' }}
            >
              <span style={{ fontSize: 13 }}>{t('toolbar.presentFromBeginning')}</span>
              <span style={{ fontSize: 11, color: tokens.fg3 }}>
                {t('toolbar.sectionsOf', { included: includedSections, total: totalSections })}
              </span>
            </MenuItem>
            <MenuItem onClick={() => { setPresentAnchor(null); onPresentFromCurrent(); }}
              sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', py: '9px', px: '14px' }}
            >
              <span style={{ fontSize: 13 }}>{t('toolbar.presentFromCurrent')}</span>
              <span style={{ fontSize: 11, color: tokens.fg3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                {currentSectionTitle}
              </span>
            </MenuItem>
            <Divider sx={{ my: '6px !important' }} />
            <MenuItem onClick={() => { setPresentAnchor(null); onChooseSections(); }}
              sx={{ fontSize: 13, py: '9px', px: '14px' }}
            >
              {t('toolbar.chooseSections')}
            </MenuItem>
          </Menu>
        </Box>
      </>}
    </Box>
  );
};
