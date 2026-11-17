import { DocAnchor } from '../utils/docAnchor';
import { MarkDescriptor } from '../utils/textAnchor';

/**
 * Per-document highlights and notes, kept in localStorage.
 *
 * Storage is browser-local and can be wiped with the browser data; users copy
 * notes to the clipboard (as Markdown) to keep them permanently.
 */

export interface StoredMark {
  id: string;
  anchor: DocAnchor;
  /** Section/block descriptor for re-anchoring on presentation slides (null if not mappable). */
  descriptor: MarkDescriptor | null;
  /** Heading the highlight sits under when it was created (for grouping and export). */
  heading: string;
  note: string;
  createdAt: number;
}

export interface FileNotes {
  marks: StoredMark[];
  /** Free-text note for the whole document. */
  scratchpad: string;
}

const PREFIX = 'markdown-buddy-notes:';
const VERSION = 1;

export const emptyNotes = (): FileNotes => ({ marks: [], scratchpad: '' });

export function loadNotes(fileKey: string): FileNotes {
  try {
    const raw = localStorage.getItem(PREFIX + fileKey);
    if (!raw) return emptyNotes();
    const data = JSON.parse(raw);
    if (data?.v !== VERSION) return emptyNotes();
    return {
      marks: Array.isArray(data.marks) ? data.marks : [],
      scratchpad: typeof data.scratchpad === 'string' ? data.scratchpad : '',
    };
  } catch (e) {
    console.warn('Failed to load notes:', e);
    return emptyNotes();
  }
}

export function saveNotes(fileKey: string, notes: FileNotes): void {
  try {
    if (notes.marks.length === 0 && !notes.scratchpad.trim()) {
      localStorage.removeItem(PREFIX + fileKey);
      return;
    }
    localStorage.setItem(
      PREFIX + fileKey,
      JSON.stringify({ v: VERSION, marks: notes.marks, scratchpad: notes.scratchpad, updatedAt: Date.now() }),
    );
  } catch (e) {
    console.warn('Failed to save notes:', e);
  }
}

export interface ExportLabels {
  title: string;
  exported: string;
  documentNote: string;
  highlights: string;
  noHeading: string;
  detached: string;
}

/** Render notes as a Markdown document suitable for pasting elsewhere. */
export function notesToMarkdown(
  fileName: string,
  /** Shown under the title; pass '' to omit (e.g. for dropped files without a folder path). */
  filePath: string,
  notes: FileNotes,
  detachedIds: ReadonlySet<string>,
  labels: ExportLabels,
  date: string,
): string {
  const exported = `${labels.exported} ${date}`;
  const out: string[] = [`# ${labels.title}: ${fileName}`, '', filePath ? `\`${filePath}\` · ${exported}` : exported, ''];

  if (notes.scratchpad.trim()) {
    out.push(`## ${labels.documentNote}`, '', notes.scratchpad.trim(), '');
  }

  if (notes.marks.length > 0) {
    out.push(`## ${labels.highlights}`, '');
    const ordered = [...notes.marks].sort((a, b) => a.anchor.start - b.anchor.start);
    let lastHeading: string | null = null;
    for (const m of ordered) {
      const heading = m.heading || labels.noHeading;
      if (heading !== lastHeading) {
        out.push(`### ${heading}`, '');
        lastHeading = heading;
      }
      const quote = m.anchor.text.trim().split('\n').map((l) => `> ${l}`).join('\n');
      out.push(quote + (detachedIds.has(m.id) ? `\n>\n> _${labels.detached}_` : ''), '');
      if (m.note.trim()) out.push(m.note.trim(), '');
    }
  }

  return out.join('\n').trimEnd() + '\n';
}
