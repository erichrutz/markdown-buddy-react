import { useCallback, useEffect, useRef, useState } from 'react';
import { rangeToDescriptor, descriptorToRange } from '../utils/textAnchor';
import { createDocAnchor, resolveDocAnchor, headingBefore } from '../utils/docAnchor';
import { StoredMark, loadNotes, saveNotes } from '../services/notesStore';

/**
 * Text marker and notes, using the CSS Custom Highlight API.
 *
 * Highlights (with optional notes) and a free-text document note are stored
 * per file in localStorage. After every render of the document view the marks
 * are re-anchored (see docAnchor.ts); marks whose text can no longer be found
 * are kept and flagged as detached. Marks are also re-anchored on presentation
 * slides via their section/block descriptor. The DOM itself is never modified.
 *
 * Style rules: ::highlight(md-marker) and ::highlight(md-marker-note) in markdown.css.
 * Fallback: without the API, highlights are not painted (notes still work).
 */

interface Mark extends StoredMark {
  /** Live range in the document view, null if not (yet) anchored. */
  docRange: Range | null;
  /** True once a re-anchor attempt failed to find the text. */
  detached: boolean;
}

/** Read-only view of a mark for the UI. */
export interface MarkInfo {
  id: string;
  text: string;
  note: string;
  heading: string;
  detached: boolean;
}

function hasHighlightAPI(): boolean {
  try {
    return (
      typeof CSS !== 'undefined' &&
      CSS.highlights !== undefined &&
      typeof Highlight !== 'undefined'
    );
  } catch {
    return false;
  }
}

