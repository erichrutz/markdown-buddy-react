import { SessionData } from '../types';

export class SessionService {
  private static readonly STORAGE_KEYS = {
    LAST_FOLDER: 'markdownBuddy_lastFolder',
    LAST_FILE: 'markdownBuddy_lastFile',
    EXPANDED_FOLDERS: 'markdownBuddy_expandedFolders',
    LANGUAGE: 'markdownBuddy_language',
    FOCUS_MODE: 'markdownBuddy_focusMode'
  };

  static saveSession(data: Partial<SessionData>): void {
    try {
      if (data.lastFolder !== undefined) {
        localStorage.setItem(this.STORAGE_KEYS.LAST_FOLDER, data.lastFolder);
      }
      
      if (data.lastFile !== undefined) {
        localStorage.setItem(this.STORAGE_KEYS.LAST_FILE, data.lastFile);
      }
      
      if (data.expandedFolders !== undefined) {
        localStorage.setItem(
          this.STORAGE_KEYS.EXPANDED_FOLDERS, 
          JSON.stringify(data.expandedFolders)
        );
      }
      
      if (data.language !== undefined) {
        localStorage.setItem(this.STORAGE_KEYS.LANGUAGE, data.language);
      }
      
      if (data.focusMode !== undefined) {
        localStorage.setItem(this.STORAGE_KEYS.FOCUS_MODE, data.focusMode.toString());
      }
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }

  static loadSession(): SessionData {
    try {
      const lastFolder = localStorage.getItem(this.STORAGE_KEYS.LAST_FOLDER) || undefined;
      const lastFile = localStorage.getItem(this.STORAGE_KEYS.LAST_FILE) || undefined;
      const expandedFoldersStr = localStorage.getItem(this.STORAGE_KEYS.EXPANDED_FOLDERS);
      const language = localStorage.getItem(this.STORAGE_KEYS.LANGUAGE) || 'de';
      const focusMode = localStorage.getItem(this.STORAGE_KEYS.FOCUS_MODE) === 'true';
      
      let expandedFolders: string[] = [];
      if (expandedFoldersStr) {
        try {
          expandedFolders = JSON.parse(expandedFoldersStr);
        } catch {
          expandedFolders = [];
        }
      }
      
      return {
        lastFolder,
        lastFile,
        expandedFolders,
        language,
        focusMode
      };
    } catch (error) {
      console.warn('Failed to load session data:', error);
      return {
        expandedFolders: [],
        language: 'de',
        focusMode: false
      };
    }
  }

  static clearSession(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }

  static saveExpandedFolders(expandedIds: string[]): void {
    this.saveSession({ expandedFolders: expandedIds });
  }

  static saveCurrentFile(filePath: string): void {
    this.saveSession({ lastFile: filePath });
  }

  static saveLanguage(language: string): void {
    this.saveSession({ language });
  }

  static saveFocusMode(focusMode: boolean): void {
    this.saveSession({ focusMode });
  }

  static shouldRestoreSession(): boolean {
    const session = this.loadSession();
    return !!(session.lastFolder && session.lastFile);
  }

  static getLastOpenedFile(): { folder?: string; file?: string } {
    const session = this.loadSession();
    return {
      folder: session.lastFolder,
      file: session.lastFile
    };
  }
}