import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box
} from '@mui/material';
import {
  FolderOpen,
  Language,
  MenuBook,
  Fullscreen,
  FullscreenExit,
  Keyboard,
  PictureAsPdf,
  Refresh,
  Warning,
  Settings
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface AppHeaderProps {
  onSelectDirectory: () => void;
  loading: boolean;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onShowShortcuts?: () => void;
  onExportPDF?: () => void;
  onRefresh?: () => void;
  onShowSettings?: () => void;
  hasCurrentFile?: boolean;
  hasFileChanged?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onSelectDirectory,
  loading,
  focusMode,
  onToggleFocusMode,
  onShowShortcuts,
  onExportPDF,
  onRefresh,
  onShowSettings,
  hasCurrentFile = false,
  hasFileChanged = false
}) => {
  const { t, i18n } = useTranslation();
  const [languageAnchor, setLanguageAnchor] = React.useState<null | HTMLElement>(null);

  const handleLanguageClick = (event: React.MouseEvent<HTMLElement>) => {
    setLanguageAnchor(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLanguageAnchor(null);
  };

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    handleLanguageClose();
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <MenuBook sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {t('app.title')}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<FolderOpen />}
            onClick={onSelectDirectory}
            disabled={loading}
          >
            {t('ui.selectFolder')}
          </Button>

          <IconButton
            color="inherit"
            onClick={onToggleFocusMode}
            size="large"
            title={focusMode ? t('ui.exitFocusMode') : t('ui.focusMode')}
          >
            {focusMode ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>


          {onExportPDF && (
            <IconButton
              color="inherit"
              onClick={onExportPDF}
              size="large"
              title={t('export.title')}
              disabled={!hasCurrentFile || loading}
            >
              <PictureAsPdf />
            </IconButton>
          )}

          {onRefresh && (
            <IconButton
              color="inherit"
              onClick={onRefresh}
              size="large"
              title={hasFileChanged ? t('ui.refreshChanged') : t('ui.refresh')}
              disabled={!hasCurrentFile || loading}
              sx={{
                position: 'relative',
                '&::after': hasFileChanged ? {
                  content: '""',
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'warning.main',
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                    '50%': {
                      transform: 'scale(1.2)',
                      opacity: 0.7,
                    },
                    '100%': {
                      transform: 'scale(1)',
                      opacity: 1,
                    },
                  }
                } : {}
              }}
            >
              {hasFileChanged ? (
                <Box sx={{ position: 'relative' }}>
                  <Refresh />
                  <Warning 
                    sx={{ 
                      position: 'absolute', 
                      top: -4, 
                      right: -4, 
                      fontSize: 12,
                      color: 'warning.main'
                    }} 
                  />
                </Box>
              ) : (
                <Refresh />
              )}
            </IconButton>
          )}

          {onShowShortcuts && (
            <IconButton
              color="inherit"
              onClick={onShowShortcuts}
              size="large"
              title={t('shortcuts.title')}
            >
              <Keyboard />
            </IconButton>
          )}

          {onShowSettings && (
            <IconButton
              color="inherit"
              onClick={onShowSettings}
              size="large"
              title={t('settings.title', 'Settings')}
            >
              <Settings />
            </IconButton>
          )}

          <IconButton
            color="inherit"
            onClick={handleLanguageClick}
            size="large"
          >
            <Language />
          </IconButton>

          <Menu
            anchorEl={languageAnchor}
            open={Boolean(languageAnchor)}
            onClose={handleLanguageClose}
          >
            <MenuItem 
              onClick={() => handleLanguageChange('de')}
              selected={i18n.language === 'de'}
            >
              Deutsch
            </MenuItem>
            <MenuItem 
              onClick={() => handleLanguageChange('en')}
              selected={i18n.language === 'en'}
            >
              English
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};