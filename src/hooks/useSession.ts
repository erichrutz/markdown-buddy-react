import { useState, useCallback, useEffect } from 'react';
import { SessionService } from '../services/sessionService';
import { useTranslation } from 'react-i18next';

export const useSession = () => {
  const { i18n } = useTranslation();
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [sidebarVisible, setSidebarVisible] = useState<boolean>(true);

  useEffect(() => {
    const session = SessionService.loadSession();
    setExpandedFolders(session.expandedFolders);
    setFocusMode(session.focusMode || false);
    setSidebarVisible(session.sidebarVisible !== false); // Default to true
    
    if (session.language && session.language !== i18n.language) {
      i18n.changeLanguage(session.language);
    }
  }, [i18n]);

  const saveExpandedFolders = useCallback((folders: string[]) => {
    setExpandedFolders(folders);
    SessionService.saveExpandedFolders(folders);
  }, []);

  const saveCurrentFile = useCallback((filePath: string) => {
    SessionService.saveCurrentFile(filePath);
  }, []);

  const changeLanguage = useCallback((language: string) => {
    i18n.changeLanguage(language);
    SessionService.saveLanguage(language);
  }, [i18n]);

  const toggleFocusMode = useCallback(() => {
    const newFocusMode = !focusMode;
    setFocusMode(newFocusMode);
    SessionService.saveFocusMode(newFocusMode);
  }, [focusMode]);

  const toggleSidebar = useCallback(() => {
    const newSidebarVisible = !sidebarVisible;
    setSidebarVisible(newSidebarVisible);
    SessionService.saveSidebarVisible(newSidebarVisible);
  }, [sidebarVisible]);

  const clearSession = useCallback(() => {
    SessionService.clearSession();
    setExpandedFolders([]);
    setFocusMode(false);
    setSidebarVisible(true);
  }, []);

  const shouldRestoreSession = useCallback(() => {
    return SessionService.shouldRestoreSession();
  }, []);

  const getLastOpenedFile = useCallback(() => {
    return SessionService.getLastOpenedFile();
  }, []);

  return {
    expandedFolders,
    focusMode,
    sidebarVisible,
    saveExpandedFolders,
    saveCurrentFile,
    changeLanguage,
    toggleFocusMode,
    toggleSidebar,
    clearSession,
    shouldRestoreSession,
    getLastOpenedFile
  };
};