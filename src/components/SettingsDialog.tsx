import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  TextField,
  Select,
  MenuItem,
  Slider,
  Divider,
  Alert
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Settings as BehaviorIcon,
  AccountTree as DiagramIcon,
  FileDownload as ExportIcon,
  Keyboard as KeyboardIcon,
  Speed as PerformanceIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { ApplicationSettings, ThemeMode, FontSize, Language } from '../types/settings';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: ApplicationSettings;
  onUpdateSettings: (updates: Partial<ApplicationSettings>) => void;
  onUpdateAppearanceSettings: (updates: Partial<ApplicationSettings['appearance']>) => void;
  onUpdateBehaviorSettings: (updates: Partial<ApplicationSettings['behavior']>) => void;
  onUpdateDiagramSettings: (updates: Partial<ApplicationSettings['diagrams']>) => void;
  onUpdateExportSettings: (updates: Partial<ApplicationSettings['export']>) => void;
  onUpdateKeyboardSettings: (updates: Partial<ApplicationSettings['keyboard']>) => void;
  onUpdatePerformanceSettings: (updates: Partial<ApplicationSettings['performance']>) => void;
  onResetSettings: () => void;
  onExportSettings: () => string;
  onImportSettings: (settingsJson: string) => boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onClose,
  settings,
  onUpdateAppearanceSettings,
  onUpdateBehaviorSettings,
  onUpdateDiagramSettings,
  onUpdateExportSettings,
  onUpdateKeyboardSettings,
  onUpdatePerformanceSettings,
  onResetSettings,
  onExportSettings,
  onImportSettings
}) => {
  const { t } = useTranslation();
  const [currentTab, setCurrentTab] = useState(0);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleExport = () => {
    const exported = onExportSettings();
    navigator.clipboard.writeText(exported).then(() => {
      // Could show a success snackbar here
    });
  };

  const handleImport = () => {
    const success = onImportSettings(importText);
    if (success) {
      setImportText('');
      setImportError('');
      // Could show a success snackbar here
    } else {
      setImportError('Invalid settings format');
    }
  };

  const tabs = [
    { label: t('settings.appearance', 'Appearance'), icon: <PaletteIcon /> },
    { label: t('settings.behavior', 'Behavior'), icon: <BehaviorIcon /> },
    { label: t('settings.diagrams', 'Diagrams'), icon: <DiagramIcon /> },
    { label: t('settings.export', 'Export'), icon: <ExportIcon /> },
    { label: t('settings.keyboard', 'Keyboard'), icon: <KeyboardIcon /> },
    { label: t('settings.performance', 'Performance'), icon: <PerformanceIcon /> }
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <BehaviorIcon />
        {t('settings.title', 'Settings')}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', height: '500px' }}>
          {/* Sidebar with tabs */}
          <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider' }}>
            <Tabs
              orientation="vertical"
              value={currentTab}
              onChange={handleTabChange}
              sx={{ height: '100%' }}
            >
              {tabs.map((tab, index) => (
                <Tab
                  key={index}
                  icon={tab.icon}
                  label={tab.label}
                  iconPosition="start"
                  sx={{
                    justifyContent: 'flex-start',
                    minHeight: 60,
                    textAlign: 'left'
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Content area */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {/* Appearance Tab */}
            <TabPanel value={currentTab} index={0}>
              <Typography variant="h6" gutterBottom>
                {t('settings.appearance', 'Appearance')}
              </Typography>

              <FormControl component="fieldset" sx={{ mb: 3 }}>
                <FormLabel component="legend">{t('settings.theme', 'Theme')}</FormLabel>
                <RadioGroup
                  value={settings.appearance.theme}
                  onChange={(e) => onUpdateAppearanceSettings({ theme: e.target.value as ThemeMode })}
                >
                  <FormControlLabel value="light" control={<Radio />} label={t('settings.lightMode', 'Light')} />
                  <FormControlLabel value="dark" control={<Radio />} label={t('settings.darkMode', 'Dark')} />
                  <FormControlLabel value="auto" control={<Radio />} label={t('settings.autoMode', 'Auto (System)')} />
                </RadioGroup>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <FormLabel>{t('settings.fontSize', 'Font Size')}</FormLabel>
                <Select
                  value={settings.appearance.fontSize}
                  onChange={(e) => onUpdateAppearanceSettings({ fontSize: e.target.value as FontSize })}
                >
                  <MenuItem value="small">{t('settings.small', 'Small')}</MenuItem>
                  <MenuItem value="medium">{t('settings.medium', 'Medium')}</MenuItem>
                  <MenuItem value="large">{t('settings.large', 'Large')}</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label={t('settings.fontFamily', 'Font Family')}
                value={settings.appearance.fontFamily}
                onChange={(e) => onUpdateAppearanceSettings({ fontFamily: e.target.value })}
                sx={{ mb: 3 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.appearance.compactMode}
                    onChange={(e) => onUpdateAppearanceSettings({ compactMode: e.target.checked })}
                  />
                }
                label={t('settings.compactMode', 'Compact Mode')}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.appearance.wordWrap}
                    onChange={(e) => onUpdateAppearanceSettings({ wordWrap: e.target.checked })}
                  />
                }
                label={t('settings.wordWrap', 'Word Wrap')}
              />
            </TabPanel>

            {/* Behavior Tab */}
            <TabPanel value={currentTab} index={1}>
              <Typography variant="h6" gutterBottom>
                {t('settings.behavior', 'Behavior')}
              </Typography>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <FormLabel>{t('settings.language', 'Language')}</FormLabel>
                <Select
                  value={settings.behavior.language}
                  onChange={(e) => onUpdateBehaviorSettings({ language: e.target.value as Language })}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.behavior.rememberLastFolder}
                    onChange={(e) => onUpdateBehaviorSettings({ rememberLastFolder: e.target.checked })}
                  />
                }
                label={t('settings.rememberLastFolder', 'Remember Last Folder')}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.behavior.openLinksInNewTab}
                    onChange={(e) => onUpdateBehaviorSettings({ openLinksInNewTab: e.target.checked })}
                  />
                }
                label={t('settings.openLinksInNewTab', 'Open Links in New Tab')}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.behavior.confirmBeforeExit}
                    onChange={(e) => onUpdateBehaviorSettings({ confirmBeforeExit: e.target.checked })}
                  />
                }
                label={t('settings.confirmBeforeExit', 'Confirm Before Exit')}
              />
            </TabPanel>

            {/* Diagrams Tab */}
            <TabPanel value={currentTab} index={2}>
              <Typography variant="h6" gutterBottom>
                {t('settings.diagrams', 'Diagrams')}
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.diagrams.enableMermaid}
                    onChange={(e) => onUpdateDiagramSettings({ enableMermaid: e.target.checked })}
                  />
                }
                label={t('settings.enableMermaid', 'Enable Mermaid Diagrams')}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.diagrams.enablePlantUML}
                    onChange={(e) => onUpdateDiagramSettings({ enablePlantUML: e.target.checked })}
                  />
                }
                label={t('settings.enablePlantUML', 'Enable PlantUML Diagrams')}
                sx={{ mb: 3 }}
              />

              <TextField
                fullWidth
                label={t('settings.plantUMLServer', 'PlantUML Server')}
                value={settings.diagrams.plantUMLServer}
                onChange={(e) => onUpdateDiagramSettings({ plantUMLServer: e.target.value })}
                sx={{ mb: 3 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.diagrams.cacheEnabled}
                    onChange={(e) => onUpdateDiagramSettings({ cacheEnabled: e.target.checked })}
                  />
                }
                label={t('settings.enableCache', 'Enable Diagram Caching')}
                sx={{ mb: 3 }}
              />

              <Box sx={{ mb: 3 }}>
                <FormLabel>{t('settings.cacheSize', 'Cache Size (MB)')}</FormLabel>
                <Slider
                  value={settings.diagrams.cacheSize}
                  onChange={(_, value) => onUpdateDiagramSettings({ cacheSize: value as number })}
                  min={10}
                  max={500}
                  step={10}
                  valueLabelDisplay="auto"
                  sx={{ mt: 2 }}
                />
              </Box>
            </TabPanel>

            {/* Export Tab */}
            <TabPanel value={currentTab} index={3}>
              <Typography variant="h6" gutterBottom>
                {t('settings.export', 'Export Settings')}
              </Typography>

              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                  <FormControl fullWidth>
                    <FormLabel>{t('settings.defaultFormat', 'Default Format')}</FormLabel>
                    <Select
                      value={settings.export.defaultFormat}
                      onChange={(e) => onUpdateExportSettings({ defaultFormat: e.target.value as any })}
                    >
                      <MenuItem value="A4">A4</MenuItem>
                      <MenuItem value="Letter">Letter</MenuItem>
                      <MenuItem value="Legal">Legal</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ flex: '1 1 45%', minWidth: 200 }}>
                  <FormControl fullWidth>
                    <FormLabel>{t('settings.defaultOrientation', 'Default Orientation')}</FormLabel>
                    <Select
                      value={settings.export.defaultOrientation}
                      onChange={(e) => onUpdateExportSettings({ defaultOrientation: e.target.value as any })}
                    >
                      <MenuItem value="portrait">{t('settings.portrait', 'Portrait')}</MenuItem>
                      <MenuItem value="landscape">{t('settings.landscape', 'Landscape')}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.export.includeHeaders}
                    onChange={(e) => onUpdateExportSettings({ includeHeaders: e.target.checked })}
                  />
                }
                label={t('settings.includeHeaders', 'Include Headers')}
                sx={{ mb: 2, mt: 3 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.export.includeFooters}
                    onChange={(e) => onUpdateExportSettings({ includeFooters: e.target.checked })}
                  />
                }
                label={t('settings.includeFooters', 'Include Footers')}
              />
            </TabPanel>

            {/* Keyboard Tab */}
            <TabPanel value={currentTab} index={4}>
              <Typography variant="h6" gutterBottom>
                {t('settings.keyboard', 'Keyboard & Shortcuts')}
              </Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.keyboard.enableShortcuts}
                    onChange={(e) => onUpdateKeyboardSettings({ enableShortcuts: e.target.checked })}
                  />
                }
                label={t('settings.enableShortcuts', 'Enable Keyboard Shortcuts')}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.keyboard.emulateVSCode}
                    onChange={(e) => onUpdateKeyboardSettings({ emulateVSCode: e.target.checked })}
                  />
                }
                label={t('settings.emulateVSCode', 'VS Code Style Shortcuts')}
              />
            </TabPanel>

            {/* Performance Tab */}
            <TabPanel value={currentTab} index={5}>
              <Typography variant="h6" gutterBottom>
                {t('settings.performance', 'Performance')}
              </Typography>

              <Box sx={{ mb: 3 }}>
                <FormLabel>{t('settings.maxFileSize', 'Max File Size (MB)')}</FormLabel>
                <Slider
                  value={settings.performance.maxFileSize}
                  onChange={(_, value) => onUpdatePerformanceSettings({ maxFileSize: value as number })}
                  min={1}
                  max={100}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ mt: 2 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <FormLabel>{t('settings.searchDebounce', 'Search Debounce (ms)')}</FormLabel>
                <Slider
                  value={settings.performance.searchDebounce}
                  onChange={(_, value) => onUpdatePerformanceSettings({ searchDebounce: value as number })}
                  min={50}
                  max={1000}
                  step={50}
                  valueLabelDisplay="auto"
                  sx={{ mt: 2 }}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={settings.performance.lazyLoading}
                    onChange={(e) => onUpdatePerformanceSettings({ lazyLoading: e.target.checked })}
                  />
                }
                label={t('settings.lazyLoading', 'Lazy Loading')}
              />
            </TabPanel>
          </Box>
        </Box>

        {/* Import/Export Section */}
        <Divider sx={{ mt: 2 }} />
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('settings.importExport', 'Import/Export Settings')}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="outlined" onClick={handleExport}>
              {t('settings.exportToClipboard', 'Export to Clipboard')}
            </Button>
            <Button variant="outlined" color="error" onClick={onResetSettings}>
              {t('settings.resetToDefaults', 'Reset to Defaults')}
            </Button>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder={t('settings.pasteSettingsHere', 'Paste settings JSON here...')}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          {importError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {importError}
            </Alert>
          )}

          <Button 
            variant="contained" 
            onClick={handleImport}
            disabled={!importText.trim()}
          >
            {t('settings.importSettings', 'Import Settings')}
          </Button>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          {t('ui.close', 'Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};