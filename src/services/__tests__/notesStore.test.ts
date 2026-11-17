import { describe, it, expect, beforeEach } from 'vitest';
import { loadNotes, saveNotes, notesToMarkdown, StoredMark } from '../notesStore';

const mark = (id: string, start: number, text: string, heading: string, note: string): StoredMark => ({
  id, anchor: { start, end: start + text.length, text, prefix: '', suffix: '' },
  descriptor: null, heading, note, createdAt: 0,
});

const labels = {
  title: 'Notes', exported: 'exported', documentNote: 'Document note',
  highlights: 'Highlights', noHeading: 'Before the first heading', detached: 'detached',
};

describe('notesStore', () => {
  beforeEach(() => localStorage.clear());

  it('saves, loads and removes empty entries', () => {
    saveNotes('a.md', { marks: [mark('1', 0, 'x', 'H', 'n')], scratchpad: 'pad' });
    expect(loadNotes('a.md').scratchpad).toBe('pad');
    expect(loadNotes('a.md').marks).toHaveLength(1);
    expect(loadNotes('b.md').marks).toHaveLength(0);
    saveNotes('a.md', { marks: [], scratchpad: ' ' });
    expect(localStorage.length).toBe(0);
  });

  it('exports grouped, ordered Markdown', () => {
    const md = notesToMarkdown('a.md', 'docs/a.md', {
      scratchpad: 'Overall thoughts',
      marks: [
        mark('2', 50, 'second', 'Part', ''),
        mark('1', 10, 'first\nline', 'Intro', 'My note'),
        mark('3', 60, 'gone', 'Part', 'Old'),
      ],
    }, new Set(['3']), labels, '17.11.2026');
    expect(md).toBe([
      '# Notes: a.md', '', '`docs/a.md` · exported 17.11.2026', '',
      '## Document note', '', 'Overall thoughts', '',
      '## Highlights', '',
      '### Intro', '', '> first\n> line', '', 'My note', '',
      '### Part', '', '> second', '', '> gone\n>\n> _detached_', '', 'Old',
    ].join('\n') + '\n');
  });
});
