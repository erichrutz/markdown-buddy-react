import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ApplicationSettings, DEFAULT_SETTINGS } from '../types/settings';

const SETTINGS_STORAGE_KEY = 'markdown-buddy-settings';

export const useSettings = () => {
  const { i18n } = useTranslation();
  const [osThemeChangeCounter, setOsThemeChangeCounter] = useState(0);
  const initializedRef = useRef(false);
  const [settings, setSettings] = useState<ApplicationSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all properties exist
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          appearance: { ...DEFAULT_SETTINGS.appearance, ...parsed.appearance },
          behavior: { ...DEFAULT_SETTINGS.behavior, ...parsed.behavior },
          diagrams: { ...DEFAULT_SETTINGS.diagrams, ...parsed.diagrams },
          export: { ...DEFAULT_SETTINGS.export, ...parsed.export },
          keyboard: { ...DEFAULT_SETTINGS.keyboard, ...parsed.keyboard },
          performance: { ...DEFAULT_SETTINGS.performance, ...parsed.performance }
        };
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      const toSave = {
        ...settings,
        lastModified: new Date()
      };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error);
    }
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<ApplicationSettings>) => {
    setSettings(current => ({
      ...current,
      ...updates,
      lastModified: new Date()
    }));
  }, []);

  const updateAppearanceSettings = useCallback((updates: Partial<ApplicationSettings['appearance']>) => {
    setSettings(current => ({
      ...current,
      appearance: {
        ...current.appearance,
        ...updates
      },
      lastModified: new Date()
    }));
  }, []);

  const updateBehaviorSettings = useCallback((updates: Partial<ApplicationSettings['behavior']>) => {
    setSettings(current => ({
      ...current,
      behavior: {
        ...current.behavior,
        ...updates
      },
      lastModified: new Date()
    }));
    
    // Update i18n language if language setting changed
    if (updates.language && updates.language !== i18n.language) {
      i18n.changeLanguage(updates.language);
    }
  }, [i18n]);

  const updateDiagramSettings = useCallback((updates: Partial<ApplicationSettings['diagrams']>) => {
    setSettings(current => ({
      ...current,
      diagrams: {
        ...current.diagrams,
        ...updates
      },
      lastModified: new Date()
    }));
  }, []);

  const updateExportSettings = useCallback((updates: Partial<ApplicationSettings['export']>) => {
    setSettings(current => ({
      ...current,
      export: {
        ...current.export,
        ...updates
      },
      lastModified: new Date()
    }));
  }, []);

  const updateKeyboardSettings = useCallback((updates: Partial<ApplicationSettings['keyboard']>) => {
    setSettings(current => ({
      ...current,
      keyboard: {
        ...current.keyboard,
        ...updates
      },
      lastModified: new Date()
    }));
  }, []);

  const updatePerformanceSettings = useCallback((updates: Partial<ApplicationSettings['performance']>) => {
    setSettings(current => ({
      ...current,
      performance: {
        ...current.performance,
        ...updates
      },
      lastModified: new Date()
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }, []);

  const exportSettings = useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = useCallback((settingsJson: string): boolean => {
    try {
      const imported = JSON.parse(settingsJson);
      
      // Validate that it's a valid settings object
      if (typeof imported === 'object' && imported.appearance && imported.behavior) {
        const merged = {
          ...DEFAULT_SETTINGS,
          ...imported,
          version: DEFAULT_SETTINGS.version, // Always use current version
          lastModified: new Date()
        };
        setSettings(merged);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }, []);

  // Helper to get current theme considering auto mode
  const getEffectiveTheme = useCallback(() => {
    if (settings.appearance.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return settings.appearance.theme;
  }, [settings.appearance.theme, osThemeChangeCounter]);

  // Listen for OS theme changes when in auto mode
  useEffect(() => {
    if (settings.appearance.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        // Force a re-render when OS theme changes
        setOsThemeChangeCounter(prev => prev + 1);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.appearance.theme]);

  // Initialize settings language to match current i18n language on first load
  useEffect(() => {
    if (!initializedRef.current && settings.behavior.language !== i18n.language) {
      // Update settings to match current i18n language instead of changing the language
      setSettings(current => ({
        ...current,
        behavior: {
          ...current.behavior,
          language: i18n.language as 'en' | 'de'
        },
        lastModified: new Date()
      }));
      initializedRef.current = true;
    }
  }, [settings.behavior.language, i18n.language]); // Run when either changes

  // Sync i18n language with settings when settings change (only after initialization)
  useEffect(() => {
    if (initializedRef.current && settings.behavior.language !== i18n.language) {
      i18n.changeLanguage(settings.behavior.language);
    }
  }, [settings.behavior.language, i18n]);

  // Helper to get current diagram theme
  const getEffectiveDiagramTheme = useCallback(() => {
    if (settings.diagrams.diagramTheme === 'auto') {
      return getEffectiveTheme();
    }
    return settings.diagrams.diagramTheme;
  }, [settings.diagrams.diagramTheme, getEffectiveTheme]);

  return {
    settings,
    updateSettings,
    updateAppearanceSettings,
    updateBehaviorSettings,
    updateDiagramSettings,
    updateExportSettings,
    updateKeyboardSettings,
    updatePerformanceSettings,
    resetSettings,
    exportSettings,
    importSettings,
    getEffectiveTheme,
    getEffectiveDiagramTheme
  };
};