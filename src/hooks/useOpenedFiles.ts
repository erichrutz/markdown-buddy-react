import { useState, useCallback, useEffect, useRef } from 'react';
import { MarkdownFile } from '../types';
import { FileSystemService, OpenedFileEntry } from '../services/fileSystemService';

const DB_NAME = 'markdownBuddy';
const DB_VERSION = 1;
const STORE_NAME = 'openedFileHandles';

// -------------------------------------------------------------------------
// IndexedDB helpers
// -------------------------------------------------------------------------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandlesToDB(entries: { id: string; handle: FileSystemFileHandle; parentName?: string }[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    for (const entry of entries) {
      store.put({ id: entry.id, handle: entry.handle, parentName: entry.parentName });
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) {
    console.warn('Failed to save file handles to IndexedDB:', e);
  }
}

async function loadHandlesFromDB(): Promise<{ id: string; handle: FileSystemFileHandle; parentName?: string }[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const all = store.getAll();
    const result = await new Promise<any[]>((resolve, reject) => {
      all.onsuccess = () => resolve(all.result);
      all.onerror = () => reject(all.error);
    });
    db.close();
    return result;
  } catch (e) {
    console.warn('Failed to load file handles from IndexedDB:', e);
    return [];
  }
}

async function clearHandlesDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // swallow
  }
}

// -------------------------------------------------------------------------
// Generate unique IDs for opened files
// -------------------------------------------------------------------------

let nextId = 1;

function makeId(name: string): string {
  return `@opened/${name}__${nextId++}`;
}

// -------------------------------------------------------------------------
// Hook
// -------------------------------------------------------------------------

export const useOpenedFiles = () => {
  const [entries, setEntries] = useState<OpenedFileEntry[]>([]);
  const [openedSectionOpen, setOpenedSectionOpen] = useState(true);
  const restoredRef = useRef(false);

  // Restore persisted handles on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    (async () => {
      const saved = await loadHandlesFromDB();
      if (saved.length === 0) return;

      const restored: OpenedFileEntry[] = [];
      for (const { id, handle, parentName } of saved) {
        try {
          // Check permission without prompting
          const perm = await handle.queryPermission({ mode: 'read' });
          if (perm === 'granted') {
            const file = await handle.getFile();
            restored.push({
              id,
              parentName,
              file: {
                path: id,
                name: handle.name,
                file,
                handle,
                size: file.size,
                lastModified: file.lastModified,
                type: 'markdown',
              },
            });
          } else {
            // Need permission — show dimmed entry
            restored.push({
              id,
              parentName,
              needsPermission: true,
              file: {
                path: id,
                name: handle.name,
                file: new File([], handle.name),
                handle,
                size: 0,
                lastModified: 0,
                type: 'markdown',
              },
            });
          }
        } catch {
          // Handle no longer valid — skip
        }
      }
      if (restored.length > 0) setEntries(restored);
    })();
  }, []);

  // Persist handles whenever entries change
  useEffect(() => {
    const withHandles = entries
      .filter(e => e.file.handle)
      .map(e => ({ id: e.id, handle: e.file.handle!, parentName: e.parentName }));
    if (withHandles.length > 0) {
      saveHandlesToDB(withHandles);
    } else if (entries.length === 0) {
      clearHandlesDB();
    }
  }, [entries]);

  const addFiles = useCallback((files: MarkdownFile[]): { added: number; names: string[]; entries: OpenedFileEntry[] } => {
    const newEntries: OpenedFileEntry[] = [];
    const names: string[] = [];

    for (const f of files) {
      // Deduplicate: if a file with the same name and handle already exists, skip
      const existing = entries.find(e => e.file.name === f.name && !e.needsPermission);
      if (existing) {
        // Just select it, don't add again
        continue;
      }

      const id = makeId(f.name);
      const parentName = extractParentName(f);
      newEntries.push({
        id,
        file: { ...f, path: id },
        parentName,
      });
      names.push(f.name);
    }

    if (newEntries.length > 0) {
      setEntries(prev => [...prev, ...newEntries]);
    }

    return { added: newEntries.length, names, entries: newEntries };
  }, [entries]);

  const removeFile = useCallback((id: string, selectedFile: MarkdownFile | null): string | null => {
    let selectNext: string | null = null;

    setEntries(prev => {
      const idx = prev.findIndex(e => e.id === id);
      if (idx < 0) return prev;

      // If the removed file is the currently selected one, choose a neighbor
      if (selectedFile && selectedFile.path === id) {
        const prevEntry = prev[idx - 1];
        const nextEntry = prev[idx + 1];
        selectNext = prevEntry?.id ?? nextEntry?.id ?? null;
      }

      return prev.filter(e => e.id !== id);
    });

    return selectNext;
  }, []);

  const clearAll = useCallback(() => {
    setEntries([]);
    clearHandlesDB();
  }, []);

  const requestPermission = useCallback(async (id: string): Promise<MarkdownFile | null> => {
    const entry = entries.find(e => e.id === id);
    if (!entry?.file.handle) return null;

    try {
      const granted = await FileSystemService.verifyReadPermission(entry.file.handle);
      if (!granted) return null;

      const file = await entry.file.handle.getFile();
      const updated: OpenedFileEntry = {
        ...entry,
        needsPermission: false,
        file: {
          ...entry.file,
          file,
          size: file.size,
          lastModified: file.lastModified,
        },
      };

      setEntries(prev => prev.map(e => e.id === id ? updated : e));
      return updated.file;
    } catch {
      return null;
    }
  }, [entries]);

  const getFileById = useCallback((id: string): MarkdownFile | undefined => {
    return entries.find(e => e.id === id)?.file;
  }, [entries]);

  return {
    openedEntries: entries,
    openedSectionOpen,
    setOpenedSectionOpen,
    addFiles,
    removeFile,
    clearAll,
    requestPermission,
    getFileById,
    hasOpenedFiles: entries.length > 0,
  };
};

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function extractParentName(file: MarkdownFile): string | undefined {
  // For files picked via showOpenFilePicker, we can't get the parent folder name.
  // For dropped files, webkitRelativePath may have the parent.
  const rel = (file.file as any).webkitRelativePath;
  if (rel) {
    const parts = rel.split('/');
    if (parts.length >= 2) return parts[parts.length - 2];
  }
  return undefined;
}
