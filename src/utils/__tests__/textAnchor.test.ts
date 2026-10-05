import { describe, it, expect } from 'vitest';
import {
  rangeToDescriptor,
  descriptorToRange,
} from '../textAnchor';

/**
 * These tests validate the core of the presentation-mode marker fix:
 * a selection captured in the document view is turned into a portable
 * descriptor, then re-anchored into a *separate* DOM subtree (the stage),
 * yielding a Range over the same text.
 */

// Mirrors parseSectionsFromDOM: children of the markdown container are
// headings (h1-h3) delimiting sections, and blocks in between.
function makeDocContainer(): HTMLElement {
  const c = document.createElement('div');
  c.className = 'markdown-content';
  c.innerHTML = [
    '<h1>Intro</h1>',
    '<p>Hello brave new world of markdown.</p>',
    '<p>Second paragraph here.</p>',
    '<h2>Details</h2>',
    '<p>Some detail text with <strong>bold</strong> inside.</p>',
  ].join('');
  return c;
}

/** Build a selection Range over a substring of an element's text. */
function rangeOverText(el: Element, needle: string): Range {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    const idx = node.data.indexOf(needle);
    if (idx >= 0) {
      const r = document.createRange();
      r.setStart(node, idx);
      r.setEnd(node, idx + needle.length);
      return r;
    }
    node = walker.nextNode() as Text | null;
  }
  throw new Error(`needle not found: ${needle}`);
}

describe('textAnchor round-trip', () => {
  it('maps a selection to section 0, block 0', () => {
    const doc = makeDocContainer();
    document.body.appendChild(doc);

    const firstP = doc.querySelectorAll('p')[0];
    const range = rangeOverText(firstP!, 'brave new world');
    const desc = rangeToDescriptor(doc, range);

    expect(desc).not.toBeNull();
    expect(desc!.sectionIndex).toBe(0);
    expect(desc!.blockIndex).toBe(0);
    expect(desc!.text).toBe('brave new world');

    document.body.removeChild(doc);
  });

  it('maps a selection in the second section', () => {
    const doc = makeDocContainer();
    document.body.appendChild(doc);

    const detailP = doc.querySelectorAll('p')[2]; // under <h2>Details</h2>
    const range = rangeOverText(detailP!, 'detail text');
    const desc = rangeToDescriptor(doc, range);

    expect(desc).not.toBeNull();
    expect(desc!.sectionIndex).toBe(1);
    expect(desc!.blockIndex).toBe(0);
    expect(desc!.text).toBe('detail text');

    document.body.removeChild(doc);
  });

  it('re-anchors a descriptor into a separately-rendered stage block', () => {
    const doc = makeDocContainer();
    document.body.appendChild(doc);

    const firstP = doc.querySelectorAll('p')[0];
    const range = rangeOverText(firstP!, 'brave new world');
    const desc = rangeToDescriptor(doc, range)!;

    // Simulate the presentation stage: the SAME block HTML rendered fresh
    // in a different subtree (like PresentationMode's dangerouslySetInnerHTML).
    const stageBlock = document.createElement('p');
    stageBlock.innerHTML = 'Hello brave new world of markdown.';
    const stage = document.createElement('div');
    stage.appendChild(stageBlock);
    document.body.appendChild(stage);

    const reRange = descriptorToRange(stageBlock, desc.start, desc.end);
    expect(reRange).not.toBeNull();
    expect(reRange!.toString()).toBe('brave new world');

    document.body.removeChild(doc);
    document.body.removeChild(stage);
  });

  it('re-anchors across inline markup (bold)', () => {
    const doc = makeDocContainer();
    document.body.appendChild(doc);

    const detailP = doc.querySelectorAll('p')[2];
    // select "text with bold inside" spanning the <strong>
    const range = document.createRange();
    const walker = document.createTreeWalker(detailP!, NodeFilter.SHOW_TEXT);
    const first = walker.nextNode() as Text; // "Some detail text with "
    range.setStart(first, first.data.indexOf('text'));
    // last text node "inside."
    let last = first;
    let n = walker.nextNode() as Text | null;
    while (n) { last = n; n = walker.nextNode() as Text | null; }
    range.setEnd(last, last.data.indexOf('inside') + 'inside'.length);

    const desc = rangeToDescriptor(doc, range)!;
    expect(desc.text).toContain('text with');
    expect(desc.text).toContain('bold');
    expect(desc.text).toContain('inside');

    // Fresh stage render of the same block
    const stageBlock = document.createElement('p');
    stageBlock.innerHTML = 'Some detail text with <strong>bold</strong> inside.';
    const stage = document.createElement('div');
    stage.appendChild(stageBlock);
    document.body.appendChild(stage);

    const reRange = descriptorToRange(stageBlock, desc.start, desc.end)!;
    expect(reRange.toString().replace(/\s+/g, ' ')).toBe(desc.text.replace(/\s+/g, ' '));

    document.body.removeChild(doc);
    document.body.removeChild(stage);
  });

  it('captures a selection inside a heading as blockIndex -1', () => {
    const doc = makeDocContainer();
    document.body.appendChild(doc);

    const h1 = doc.querySelector('h1')!;
    const range = rangeOverText(h1, 'Intro');
    const desc = rangeToDescriptor(doc, range);

    expect(desc).not.toBeNull();
    expect(desc!.sectionIndex).toBe(0);
    expect(desc!.blockIndex).toBe(-1);
    expect(desc!.text).toBe('Intro');

    // Re-anchor into a fresh stage title element rendered as plain text.
    const titleEl = document.createElement('div');
    titleEl.textContent = 'Intro';
    document.body.appendChild(titleEl);
    const reRange = descriptorToRange(titleEl, desc!.start, desc!.end)!;
    expect(reRange.toString()).toBe('Intro');

    document.body.removeChild(doc);
    document.body.removeChild(titleEl);
  });

  it('rejects selections spanning two blocks', () => {
    const doc = makeDocContainer();
    document.body.appendChild(doc);

    const ps = doc.querySelectorAll('p');
    const range = document.createRange();
    range.setStart(ps[0]!.firstChild!, 0);
    range.setEnd(ps[1]!.firstChild!, 3);
    const desc = rangeToDescriptor(doc, range);
    expect(desc).toBeNull();

    document.body.removeChild(doc);
  });
});
