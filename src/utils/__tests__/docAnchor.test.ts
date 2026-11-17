import { describe, it, expect, beforeEach } from 'vitest';
import { createDocAnchor, resolveDocAnchor, locateAnchor, headingBefore } from '../docAnchor';

function selectText(root: Element, text: string, occurrence = 0): Range {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let seen = 0;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n as Text;
    let i = t.data.indexOf(text);
    while (i >= 0) {
      if (seen++ === occurrence) {
        const r = document.createRange();
        r.setStart(t, i);
        r.setEnd(t, i + text.length);
        return r;
      }
      i = t.data.indexOf(text, i + 1);
    }
  }
  throw new Error('text not found');
}

describe('docAnchor', () => {
  let root: HTMLElement;
  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML = '<h1>Intro</h1><p>alpha beta</p><div class="mermaid-diagram">graph TD</div><h2>Part</h2><p>beta gamma <strong>beta</strong></p>';
    document.body.replaceChildren(root);
  });

  it('round-trips a selection and records context and heading', () => {
    const r = selectText(root, 'beta', 1);
    const anchor = createDocAnchor(root, r)!;
    expect(anchor.text).toBe('beta');
    expect(anchor.prefix.endsWith('Part')).toBe(true);
    expect(headingBefore(root, r)).toBe('Part');
    const resolved = resolveDocAnchor(root, anchor)!;
    expect(resolved.startContainer).toBe(r.startContainer);
    expect(resolved.startOffset).toBe(r.startOffset);
  });

  it('ignores diagram text so rendering diagrams does not shift offsets', () => {
    const anchor = createDocAnchor(root, selectText(root, 'gamma'))!;
    root.querySelector('.mermaid-diagram')!.innerHTML = '<svg><text>rendered diagram labels</text></svg>';
    expect(resolveDocAnchor(root, anchor)?.toString()).toBe('gamma');
  });

  it('re-finds the quote by context after the document changed', () => {
    const anchor = createDocAnchor(root, selectText(root, 'beta', 2))!; // the bold one
    root.querySelector('p')!.textContent = 'a much longer first paragraph with beta in it';
    const resolved = resolveDocAnchor(root, anchor)!;
    expect(resolved.toString()).toBe('beta');
    expect(resolved.startContainer.parentElement?.tagName).toBe('STRONG');
  });

  it('returns null when the quote is gone', () => {
    expect(locateAnchor('nothing here', { start: 0, end: 4, text: 'beta', prefix: '', suffix: '' })).toBeNull();
  });
});
