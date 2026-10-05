/**
 * Portable text-anchor utilities for the text marker.
 *
 * A highlight is stored as a descriptor (section index, block index,
 * character offsets within the block's text) rather than as a live DOM Range.
 * This lets the same mark be re-anchored into a different DOM subtree —
 * e.g. the presentation stage, which renders each block as fresh nodes.
 */

export interface MarkDescriptor {
  /** Section index in the parsed section list (heading-delimited). */
  sectionIndex: number;
  /** Block index within the section (0-based, non-heading elements only). */
  blockIndex: number;
  /** Character offset (inclusive) into the concatenated text of the block. */
  start: number;
  /** Character offset (exclusive) into the concatenated text of the block. */
  end: number;
  /** The selected text, kept for validation when re-anchoring. */
  text: string;
}

/**
 * Walk the text nodes of `root` in document order and return them with the
 * cumulative character offset at which each node starts.
 */
function collectTextNodes(root: Node): Array<{ node: Text; offset: number }> {
  const result: Array<{ node: Text; offset: number }> = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let n = walker.nextNode();
  while (n) {
    const t = n as Text;
    result.push({ node: t, offset });
    offset += t.data.length;
    n = walker.nextNode();
  }
  return result;
}

/**
 * Compute the character offset of (node, nodeOffset) within `root`.
 * Returns -1 if the node is not inside `root`.
 */
function charOffsetWithin(root: Node, node: Node, nodeOffset: number): number {
  if (!root.contains(node)) return -1;
  const nodes = collectTextNodes(root);
  if (node.nodeType === Node.TEXT_NODE) {
    for (const entry of nodes) {
      if (entry.node === node) return entry.offset + nodeOffset;
    }
    return -1;
  }
  // Element node: nodeOffset indexes child nodes. Map to the text offset at the
  // start of the child at that index (or end of content if past the last child).
  const children = Array.from(node.childNodes);
  const boundary = children[nodeOffset];
  if (boundary) {
    for (const entry of nodes) {
      if (boundary.contains(entry.node) || boundary === entry.node) return entry.offset;
    }
  }
  // Fallback: end of this element's text
  let total = 0;
  for (const entry of nodes) {
    if (node.contains(entry.node)) total = entry.offset + entry.node.data.length;
  }
  return total;
}

/**
 * The flat children of the markdown container, classified as heading or block.
 * Mirrors parseSectionsFromDOM: sections split at h1–h3, blocks are the
 * elements between headings.
 */
function classifyChildren(container: HTMLElement): Array<{ el: Element; isHeading: boolean }> {
  return Array.from(container.children).map((el) => ({
    el,
    isHeading: /^h[1-3]$/.test(el.tagName.toLowerCase()),
  }));
}

/**
 * Build a portable descriptor from the current selection range, relative to
 * the markdown container's section/block structure.
 * Returns null if the selection cannot be mapped to a single block.
 */
export function rangeToDescriptor(container: HTMLElement, range: Range): MarkDescriptor | null {
  const children = classifyChildren(container);

  let sectionIndex = -1;
  let blockIndex = -1;
  let ownerBlock: Element | null = null;

  let curSection = -1;
  let curBlock = -1;
  for (const { el, isHeading } of children) {
    if (isHeading) {
      curSection += 1;
      curBlock = -1;
      // Selection inside the heading itself → block index -1 (the section title).
      if (el.contains(range.startContainer)) {
        sectionIndex = curSection;
        blockIndex = -1;
        ownerBlock = el;
        break;
      }
    } else if (curSection >= 0) {
      curBlock += 1;
      if (el.contains(range.startContainer)) {
        sectionIndex = curSection;
        blockIndex = curBlock;
        ownerBlock = el;
        break;
      }
    }
  }

  // Selection not inside any section (e.g. before the first heading) — cannot
  // build a portable descriptor for the presentation stage.
  if (!ownerBlock || sectionIndex < 0) return null;

  // The selection must stay within the same block/heading.
  if (!ownerBlock.contains(range.endContainer)) return null;

  const start = charOffsetWithin(ownerBlock, range.startContainer, range.startOffset);
  const end = charOffsetWithin(ownerBlock, range.endContainer, range.endOffset);
  if (start < 0 || end < 0 || end <= start) return null;

  return { sectionIndex, blockIndex, start, end, text: range.toString() };
}

/**
 * Build a DOM Range for a descriptor inside a given block element, using the
 * stored character offsets. Returns null if the block text is shorter than
 * expected or the offsets no longer resolve.
 */
export function descriptorToRange(blockEl: Element, start: number, end: number): Range | null {
  const nodes = collectTextNodes(blockEl);
  if (nodes.length === 0) return null;

  const locate = (offset: number): { node: Text; nodeOffset: number } | null => {
    for (const entry of nodes) {
      const nodeEnd = entry.offset + entry.node.data.length;
      if (offset >= entry.offset && offset <= nodeEnd) {
        return { node: entry.node, nodeOffset: offset - entry.offset };
      }
    }
    return null;
  };

  const s = locate(start);
  const e = locate(end);
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
