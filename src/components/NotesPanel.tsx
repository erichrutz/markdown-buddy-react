import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { Close, ContentCopy, DeleteSweep, LinkOff } from '@mui/icons-material';
import { SurfaceTokens, BRAND } from '../theme/designTokens';
import { MarkInfo } from '../hooks/useTextMarker';

interface NotesPanelProps {
  tokens: SurfaceTokens;
  marks: MarkInfo[];
  scratchpad: string;
  onScratchpadChange: (text: string) => void;
  /** Open a highlight's note; `el` is the clicked list entry (fallback anchor). */
  onOpenMark: (id: string, el: HTMLElement) => void;
  onCopyAll: () => void;
  onClearAll: () => void;
  onClose: () => void;
}

/** Right-hand panel: free-text note for the document plus all highlights and their notes. */
export const NotesPanel: React.FC<NotesPanelProps> = ({
  tokens, marks, scratchpad, onScratchpadChange, onOpenMark, onCopyAll, onClearAll, onClose,
}) => {
  const { t } = useTranslation();
  const hasContent = marks.length > 0 || scratchpad.trim().length > 0;

  const iconBtnSx = (disabled?: boolean) => ({
    display: 'flex', alignItems: 'center', gap: '6px', height: 30, px: '8px', border: 0,
    background: 'transparent', color: tokens.fg2, fontSize: 12, fontFamily: 'inherit',
    cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.4 : 1,
    '&:hover': disabled ? {} : { background: tokens.hover },
  });

  const sectionLabelSx = {
    fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const,
    color: tokens.fg3, mb: '8px',
  };

  return (
    <Box
      component="aside"
      aria-label={t('notes.title')}
      sx={{
        width: 340, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderLeft: `1px solid ${tokens.border}`, background: tokens.chrome, minHeight: 0,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', p: '10px 10px 10px 16px', borderBottom: `1px solid ${tokens.border}` }}>
        <Box sx={{ flex: 1, fontSize: 14, fontWeight: 600, color: tokens.fg1 }}>{t('notes.title')}</Box>
        <Box component="button" type="button" onClick={hasContent ? onCopyAll : undefined}
          title={t('notes.copyAllHint')} sx={iconBtnSx(!hasContent)}>
          <ContentCopy sx={{ fontSize: 16 }} />
          <span>{t('notes.copyAll')}</span>
        </Box>
        <Box component="button" type="button" onClick={onClose} title={t('notes.close')} sx={iconBtnSx()}>
          <Close sx={{ fontSize: 18 }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: '16px' }}>
        {/* Document note */}
        <Box sx={sectionLabelSx}>{t('notes.documentNote')}</Box>
        <Box
          component="textarea"
          value={scratchpad}
          placeholder={t('notes.documentNotePlaceholder')}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onScratchpadChange(e.target.value)}
          sx={{
            width: '100%', boxSizing: 'border-box', minHeight: 140, resize: 'vertical', p: '8px',
            fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5, color: tokens.fg1,
            background: tokens.field, border: `1px solid ${tokens.border}`, outline: 'none',
            '&:focus': { borderColor: BRAND.ACCENT },
          }}
        />

        {/* Highlights */}
        <Box sx={{ display: 'flex', alignItems: 'center', mt: '20px', mb: '8px' }}>
          <Box sx={{ ...sectionLabelSx, mb: 0, flex: 1 }}>
            {t('notes.highlights')}{marks.length > 0 ? ` · ${marks.length}` : ''}
          </Box>
          {marks.length > 0 && (
            <Box component="button" type="button" onClick={onClearAll} title={t('notes.clearAll')}
              sx={{ ...iconBtnSx(), height: 24, px: '4px', color: tokens.fg3 }}>
              <DeleteSweep sx={{ fontSize: 16 }} />
            </Box>
          )}
        </Box>

        {marks.length === 0 ? (
          <Box sx={{ fontSize: 12, color: tokens.fg3, lineHeight: 1.5 }}>{t('notes.noHighlights')}</Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {marks.map((m, i) => {
              const showHeading = m.heading && m.heading !== marks[i - 1]?.heading;
              return (
                <React.Fragment key={m.id}>
                  {showHeading && (
                    <Box sx={{ fontSize: 12, fontWeight: 600, color: tokens.fg2, mt: i > 0 ? '6px' : 0 }}>{m.heading}</Box>
                  )}
                  <Box
                    component="button"
                    type="button"
                    onClick={(e: React.MouseEvent<HTMLElement>) => onOpenMark(m.id, e.currentTarget)}
                    sx={{
                      textAlign: 'left', p: '8px 10px', border: `1px solid ${tokens.border}`, background: tokens.paper,
                      fontFamily: 'inherit', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px',
                      '&:hover': { borderColor: BRAND.ACCENT },
                    }}
                  >
                    <Box sx={{
                      fontSize: 12, color: tokens.fg1, borderLeft: `3px solid ${BRAND.MARKER_BG}`, pl: '8px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {m.text}
                    </Box>
                    {m.note.trim() ? (
                      <Box sx={{ fontSize: 13, color: tokens.fg1, whiteSpace: 'pre-wrap', lineHeight: 1.45 }}>{m.note}</Box>
                    ) : (
                      <Box sx={{ fontSize: 12, color: tokens.fg3, fontStyle: 'italic' }}>{t('notes.addNote')}</Box>
                    )}
                    {m.detached && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 11, color: BRAND.DANGER }}>
                        <LinkOff sx={{ fontSize: 14 }} />{t('notes.detached')}
                      </Box>
                    )}
                  </Box>
                </React.Fragment>
              );
            })}
          </Box>
        )}

        <Box sx={{ mt: '24px', fontSize: 11, color: tokens.fg3, lineHeight: 1.5 }}>{t('notes.storageHint')}</Box>
      </Box>
    </Box>
  );
};
