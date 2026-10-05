export const translations = {
  de: {
    app: {
      title: 'MarkDown Buddy'
    },
    ui: {
      selectFolder: 'Verzeichnis auswählen',
      selectFolderInfo: 'Ihr Browser fragt nach Zugriff, aber alle Dateien bleiben vollständig auf Ihrem Gerät und werden nur lokal verarbeitet. Nichts wird hochgeladen oder an Server gesendet.',
      openInVSCode: 'In VS Code öffnen',
      collapseAll: 'Alle einklappen',
      language: 'Sprache',
      currentFile: 'Aktuelle Datei',
      fileStats: 'Datei-Statistiken',
      noFileSelected: 'Keine Datei ausgewählt',
      noFileInstructions: 'Wählen Sie ein Verzeichnis mit Markdown-Dateien aus, um zu beginnen. Klicken Sie auf "Verzeichnis auswählen" in der oberen Leiste oder verwenden Sie die Tastenkombination Strg+O.',
      errorLoading: 'Fehler beim Laden der Datei',
      errorStaleFile: 'Datei konnte nicht gelesen werden – bitte Ordner erneut auswählen.',
      markdownFiles: 'Markdown-Dateien',
      focusMode: 'Focus-Modus',
      exitFocusMode: 'Focus-Modus beenden',
      close: 'Schließen',
      cancel: 'Abbrechen',
      refresh: 'Datei neu laden',
      refreshChanged: 'Datei wurde geändert - neu laden'
    },
    search: {
      title: 'Suchen',
      placeholder: 'Nach Dateien suchen...',
      resultsFound: 'Ergebnisse gefunden',
      noResults: 'Keine Dateien gefunden',
      searching: 'Suche läuft...',
      typeToSearch: 'Tippen Sie, um zu suchen',
      navigate: 'zum Navigieren',
      recentSearches: 'Letzte Suchvorgänge',
      quickOpen: 'Schnell öffnen',
      searchInContent: 'In Inhalten suchen',
      caseSensitive: 'Groß-/Kleinschreibung beachten',
      useRegex: 'Reguläre Ausdrücke verwenden',
      indexing: 'Suchindex wird erstellt...',
      indexReady: 'Suchindex bereit'
    },
    shortcuts: {
      title: 'Tastenkürzel',
      subtitle: 'Verfügbare Tastenkürzel für MarkDown Buddy',
      navigation: 'Navigation',
      view: 'Ansicht',
      file: 'Datei',
      custom: 'Benutzerdefiniert',
      noShortcuts: 'Keine Tastenkürzel verfügbar'
    },
    export: {
      title: 'Als PDF exportieren',
      subtitle: 'Exportieren Sie das aktuelle Dokument als PDF mit eingebetteten Diagrammen',
      filename: 'Dateiname',
      format: 'Format',
      orientation: 'Ausrichtung',
      portrait: 'Hochformat',
      landscape: 'Querformat',
      margins: 'Ränder',
      marginTop: 'Oben',
      marginRight: 'Rechts',
      marginBottom: 'Unten',
      marginLeft: 'Links',
      options: 'Optionen',
      includeHeader: 'Kopfzeile einschließen',
      includeFooter: 'Fußzeile einschließen',
      export: 'Exportieren',
      generating: 'PDF wird erstellt...',
      info: 'Diagramme und Syntax-Highlighting werden als Bilder eingebettet. Der Export kann bei großen Dokumenten etwas dauern.',
      noHeaderFooterWarning: 'Ohne Kopf- und Fußzeile wird der gesamte Inhalt automatisch auf mehrere Seiten aufgeteilt.',
      unknownError: 'Unbekannter Fehler beim PDF-Export',
      imageSettings: 'Bildeinstellungen',
      imageFormat: 'Bildformat',
      imageQuality: 'Bildqualität',
      smallerSize: 'Kleiner',
      betterQuality: 'Bessere Qualität',
      imageQualityHelp: 'Niedrigere Qualität reduziert die Dateigröße. 70% wird für die meisten Dokumente empfohlen.'
    },
    stats: {
      size: 'Größe',
      lines: 'Zeilen',
      characters: 'Zeichen',
      path: 'Pfad'
    },
    about: {
      title: 'Über',
      version: 'Version',
      author: 'Entwickler',
      year: 'Jahr',
      description: 'Ein eleganter Markdown-Viewer und -Editor mit erweiterten Funktionen für Diagramme, Syntax-Highlighting und PDF-Export.',
      license: {
        title: 'Lizenz',
        description: 'Diese Software steht unter der MIT-Lizenz:'
      },
      dependencies: {
        title: 'Abhängigkeiten',
        description: 'Diese Anwendung verwendet folgende Open-Source-Bibliotheken:'
      }
    },
    header: {
      openFolder: 'Ordner öffnen',
      openFolderPlaceholder: 'Ordner öffnen…',
      reload: 'Datei neu laden',
      exportPdf: 'Als PDF exportieren',
      toggleTheme: 'Farbschema wechseln',
      about: 'Über',
      settings: 'Einstellungen',
      present: 'Präsentieren'
    },
    tree: {
      sort: 'Sortieren',
      loading: 'Laden…'
    },
    viewer: {
      errorLoading: 'Fehler beim Laden',
      noFile: 'Keine Datei ausgewählt',
      noFileHelp: 'Wählen Sie einen Ordner aus und klicken Sie auf eine Markdown-Datei.',
      outline: 'Gliederung'
    },
    doc: {
      document: 'Dokument',
      sections: 'Abschnitte',
      zoomOut: 'Verkleinern',
      zoomIn: 'Vergrößern',
      textWidth: 'Textbreite anpassen',
      fullWidth: 'Voll',
      pointerHint: 'Zeiger für Bildschirmfreigabe',
      pointer: 'Zeiger',
      clearMarks: 'Alle Markierungen entfernen',
      markOne: 'Markierung',
      markMany: 'Markierungen'
    },
    sections: {
      title: 'Abschnitte für die Präsentation',
      intro: 'Beim Präsentieren wird jeweils ein Abschnitt hervorgehoben, der Rest des Dokuments tritt zurück. Reihenfolge und Umfang entsprechen den Überschriften der Datei.',
      skipped: 'Beim Präsentieren übersprungen',
      show: 'Einblenden',
      skip: 'Überspringen',
      presentFromHere: 'Ab hier präsentieren'
    },
    presentation: {
      outline: 'Gliederung',
      helpPage: 'Weiterblättern',
      helpSection: 'Abschnitt wechseln',
      helpBuild: 'Aufbau ein/aus',
      helpPointer: 'Zeiger ein/aus',
      helpTheme: 'Hell/Dunkel',
      helpControls: 'Steuerung ein/aus',
      exit: 'Beenden',
      prevSection: 'Vorheriger Abschnitt',
      nextSection: 'Nächster Abschnitt',
      build: 'Aufbau',
      buildTitle: 'Aufbau (B)',
      pointer: 'Zeiger',
      pointerTitle: 'Zeiger (P)',
      screenUsage: 'Bildschirmnutzung',
      themeTitle: 'Hell/Dunkel (D)',
      continues: 'Abschnitt geht weiter'
    },
    settings: {
      title: 'Einstellungen'
    }
  },
  en: {
    app: {
      title: 'MarkDown Buddy'
    },
    ui: {
      selectFolder: 'Select Folder',
      selectFolderInfo: 'Your browser asks for access, but all files remain completely on your device and are processed locally only. Nothing is uploaded or sent to servers.',
      openInVSCode: 'Open in VS Code',
      collapseAll: 'Collapse All',
      language: 'Language',
      currentFile: 'Current File',
      fileStats: 'File Statistics',
      noFileSelected: 'No file selected',
      noFileInstructions: 'Select a directory containing Markdown files to get started. Click "Select Folder" in the top bar or use Ctrl+O.',
      errorLoading: 'Error loading file',
      errorStaleFile: 'File could not be read — please reselect the folder.',
      markdownFiles: 'Markdown Files',
      focusMode: 'Focus Mode',
      exitFocusMode: 'Exit Focus Mode',
      close: 'Close',
      cancel: 'Cancel',
      refresh: 'Reload file',
      refreshChanged: 'File changed - reload'
    },
    search: {
      title: 'Search',
      placeholder: 'Search files...',
      resultsFound: 'results found',
      noResults: 'No files found matching your search',
      searching: 'Searching...',
      typeToSearch: 'Type to search files',
      navigate: 'to navigate',
      recentSearches: 'Recent Searches',
      quickOpen: 'Quick Open',
      searchInContent: 'Search in content',
      caseSensitive: 'Match case',
      useRegex: 'Use regular expressions',
      indexing: 'Building search index...',
      indexReady: 'Search index ready'
    },
    shortcuts: {
      title: 'Keyboard Shortcuts',
      subtitle: 'Available keyboard shortcuts for MarkDown Buddy',
      navigation: 'Navigation',
      view: 'View',
      file: 'File',
      custom: 'Custom',
      noShortcuts: 'No shortcuts available'
    },
    export: {
      title: 'Export as PDF',
      subtitle: 'Export the current document as PDF with embedded diagrams',
      filename: 'Filename',
      format: 'Format',
      orientation: 'Orientation',
      portrait: 'Portrait',
      landscape: 'Landscape',
      margins: 'Margins',
      marginTop: 'Top',
      marginRight: 'Right',
      marginBottom: 'Bottom',
      marginLeft: 'Left',
      options: 'Options',
      includeHeader: 'Include header',
      includeFooter: 'Include footer',
      export: 'Export',
      generating: 'Generating PDF...',
      info: 'Diagrams and syntax highlighting will be embedded as images. Large documents may take a moment to export.',
      noHeaderFooterWarning: 'Without headers and footers, content will be automatically split across multiple pages.',
      unknownError: 'Unknown error during PDF export',
      imageSettings: 'Image Settings',
      imageFormat: 'Image Format',
      imageQuality: 'Image Quality',
      smallerSize: 'Smaller Size',
      betterQuality: 'Better Quality',
      imageQualityHelp: 'Lower quality reduces file size. 70% is recommended for most documents.'
    },
    stats: {
      size: 'Size',
      lines: 'Lines',
      characters: 'Characters',
      path: 'Path'
    },
    about: {
      title: 'About',
      version: 'Version',
      author: 'Developer',
      year: 'Year',
      description: 'An elegant Markdown viewer and editor with advanced features for diagrams, syntax highlighting, and PDF export.',
      license: {
        title: 'License',
        description: 'This software is licensed under the MIT License:'
      },
      dependencies: {
        title: 'Dependencies',
        description: 'This application uses the following open-source libraries:'
      }
    },
    header: {
      openFolder: 'Open folder',
      openFolderPlaceholder: 'Open folder…',
      reload: 'Reload file',
      exportPdf: 'Export as PDF',
      toggleTheme: 'Toggle color scheme',
      about: 'About',
      settings: 'Settings',
      present: 'Present'
    },
    tree: {
      sort: 'Sort',
      loading: 'Loading…'
    },
    viewer: {
      errorLoading: 'Error while loading',
      noFile: 'No file selected',
      noFileHelp: 'Choose a folder and click on a Markdown file.',
      outline: 'Outline'
    },
    doc: {
      document: 'Document',
      sections: 'Sections',
      zoomOut: 'Zoom out',
      zoomIn: 'Zoom in',
      textWidth: 'Adjust text width',
      fullWidth: 'Full',
      pointerHint: 'Pointer for screen sharing',
      pointer: 'Pointer',
      clearMarks: 'Remove all highlights',
      markOne: 'highlight',
      markMany: 'highlights'
    },
    sections: {
      title: 'Sections for the presentation',
      intro: 'While presenting, one section at a time is highlighted and the rest of the document recedes. Order and scope follow the headings of the file.',
      skipped: 'Skipped when presenting',
      show: 'Show',
      skip: 'Skip',
      presentFromHere: 'Present from here'
    },
    presentation: {
      outline: 'Outline',
      helpPage: 'Next/previous page',
      helpSection: 'Change section',
      helpBuild: 'Build on/off',
      helpPointer: 'Pointer on/off',
      helpTheme: 'Light/Dark',
      helpControls: 'Controls on/off',
      exit: 'Exit',
      prevSection: 'Previous section',
      nextSection: 'Next section',
      build: 'Build',
      buildTitle: 'Build (B)',
      pointer: 'Pointer',
      pointerTitle: 'Pointer (P)',
      screenUsage: 'Screen usage',
      themeTitle: 'Light/Dark (D)',
      continues: 'Section continues'
    },
    settings: {
      title: 'Settings'
    }
  }
};