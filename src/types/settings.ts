export type ThemeMode = 'light' | 'dark' | 'auto';
export type FontSize = 'small' | 'medium' | 'large';
export type Language = 'en' | 'de';

export interface AppearanceSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  fontFamily: string;
  showLineNumbers: boolean;
  wordWrap: boolean;
}

export interface BehaviorSettings {
  language: Language;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  confirmBeforeExit: boolean;
  rememberLastFolder: boolean;
  openLinksInNewTab: boolean;
}

export interface DiagramSettings {
  enableMermaid: boolean;
  enablePlantUML: boolean;
  diagramTheme: 'light' | 'dark' | 'auto';
  mermaidTheme: string;
  plantUMLServer: string;
}

export interface ExportSettings {
  defaultFormat: 'A4' | 'Letter' | 'Legal';
  defaultOrientation: 'portrait' | 'landscape';
  pdfQuality: 'low' | 'medium' | 'high';
  exportPath: string;
}

export interface KeyboardSettings {
  enableShortcuts: boolean;
  customShortcuts: Record<string, string>;
  vimMode: boolean;
}

export interface PerformanceSettings {
  maxFileSize: number; // in MB
  renderTimeout: number; // in ms
  searchDebounce: number; // in ms
  enableAnalytics: boolean;
}

export interface ViewSettings {
  zoom: number; // document text zoom in percent
  docWidth: number; // document content width in px
  docPointer: boolean; // cursor overlay in document view
  presPointer: boolean; // laser pointer active in presentation
  presTheme: 'light' | 'dark'; // presentation stage theme
}

export interface ApplicationSettings {
  appearance: AppearanceSettings;
  behavior: BehaviorSettings;
  view: ViewSettings;
  diagrams: DiagramSettings;
  export: ExportSettings;
  keyboard: KeyboardSettings;
  performance: PerformanceSettings;
  version: string;
  lastModified: Date;
}

// Default settings
export const DEFAULT_SETTINGS: ApplicationSettings = {
  appearance: {
    theme: 'auto',
    fontSize: 'medium',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    showLineNumbers: false,
    wordWrap: true
  },
  behavior: {
    language: 'en',
    autoSave: false,
    autoSaveInterval: 30,
    confirmBeforeExit: true,
    rememberLastFolder: true,
    openLinksInNewTab: false
  },
  view: {
    zoom: 100,
    docWidth: 900, // matches DOC_WIDTH_DEFAULT in theme/designTokens.ts
    docPointer: false,
    presPointer: true,
    presTheme: 'light'
  },
  diagrams: {
    enableMermaid: true,
    enablePlantUML: true,
    diagramTheme: 'auto',
    mermaidTheme: 'default',
    plantUMLServer: 'https://www.plantuml.com/plantuml'
  },
  export: {
    defaultFormat: 'A4',
    defaultOrientation: 'portrait',
    pdfQuality: 'medium',
    exportPath: ''
  },
  keyboard: {
    enableShortcuts: true,
    customShortcuts: {},
    vimMode: false
  },
  performance: {
    maxFileSize: 10,
    renderTimeout: 5000,
    searchDebounce: 150,
    enableAnalytics: false
  },
  version: '1.0.0',
  lastModified: new Date()
};

export interface SettingsContextValue {
  settings: ApplicationSettings;
  updateSettings: (updates: Partial<ApplicationSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}