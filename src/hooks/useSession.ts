import { useState, useCallback, useEffect } from 'react';
import { SessionService } from '../services/sessionService';
import { useTranslation } from 'react-i18next';

export const useSession = () => {
  const { i18n } = useTranslation();
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);

  useEffect(() => {
    const session = SessionService.loadSession();
    setExpandedFolders(session.expandedFolders);
    
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

  const clearSession = useCallback(() => {
    SessionService.clearSession();
    setExpandedFolders([]);
  }, []);

  const shouldRestoreSession = useCallback(() => {
    return SessionService.shouldRestoreSession();
  }, []);

  const getLastOpenedFile = useCallback(() => {
    return SessionService.getLastOpenedFile();
  }, []);

  return {
    expandedFolders,
    saveExpandedFolders,
    saveCurrentFile,
    changeLanguage,
    clearSession,
    shouldRestoreSession,
    getLastOpenedFile
  };
};