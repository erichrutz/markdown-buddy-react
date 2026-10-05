/**
 * Split an overflowing presentation section into multiple slide "pages".
 *
 * Rules (per user spec):
 *  - A section is only split at block boundaries. Blocks correspond to
 *    empty-line-separated chunks in the source markdown (paragraphs, lists,
 *    code fences, tables, …) as produced by `parseSectionsFromDOM`.
 *  - Splitting is height-driven: pages are packed greedily so each page fills
 *    (but does not overflow) the available slide content height.
 *  - Grace: if the content overflows by only a small amount (≈ 1–2 lines),
 *    NO split happens — the original single-slide-with-scroll behaviour is kept.
 *  - If there is no logical break point (a single block, or the very first
 *    block alone already overflows), NO split happens.
 *  - Continuation pages repeat the section title (handled by the renderer).
 *
 * The function is measurement-based: the caller supplies the pixel height of
 * each renderable block (in document order), the gap applied between blocks,
 * and the available content height. Indices returned are indices into the
 * ORIGINAL `section.blocks` array (callers pass those through so build-mode,
 * mark anchoring, etc. keep working with stable block indices).
 */

export interface PaginationInput {
  /** Height in px of each renderable block, in document order. */
  blockHeights: number[];
  /** Original block index for each measured block (maps back to section.blocks). */
  blockIndices: number[];
  /** Vertical gap in px applied between consecutive blocks (the `mt` between blocks). */
  gap: number;
  /** Available content height in px (the scroll area height). */
  available: number;
  /**
   * Grace in px. If total overflow beyond the first page is within this many
   * pixels, do not split at all. Typically ≈ 2 lines of body text.
   */
  gracePx: number;
}

/**
 * Returns an array of pages; each page is an array of ORIGINAL block indices.
 * A single-element result means "no split" (render everything on one slide,
 * preserving scroll/overflow behaviour).
 */
export function paginateBlocks(input: PaginationInput): number[][] {
  const { blockHeights, blockIndices, gap, available, gracePx } = input;
  const n = blockHeights.length;

  // Nothing renderable, or geometry not ready → single page.
  if (n === 0 || available <= 0) {
    return [blockIndices.slice()];
  }

  // No logical break point: a single block cannot be split.
  if (n === 1) {
    return [blockIndices.slice()];
  }

  // Total height with gaps.
  const total =
    blockHeights.reduce((a, h) => a + h, 0) + gap * (n - 1);

  // Fits on one slide (with a small tolerance) → no split.
  if (total <= available + 2) {
    return [blockIndices.slice()];
  }

  // Grace: only a tiny spillover → keep single slide (scroll handles the rest).
  if (total <= available + gracePx) {
    return [blockIndices.slice()];
  }

  // Greedy packing at block boundaries.
  const pages: number[][] = [];
  let currentHeights: number[] = [];
  let current: number[] = [];
  let currentHeight = 0;

  const pushPage = () => {
    if (current.length > 0) {
      pages.push(current);
      current = [];
      currentHeights = [];
      currentHeight = 0;
    }
  };

  for (let i = 0; i < n; i++) {
    const h = blockHeights[i] ?? 0;
    const blockIndex = blockIndices[i] ?? i;
    const withGap = current.length === 0 ? h : currentHeight + gap + h;

    if (current.length === 0) {
      // First block on a page always goes on, even if it alone overflows
      // (a single oversized block has no internal break point → it scrolls).
      current.push(blockIndex);
      currentHeights.push(h);
      currentHeight = h;
      continue;
    }

    if (withGap <= available) {
      current.push(blockIndex);
      currentHeights.push(h);
      currentHeight = withGap;
    } else {
      // Doesn't fit → start a new page with this block.
      pushPage();
      current.push(blockIndex);
      currentHeights.push(h);
      currentHeight = h;
    }
  }
  pushPage();

  // Safety: if packing collapsed to a single page (e.g. first block alone was
  // taller than `available` and everything else got appended by the
  // first-block rule), there is no useful split → single page.
  if (pages.length <= 1) {
    return [blockIndices.slice()];
  }

  // Grace on the LAST page: if the final page holds only a tiny remainder
  // (≈ 1–2 lines) merge it back so we don't create an almost-empty slide.
  if (pages.length >= 2) {
    const last = pages[pages.length - 1] ?? [];
    const lastHeight =
      last.reduce((a, origIdx) => {
        const measIdx = blockIndices.indexOf(origIdx);
        return a + (measIdx >= 0 ? blockHeights[measIdx] ?? 0 : 0);
      }, 0) +
      gap * Math.max(0, last.length - 1);
    if (lastHeight <= gracePx) {
      const prev = pages[pages.length - 2] ?? [];
      pages[pages.length - 2] = prev.concat(last);
      pages.pop();
    }
  }

  return pages.length > 0 ? pages : [blockIndices.slice()];
}
