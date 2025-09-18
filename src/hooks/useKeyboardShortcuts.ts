import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  category: 'navigation' | 'view' | 'file' | 'custom';
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in input fields
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const altMatches = !!shortcut.altKey === event.altKey;

      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        event.preventDefault();
        event.stopPropagation();
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled]);

  return {
    // Helper function to check if running on Mac
    isMac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,
    
    // Helper function to format shortcut display
    formatShortcut: (shortcut: KeyboardShortcut) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const parts: string[] = [];
      
      if (shortcut.ctrlKey) parts.push(isMac ? '⌃' : 'Ctrl');
      if (shortcut.metaKey) parts.push(isMac ? '⌘' : 'Meta');
      if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift');
      if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
      
      // Format special keys
      let key = shortcut.key;
      switch (key.toLowerCase()) {
        case 'f11':
          key = 'F11';
          break;
        case 'escape':
          key = isMac ? '⎋' : 'Esc';
          break;
        case 'enter':
          key = isMac ? '↩' : 'Enter';
          break;
        case 'backspace':
          key = isMac ? '⌫' : 'Backspace';
          break;
        case 'delete':
          key = isMac ? '⌦' : 'Del';
          break;
        case 'tab':
          key = isMac ? '⇥' : 'Tab';
          break;
        case ' ':
          key = 'Space';
          break;
        default:
          key = key.toUpperCase();
      }
      
      parts.push(key);
      return parts.join(isMac ? '' : '+');
    }
  };
};

// Pre-defined shortcut configurations
export const createDefaultShortcuts = (actions: {
  toggleSidebar?: () => void;
  toggleFocusMode?: () => void;
  selectDirectory?: () => void;
  collapseAll?: () => void;
  showHelp?: () => void;
  exitFocusMode?: () => void;
}): KeyboardShortcut[] => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.toggleSidebar) {
    shortcuts.push({
      key: 'b',
      [isMac ? 'metaKey' : 'ctrlKey']: true,
      action: actions.toggleSidebar,
      description: 'Toggle sidebar',
      category: 'navigation'
    });
  }

  if (actions.toggleFocusMode) {
    shortcuts.push({
      key: 'F11',
      action: actions.toggleFocusMode,
      description: 'Toggle focus mode',
      category: 'view'
    });
  }

  if (actions.selectDirectory) {
    shortcuts.push({
      key: 'o',
      [isMac ? 'metaKey' : 'ctrlKey']: true,
      action: actions.selectDirectory,
      description: 'Open directory',
      category: 'file'
    });
  }

  if (actions.collapseAll) {
    shortcuts.push({
      key: 'k',
      [isMac ? 'metaKey' : 'ctrlKey']: true,
      shiftKey: true,
      action: actions.collapseAll,
      description: 'Collapse all folders',
      category: 'navigation'
    });
  }

  if (actions.showHelp) {
    shortcuts.push({
      key: '?',
      shiftKey: true,
      action: actions.showHelp,
      description: 'Show keyboard shortcuts',
      category: 'navigation'
    });
  }

  // Focus mode exit shortcut (separate action for clarity)
  if (actions.exitFocusMode) {
    shortcuts.push({
      key: 'Escape',
      action: actions.exitFocusMode,
      description: 'Exit focus mode (when in focus mode)',
      category: 'view'
    });
  }

  return shortcuts;
};