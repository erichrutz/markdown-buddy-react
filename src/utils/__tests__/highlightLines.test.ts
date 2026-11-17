import { describe, it, expect } from 'vitest';
import { splitHighlightedLines, highlightMarkdownLines } from '../highlightLines';

describe('splitHighlightedLines', () => {
  it('closes and reopens spans that cross line breaks', () => {
    const lines = splitHighlightedLines('a<span class="x">b\nc</span>d\ne');
    expect(lines).toEqual(['a<span class="x">b</span>', '<span class="x">c</span>d', 'e']);
  });
});

describe('highlightMarkdownLines', () => {
  it('returns one escaped entry per source line', () => {
    const lines = highlightMarkdownLines('# H\r\n<script>x</script>\n```\ncode\n```');
    expect(lines).toHaveLength(5);
    expect(lines.join('')).not.toContain('<script>');
    expect(lines[0]).toContain('hljs-section');
  });

  it('keeps frontmatter separate from the Markdown body', () => {
    const lines = highlightMarkdownLines('---\nauthor: <x>\n---\n# H\ntext');
    expect(lines).toHaveLength(5);
    expect(lines[1]).toBe('<span class="hljs-meta">author: &lt;x&gt;</span>');
    expect(lines[2]).not.toContain('hljs-section');
    expect(lines[3]).toContain('hljs-section');
    expect(highlightMarkdownLines('---\na: 1\n---')).toHaveLength(3);
  });
});
