import hljs from 'highlight.js/lib/core';
import markdown from 'highlight.js/lib/languages/markdown';

if (!hljs.getLanguage('markdown')) hljs.registerLanguage('markdown', markdown);

/**
 * Splits highlight.js HTML output into one HTML string per source line.
 * Spans that cross a line break are closed at the end of the line and
 * reopened on the next, so every line is self-contained, valid markup.
 */
export function splitHighlightedLines(html: string): string[] {
  const lines: string[] = [];
  const open: string[] = [];
  let current = '';
  for (const part of html.split(/(<span[^>]*>|<\/span>|\n)/)) {
    if (!part) continue;
    if (part === '\n') {
      lines.push(current + '</span>'.repeat(open.length));
      current = open.join('');
    } else if (part.startsWith('<span')) {
      open.push(part);
      current += part;
    } else if (part === '</span>') {
      open.pop();
      current += part;
    } else {
      current += part;
    }
  }
  lines.push(current);
  return lines;
}

/** Highlights Markdown source and returns escaped, highlighted HTML per line. */
export function highlightMarkdownLines(source: string): string[] {
  const normalized = source.replace(/\r\n?/g, '\n');
  // YAML frontmatter is not Markdown: show it as a muted block so its closing
  // `---` is not mistaken for a setext heading underline.
  const fm = normalized.match(/^\uFEFF?---\n[\s\S]*?\n---[ \t]*(?:\n|$)/);
  const fmLines = fm
    ? fm[0].replace(/\n$/, '').split('\n').map((l) => `<span class="hljs-meta">${escapeHtml(l)}</span>`)
    : [];
  const body = fm ? normalized.slice(fm[0].length) : normalized;
  if (fm && !fm[0].endsWith('\n')) return fmLines;
  const html = hljs.highlight(body, { language: 'markdown', ignoreIllegals: true }).value;
  return [...fmLines, ...splitHighlightedLines(html)];
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