/** True if the point (client coords) falls within any client rect of a range. */
function rangeHitsPoint(range: Range, x: number, y: number): boolean {
  const rects = range.getClientRects();
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (!r) continue;
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
  }
  return false;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function useTextMarker(fileKey: string | null) {
  const marksRef = useRef<Mark[]>([]);
  const scratchpadRef = useRef('');
  const loadedKeyRef = useRef<string | null>(null);
  const fileKeyRef = useRef(fileKey);
  fileKeyRef.current = fileKey;
  // Stage ranges for the currently-active presentation section, keyed by mark id.
  const stageRangesRef = useRef<Map<string, Range>>(new Map());
  const [marks, setMarks] = useState<MarkInfo[]>([]);
  const [scratchpad, setScratchpadState] = useState('');

  const paint = useCallback(() => {
    if (!hasHighlightAPI()) return;
    try {
      const plain: Range[] = [];
      const noted: Range[] = [];
      for (const m of marksRef.current) {
        const ranges = [m.docRange, stageRangesRef.current.get(m.id)].filter((r): r is Range => !!r);
        (m.note.trim() ? noted : plain).push(...ranges);
      }
      if (plain.length) CSS.highlights.set('md-marker', new Highlight(...plain));
      else CSS.highlights.delete('md-marker');
      if (noted.length) CSS.highlights.set('md-marker-note', new Highlight(...noted));
      else CSS.highlights.delete('md-marker-note');
    } catch (e) {
      console.warn('Text marker paint failed:', e);
    }
  }, []);

  /** Publish state to React, repaint, and persist. */
  const commit = useCallback((persist = true) => {
    const ordered = [...marksRef.current].sort((a, b) => a.anchor.start - b.anchor.start);
    setMarks(ordered.map(({ id, anchor, note, heading, detached }) => ({ id, text: anchor.text, note, heading, detached })));
    paint();
    const key = loadedKeyRef.current;
    if (persist && key) {
      saveNotes(key, {
        marks: marksRef.current.map(({ id, anchor, descriptor, heading, note, createdAt }) =>
          ({ id, anchor, descriptor, heading, note, createdAt })),
        scratchpad: scratchpadRef.current,
      });
    }
  }, [paint]);

  /** Switch to the stored marks of the given file (no-op if already loaded). */
  const ensureLoaded = useCallback(() => {
    const key = fileKeyRef.current;
    if (key === loadedKeyRef.current) return;
    loadedKeyRef.current = key;
    const data = key ? loadNotes(key) : { marks: [], scratchpad: '' };
    marksRef.current = data.marks.map((m) => ({ ...m, docRange: null, detached: false }));
    scratchpadRef.current = data.scratchpad;
    setScratchpadState(data.scratchpad);
    stageRangesRef.current.clear();
    commit(false);
  }, [commit]);

  useEffect(() => { ensureLoaded(); }, [fileKey, ensureLoaded]);

  /** Re-anchor all marks into the freshly rendered document view. */
  const reanchorDoc = useCallback((host: HTMLElement | null) => {
    ensureLoaded();
    if (!host) return;
    for (const m of marksRef.current) {
      m.docRange = resolveDocAnchor(host, m.anchor);
      m.detached = !m.docRange;
    }
    commit(false);
  }, [ensureLoaded, commit]);

  /**
   * Capture the current browser selection as a highlight mark.
   * `host` is the markdown container — only selections within it are accepted.
   */
  const addMark = useCallback((host: HTMLElement | null): string | null => {
    ensureLoaded();
    if (!host || !loadedKeyRef.current) return null;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
    const r = sel.getRangeAt(0);
    if (!host.contains(r.commonAncestorContainer)) return null;
    const anchor = createDocAnchor(host, r);
    if (!anchor || !anchor.text.trim()) return null;

    const id = newId();
    marksRef.current.push({
      id,
      anchor,
      descriptor: rangeToDescriptor(host, r),
      heading: headingBefore(host, r),
      note: '',
      createdAt: Date.now(),
      docRange: r.cloneRange(),
      detached: false,
    });
    sel.removeAllRanges();
    commit();
    return id;
  }, [ensureLoaded, commit]);

  /** Id of the mark under the given client coordinates (document view first, then slides). */
  const markIdAtPoint = useCallback((x: number, y: number): string | null => {
    const doc = marksRef.current.find((m) => m.docRange && rangeHitsPoint(m.docRange, x, y));
    if (doc) return doc.id;
    for (const [id, range] of stageRangesRef.current) {
      if (rangeHitsPoint(range, x, y)) return id;
    }
    return null;
  }, []);

  const removeMark = useCallback((id: string) => {
    marksRef.current = marksRef.current.filter((m) => m.id !== id);
    stageRangesRef.current.delete(id);
    commit();
  }, [commit]);

  /**
   * Remove the mark hit by a click (used on slides). Marks carrying a note are
   * kept so a stray click during a talk cannot lose a note. Returns true if removed.
   */
  const removeMarkAtPoint = useCallback((x: number, y: number): boolean => {
    const id = markIdAtPoint(x, y);
    const mark = id ? marksRef.current.find((m) => m.id === id) : undefined;
    if (!mark || mark.note.trim()) return false;
    removeMark(mark.id);
    return true;
  }, [markIdAtPoint, removeMark]);

  const setNote = useCallback((id: string, note: string) => {
    const mark = marksRef.current.find((m) => m.id === id);
    if (!mark) return;
    mark.note = note;
    commit();
  }, [commit]);

  const setScratchpad = useCallback((text: string) => {
    scratchpadRef.current = text;
    setScratchpadState(text);
    commit();
  }, [commit]);

  const clearMarks = useCallback(() => {
    marksRef.current = [];
    stageRangesRef.current.clear();
    commit();
  }, [commit]);

  /** Scroll the document view to a mark. Returns false if it is not anchored. */
  const scrollToMark = useCallback((id: string): boolean => {
    const range = marksRef.current.find((m) => m.id === id)?.docRange;
    const el = range?.startContainer.parentElement;
    if (!el || !el.isConnected) return false;
    el.scrollIntoView({ block: 'center' });
    return true;
  }, []);

  /** Client rect of a mark in the document view (for positioning popovers). */
  const markRect = useCallback((id: string): DOMRect | null => {
    const range = marksRef.current.find((m) => m.id === id)?.docRange;
    return range && range.startContainer.isConnected ? range.getBoundingClientRect() : null;
  }, []);

  /**
   * Re-anchor all marks belonging to `sectionIndex` into the active section's
   * stage elements and register them alongside the document-view ranges.
   *
   * @param resolveBlock Maps a block index to its rendered stage element.
   *   Block index -1 is the section heading/title element.
   * @param sectionIndex The active section index in the parsed section list.
   */
  const reanchorStage = useCallback(
    (resolveBlock: (blockIndex: number) => Element | null, sectionIndex: number) => {
      if (!hasHighlightAPI()) return;
      const map = new Map<string, Range>();
      for (const m of marksRef.current) {
        if (!m.descriptor || m.descriptor.sectionIndex !== sectionIndex) continue;
        const blockEl = resolveBlock(m.descriptor.blockIndex);
        if (!blockEl) continue;
        const range = descriptorToRange(blockEl, m.descriptor.start, m.descriptor.end);
        if (range) map.set(m.id, range);
      }
      stageRangesRef.current = map;
      paint();
    },
    [paint],
  );

  /** Drop any stage ranges (e.g. when leaving the presentation). */
  const clearStage = useCallback(() => {
    stageRangesRef.current.clear();
    paint();
  }, [paint]);

  /** Snapshot of the stored data for export. */
  const getNotes = useCallback(() => ({
    marks: marksRef.current.map(({ docRange: _r, detached: _d, ...rest }) => rest),
    scratchpad: scratchpadRef.current,
  }), []);

  return {
    marks,
    markCount: marks.length,
    scratchpad,
    addMark,
    markIdAtPoint,
    removeMark,
    removeMarkAtPoint,
    setNote,
    setScratchpad,
    clearMarks,
    reanchorDoc,
    scrollToMark,
    markRect,
    reanchorStage,
    clearStage,
    getNotes,
    hasAPI: hasHighlightAPI(),
  };
}
