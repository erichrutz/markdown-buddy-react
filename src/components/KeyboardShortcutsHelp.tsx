import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
  formatShortcut: (shortcut: KeyboardShortcut) => string;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  open,
  onClose,
  shortcuts,
  formatShortcut
}) => {
  const { t } = useTranslation();

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((groups, shortcut) => {
    const category = shortcut.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);

  const categoryOrder: Array<keyof typeof groupedShortcuts> = ['navigation', 'view', 'file', 'custom'];
  const categoryTitles: Record<string, string> = {
    navigation: t('shortcuts.navigation'),
    view: t('shortcuts.view'),
    file: t('shortcuts.file'),
    custom: t('shortcuts.custom')
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {t('shortcuts.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('shortcuts.subtitle')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {categoryOrder.map((category, categoryIndex) => {
          const categoryShortcuts = groupedShortcuts[category];
          if (!categoryShortcuts || categoryShortcuts.length === 0) return null;

          return (
            <Box key={category} sx={{ mb: categoryIndex < categoryOrder.length - 1 ? 3 : 0 }}>
              <Typography
                variant="subtitle1"
                color="primary"
                gutterBottom
                sx={{ fontWeight: 600, mb: 2 }}
              >
                {categoryTitles[category]}
              </Typography>

              {categoryShortcuts.map((shortcut, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    px: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {shortcut.description}
                  </Typography>
                  
                  <Chip
                    label={formatShortcut(shortcut)}
                    size="small"
                    variant="outlined"
                    sx={{
                      ml: 2,
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      backgroundColor: 'background.paper',
                      borderColor: 'divider'
                    }}
                  />
                </Box>
              ))}

              {categoryIndex < categoryOrder.length - 1 && (
                <Divider sx={{ mt: 2 }} />
              )}
            </Box>
          );
        })}

        {shortcuts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {t('shortcuts.noShortcuts')}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('ui.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};