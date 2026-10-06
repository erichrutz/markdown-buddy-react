import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import {
  Refresh,
  PictureAsPdf,
  DarkMode,
  LightMode,
  InfoOutlined,
  Settings,
  PlayArrow,
  FolderOpen,
} from '@mui/icons-material';
import { SurfaceTokens, BRAND } from '../theme/designTokens';
import { isDBBrand, PRODUCT_NAME } from '../theme/brand';

import defaultLogo from '../img/logo.svg';

// DB logo lives in public/ (gitignored) and is referenced by URL path
const appLogo = isDBBrand ? `${import.meta.env.BASE_URL}img/DB_logo_red_100px_rgb.svg` : defaultLogo;

// Lets span-based buttons be triggered with Enter/Space like native buttons.
const activateOnKey = (handler?: () => void) => (e: React.KeyboardEvent) => {
  if (handler && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    handler();
  }
};

interface AppHeaderProps {
  tokens: SurfaceTokens;
  isDark: boolean;
  folderName?: string | null;
  onSelectDirectory?: () => void;
  onRefresh?: () => void;
  onExportPDF?: () => void;
  onToggleTheme?: () => void;
  onShowAbout?: () => void;
  onShowSettings?: () => void;
  onStartPresent?: () => void;
  hasCurrentFile?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  tokens,
  isDark,
  folderName,
  onSelectDirectory,
  onRefresh,
  onExportPDF,
  onToggleTheme,
  onShowAbout,
  onShowSettings,
  onStartPresent,
  hasCurrentFile = false,
}) => {
  const { t } = useTranslation();
  const toolButtons = [
    { icon: <Refresh sx={{ fontSize: 19, color: 'inherit' }} />, title: t('header.reload'), onClick: onRefresh, disabled: !hasCurrentFile },
    { icon: <PictureAsPdf sx={{ fontSize: 19, color: 'inherit' }} />, title: t('header.exportPdf'), onClick: onExportPDF, disabled: !hasCurrentFile },
    { icon: isDark ? <LightMode sx={{ fontSize: 19, color: 'inherit' }} /> : <DarkMode sx={{ fontSize: 19, color: 'inherit' }} />, title: t('header.toggleTheme'), onClick: onToggleTheme },
    { icon: <InfoOutlined sx={{ fontSize: 19, color: 'inherit' }} />, title: t('header.about'), onClick: onShowAbout },
    { icon: <Settings sx={{ fontSize: 19, color: 'inherit' }} />, title: t('header.settings'), onClick: onShowSettings },
  ];

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        height: '56px',
        minHeight: '56px',
        paddingLeft: '20px',
        paddingRight: '16px',
        backgroundColor: tokens.chrome,
        borderBottom: `1px solid ${tokens.border}`,
        flexShrink: 0,
        overflow: 'visible',
        boxSizing: 'border-box',
      }}
    >
      {/* App logo */}
      <img
        src={appLogo}
        alt={PRODUCT_NAME}
        style={{ height: 24, width: 'auto', display: 'block', flexShrink: 0 }}
      />

      {/* Product name */}
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', color: tokens.fg1, whiteSpace: 'nowrap', flexShrink: 0 }}>
        {PRODUCT_NAME}
      </span>

      {/* Separator */}
      <span style={{ width: 1, height: 20, backgroundColor: tokens.border, flexShrink: 0, display: 'inline-block' }} />

      {/* Store display — click to open folder */}
      <span
        role="button"
        tabIndex={0}
        aria-label={t('header.openFolder')}
        onKeyDown={activateOnKey(onSelectDirectory)}
        title={`${t('header.openFolder')} – ${t('ui.selectFolderInfo')}`}
        onClick={onSelectDirectory}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: tokens.fg2, whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer' }}
      >
        <FolderOpen sx={{ fontSize: 16, color: 'inherit' }} />
        {folderName || t('header.openFolderPlaceholder')}
      </span>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Tool icon buttons */}
      <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
        {toolButtons.map((btn, i) => (
          <span
            key={i}
            role="button"
            tabIndex={btn.disabled ? -1 : 0}
            aria-label={btn.title}
            aria-disabled={btn.disabled || undefined}
            title={btn.title}
            onClick={btn.disabled ? undefined : btn.onClick}
            onKeyDown={btn.disabled ? undefined : activateOnKey(btn.onClick)}
            className="header-tool-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              cursor: btn.disabled ? 'default' : 'pointer',
              color: tokens.fg2,
              opacity: btn.disabled ? 0.4 : 1,
              borderRadius: 0,
              border: 'none',
              background: 'transparent',
              transition: 'background 180ms cubic-bezier(.4,0,.2,1), color 180ms cubic-bezier(.4,0,.2,1)',
            }}
            onMouseEnter={e => {
              if (!btn.disabled) {
                (e.currentTarget as HTMLElement).style.background = tokens.hover;
                (e.currentTarget as HTMLElement).style.color = tokens.fg1;
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = tokens.fg2;
            }}
          >
            {btn.icon}
          </span>
        ))}
      </span>

      {/* Present button */}
      <span
        role="button"
        tabIndex={0}
        onClick={onStartPresent}
        onKeyDown={activateOnKey(onStartPresent)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 34,
          paddingLeft: 16,
          paddingRight: 16,
          marginLeft: 8,
          backgroundColor: BRAND.ACCENT,
          color: '#fff',
          border: 'none',
          borderRadius: 0,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'Noto Sans', Arial, sans-serif",
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
          transition: 'background 180ms cubic-bezier(.4,0,.2,1)',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = BRAND.ACCENT_HOVER; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = BRAND.ACCENT; }}
      >
        <PlayArrow sx={{ fontSize: 18, color: 'inherit' }} />
        {t('header.present')}
      </span>
    </Box>
  );
};
