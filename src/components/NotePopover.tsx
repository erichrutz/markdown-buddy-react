import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Popover } from '@mui/material';
import { DeleteOutline } from '@mui/icons-material';
import { SurfaceTokens, BRAND } from '../theme/designTokens';
import { MarkInfo } from '../hooks/useTextMarker';

interface NotePopoverProps {
  tokens: SurfaceTokens;
  mark: MarkInfo | null;
  position: { top: number; left: number } | null;
  onNoteChange: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

/** Small editor for the note attached to a highlight. Changes are saved as you type. */
export const NotePopover: React.FC<NotePopoverProps> = ({ tokens, mark, position, onNoteChange, onDelete, onClose }) => {
  const { t } = useTranslation();
  const open = !!mark && !!position;

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={position ?? { top: 0, left: 0 }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{ paper: { sx: { borderRadius: 0, border: `1px solid ${tokens.border}`, background: tokens.paper, boxShadow: '0 8px 24px rgba(17,24,39,.16)' } } }}
    >
      {mark && (
        <Box sx={{ width: 340, p: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Box sx={{
            fontSize: 12, color: tokens.fg2, borderLeft: `3px solid ${BRAND.MARKER_BG}`, pl: '8px',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {mark.text}
          </Box>
          <Box
            component="textarea"
            autoFocus
            value={mark.note}
            placeholder={t('notes.notePlaceholder')}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onNoteChange(mark.id, e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); onClose(); }
            }}
            sx={{
              minHeight: 110, resize: 'vertical', p: '8px', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.5,
              color: tokens.fg1, background: tokens.field, border: `1px solid ${tokens.border}`, outline: 'none',
              '&:focus': { borderColor: BRAND.ACCENT },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box component="button" type="button" onClick={() => onDelete(mark.id)}
              sx={{
                display: 'flex', alignItems: 'center', gap: '4px', border: 0, background: 'transparent', p: '4px 0',
                color: BRAND.DANGER, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              <DeleteOutline sx={{ fontSize: 16 }} />
              {t('notes.deleteHighlight')}
            </Box>
            <Box component="button" type="button" onClick={onClose}
              title="⌘/Ctrl + Enter"
              sx={{
                height: 30, px: '14px', border: 0, background: BRAND.ACCENT, color: '#ffffff',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
                '&:hover': { background: BRAND.ACCENT_HOVER },
              }}
            >
              {t('notes.done')}
            </Box>
          </Box>
        </Box>
      )}
    </Popover>
  );
};
