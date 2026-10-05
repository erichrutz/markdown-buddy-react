import { describe, it, expect } from 'vitest';
import { paginateBlocks } from '../slidePagination';

const idx = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('paginateBlocks', () => {
  it('does not split a single block (no break point)', () => {
    const pages = paginateBlocks({
      blockHeights: [10000],
      blockIndices: [0],
      gap: 20,
      available: 500,
      gracePx: 60,
    });
    expect(pages).toEqual([[0]]);
  });

  it('does not split when everything fits', () => {
    const pages = paginateBlocks({
      blockHeights: [100, 100, 100],
      blockIndices: idx(3),
      gap: 20,
      available: 500,
      gracePx: 60,
    });
    expect(pages).toEqual([[0, 1, 2]]);
  });

  it('keeps a single slide when overflow is within grace (1–2 lines)', () => {
    // total = 300 + 200 + 2*gap(20) = 540; available 500; overflow 40 <= grace 60.
    const pages = paginateBlocks({
      blockHeights: [300, 200],
      blockIndices: idx(2),
      gap: 20,
      available: 500,
      gracePx: 60,
    });
    expect(pages).toEqual([[0, 1]]);
  });

  it('splits at block boundaries when overflow exceeds grace', () => {
    // three 250-tall blocks, gap 20, available 500.
    // page1: 250 (+20+250=520 > 500) → [0]; +? 250 fits alone start page2...
    // Actually block0=250 -> page has 250; block1 -> 250+20+250=520>500 -> new page.
    const pages = paginateBlocks({
      blockHeights: [250, 250, 250],
      blockIndices: idx(3),
      gap: 20,
      available: 500,
      gracePx: 30,
    });
    // Greedy: [0,?] 250; adding 1 => 520>500 => page break. Each block own page.
    expect(pages.length).toBeGreaterThan(1);
    // All original indices preserved, in order, no dupes.
    expect(pages.flat()).toEqual([0, 1, 2]);
  });

  it('packs multiple small blocks per page', () => {
    // blocks 100 each, gap 20, available 500 → ~4 per page (100*4 + 20*3 = 460).
    const pages = paginateBlocks({
      blockHeights: [100, 100, 100, 100, 100, 100],
      blockIndices: idx(6),
      gap: 20,
      available: 500,
      gracePx: 10,
    });
    expect(pages.flat()).toEqual([0, 1, 2, 3, 4, 5]);
    expect(pages.length).toBeGreaterThanOrEqual(2);
    // First page holds as many as fit.
    expect(pages[0]).toEqual([0, 1, 2, 3]);
  });

  it('merges a tiny trailing remainder back (last-page grace)', () => {
    // Two big blocks + one tiny remainder that is within grace.
    // available 500, gap 20. blocks: 480, 480, 40. grace 60.
    // page1=[0] (480), page2 start=[1] (480), then 3rd: 480+20+40=540>500 -> [2] page3=40.
    // last page height 40 <= grace 60 -> merge into page2.
    const pages = paginateBlocks({
      blockHeights: [480, 480, 40],
      blockIndices: idx(3),
      gap: 20,
      available: 500,
      gracePx: 60,
    });
    expect(pages.flat()).toEqual([0, 1, 2]);
    // Last page merged → block 2 rides with block 1.
    expect(pages[pages.length - 1]).toContain(2);
    expect(pages[pages.length - 1]).toContain(1);
  });

  it('returns single page for empty input', () => {
    expect(paginateBlocks({
      blockHeights: [],
      blockIndices: [],
      gap: 20,
      available: 500,
      gracePx: 60,
    })).toEqual([[]]);
  });

  it('returns single page when geometry not ready', () => {
    expect(paginateBlocks({
      blockHeights: [100, 100],
      blockIndices: [0, 1],
      gap: 20,
      available: 0,
      gracePx: 60,
    })).toEqual([[0, 1]]);
  });

  it('preserves non-contiguous original block indices', () => {
    // Simulates blocks after filtering (e.g. an <hr> removed → gap in indices).
    const pages = paginateBlocks({
      blockHeights: [300, 300, 300],
      blockIndices: [1, 3, 5],
      gap: 20,
      available: 400,
      gracePx: 20,
    });
    expect(pages.flat()).toEqual([1, 3, 5]);
    expect(pages.length).toBeGreaterThan(1);
  });
});
