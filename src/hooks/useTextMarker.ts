import { useCallback, useRef, useState } from 'react';
import {
  MarkDescriptor,
  rangeToDescriptor,
  descriptorToRange,
} from '../utils/textAnchor';

/**
 * Text marker using the CSS Custom Highlight API.
 *
 * Each mark keeps a live document-view Range and (when the selection maps to a
 * section block/heading) a portable descriptor so it can be re-anchored on the
 * presentation stage — the stage renders the same blocks as a separate DOM
 * subtree. The DOM itself is never modified, so marks survive React re-renders.
 *
 * Style rule: ::highlight(md-marker) { background:#ffe14d; color:#111827; }
 * Fallback: if the browser lacks the API, nothing happens (no error).
 */

interface Mark {
  id: number;
  /** Live range in the document view (always present). */
  docRange: Range;
  /** Portable descriptor for stage re-anchoring (null if not resolvable). */
  descriptor: MarkDescriptor | null;
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
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
  }
  return false;
}

export function useTextMarker() {
  const marksRef = useRef<Mark[]>([]);
  const nextIdRef = useRef(1);
  // Stage ranges for the currently-active presentation section, keyed by mark id.
  const stageRangesRef = useRef<Map<number, Range>>(new Map());
  const [markCount, setMarkCount] = useState(0);

  const paint = useCallback(() => {
    if (!hasHighlightAPI()) return;
    try {
      const all = [
        ...marksRef.current.map((m) => m.docRange),
        ...stageRangesRef.current.values(),
      ];
      if (all.length === 0) {
        CSS.highlights.delete('md-marker');
      } else {
        CSS.highlights.set('md-marker', new Highlight(...all));
      }
    } catch (e) {
      console.warn('Text marker paint failed:', e);
    }
  }, []);

  /**
   * Capture the current browser selection as a highlight mark.
   * `host` is the markdown container — only selections within it are accepted.
   */
  const addMark = useCallback(
    (host: HTMLElement | null) => {
      if (!host) return;
      if (!hasHighlightAPI()) {
        console.warn('CSS Custom Highlight API not available in this browser');
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      const r = sel.getRangeAt(0);
      if (!host.contains(r.commonAncestorContainer)) return;

      const descriptor = rangeToDescriptor(host, r);
      marksRef.current.push({
        id: nextIdRef.current++,
        docRange: r.cloneRange(),
        descriptor,
      });

      sel.removeAllRanges();
      paint();
      setMarkCount(marksRef.current.length);
    },
    [paint],
  );

  /**
   * Remove the single mark hit by a click at the given client coordinates.
   * Tests the document-view ranges first, then any active stage ranges.
   * Returns true if a mark was removed.
   */
  const removeMarkAtPoint = useCallback(
    (x: number, y: number): boolean => {
      // Document-view hit-test.
      const docHit = marksRef.current.find((m) => rangeHitsPoint(m.docRange, x, y));
      let target = docHit;

      // Stage hit-test (presentation) if no doc hit.
      if (!target) {
        for (const [id, range] of stageRangesRef.current) {
          if (rangeHitsPoint(range, x, y)) {
            target = marksRef.current.find((m) => m.id === id);
            break;
          }
        }
      }

      if (!target) return false;

      marksRef.current = marksRef.current.filter((m) => m.id !== target!.id);
      stageRangesRef.current.delete(target.id);
      paint();
      setMarkCount(marksRef.current.length);
      return true;
    },
    [paint],
  );

  const clearMarks = useCallback(() => {
    marksRef.current = [];
    stageRangesRef.current.clear();
    paint();
    setMarkCount(0);
  }, [paint]);

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
      const map = new Map<number, Range>();
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

  return {
    markCount,
    addMark,
    removeMarkAtPoint,
    clearMarks,
    reanchorStage,
    clearStage,
    hasAPI: hasHighlightAPI(),
  };
}
