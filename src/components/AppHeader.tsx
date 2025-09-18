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
  MenuBook
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface AppHeaderProps {
  onSelectDirectory: () => void;
  loading: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onSelectDirectory,
  loading
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