/**
 * Document-level text anchors for persisted highlights and notes.
 *
 * A highlight is stored as character offsets into the rendered document's text
 * plus the quoted text and a little surrounding context. When the document is
 * rendered again (reload, view switch, edited file) the anchor is resolved back
 * to a DOM Range: first at the stored offsets, then by searching for the quote
 * and picking the occurrence whose context fits best.
 *
 * Diagram containers are skipped when collecting text, because their text
 * changes once Mermaid/PlantUML has rendered and would shift all offsets.
 */

export interface DocAnchor {
  start: number;
  end: number;
  /** The highlighted text. */
  text: string;
  /** Up to CONTEXT characters before / after the quote. */
  prefix: string;
  suffix: string;
}

const CONTEXT = 32;
const SKIP_SELECTOR = [
  '.mermaid-diagram', '.mermaid-empty', '.mermaid-error',
  '.plantuml-diagram', '.plantuml-error',
  'code.language-plantuml', 'code.language-puml',
  'svg',
].join(',');

interface TextEntry { node: Text; offset: number }

function collectTextNodes(root: Element): TextEntry[] {
  const result: TextEntry[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => {
      const skipped = n.parentElement?.closest(SKIP_SELECTOR);
      return skipped && root.contains(skipped) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    },
  });
  let offset = 0;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    result.push({ node: t, offset });
    offset += t.data.length;
  }
  return result;
}

function fullText(entries: TextEntry[]): string {
  return entries.map((e) => e.node.data).join('');
}

/** Character offset of a DOM boundary point within the collected text, or -1. */
function offsetOfPoint(entries: TextEntry[], node: Node, nodeOffset: number): number {
  if (node.nodeType === Node.TEXT_NODE) {
    const hit = entries.find((e) => e.node === node);
    return hit ? hit.offset + nodeOffset : -1;
  }
  // Element boundary: the point sits before childNodes[nodeOffset] (or at the end of node).
  const child = node.childNodes[nodeOffset] ?? null;
  for (const e of entries) {
    if (child) {
      if (child === e.node || child.contains(e.node)) return e.offset;
      if (child.compareDocumentPosition(e.node) & Node.DOCUMENT_POSITION_FOLLOWING) return e.offset;
    } else if (!node.contains(e.node) && node.compareDocumentPosition(e.node) & Node.DOCUMENT_POSITION_FOLLOWING) {
      return e.offset;
    }
  }
  const last = entries[entries.length - 1];
  return last ? last.offset + last.node.data.length : -1;
}

function rangeFromOffsets(entries: TextEntry[], start: number, end: number): Range | null {
  const locate = (offset: number, preferNext: boolean) => {
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i]!;
      const nodeEnd = e.offset + e.node.data.length;
      // At a node boundary, start positions belong to the next node, end positions to this one.
      if (offset >= e.offset && (offset < nodeEnd || (offset === nodeEnd && (!preferNext || i === entries.length - 1)))) {
        return { node: e.node, nodeOffset: offset - e.offset };
      }
    }
    return null;
  };
  const s = locate(start, true);
  const e = locate(end, false);
  if (!s || !e) return null;
  try {
    const range = document.createRange();
    range.setStart(s.node, s.nodeOffset);
    range.setEnd(e.node, e.nodeOffset);
    return range;
  } catch {
    return null;
  }
}

/** Build an anchor for a selection range inside `container`. */
export function createDocAnchor(container: Element, range: Range): DocAnchor | null {
  const entries = collectTextNodes(container);
  const start = offsetOfPoint(entries, range.startContainer, range.startOffset);
  const end = offsetOfPoint(entries, range.endContainer, range.endOffset);
  if (start < 0 || end <= start) return null;
  const text = fullText(entries);
  return {
    start,
    end,
    text: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - CONTEXT), start),
    suffix: text.slice(end, end + CONTEXT),
  };
}

/** Number of matching characters at the end of `a` and `b`. */
function commonSuffixLen(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}

function commonPrefixLen(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

/**
 * Find the offsets of an anchor in the given text. Returns null if the quoted
 * text no longer occurs. Exported for testing.
 */
export function locateAnchor(text: string, anchor: DocAnchor): { start: number; end: number } | null {
  if (!anchor.text) return null;
  if (text.slice(anchor.start, anchor.end) === anchor.text) {
    return { start: anchor.start, end: anchor.end };
  }
  let best: { start: number; score: number } | null = null;
  for (let i = text.indexOf(anchor.text); i >= 0; i = text.indexOf(anchor.text, i + 1)) {
    const context =
      commonSuffixLen(text.slice(Math.max(0, i - CONTEXT), i), anchor.prefix) +
      commonPrefixLen(text.slice(i + anchor.text.length, i + anchor.text.length + CONTEXT), anchor.suffix);
    // Context dominates; distance from the old position breaks ties.
    const score = context * 1000 - Math.min(Math.abs(i - anchor.start), 999);
    if (!best || score > best.score) best = { start: i, score };
  }
  return best ? { start: best.start, end: best.start + anchor.text.length } : null;
}

/** Resolve an anchor to a live Range inside `container`, or null if the text is gone. */
export function resolveDocAnchor(container: Element, anchor: DocAnchor): Range | null {
  const entries = collectTextNodes(container);
  const pos = locateAnchor(fullText(entries), anchor);
  return pos ? rangeFromOffsets(entries, pos.start, pos.end) : null;
}

/** Text of the closest h1–h6 heading at or before the start of `range` inside `container`. */
export function headingBefore(container: Element, range: Range): string {
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let found = '';
  for (const h of headings) {
    const pos = h.compareDocumentPosition(range.startContainer);
    if (h.contains(range.startContainer) || pos & Node.DOCUMENT_POSITION_FOLLOWING) {
      found = (h.textContent ?? '').trim();
    } else {
      break;
    }
  }
  return found;
}
