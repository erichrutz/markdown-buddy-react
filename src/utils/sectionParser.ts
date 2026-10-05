/**
 * Parses rendered markdown HTML into sections split at headings.
 * Each section has a title, level, and HTML content blocks.
 */

export interface SectionBlock {
  type: 'paragraph' | 'list' | 'code' | 'other';
  html: string;
}

export interface Section {
  id: string;
  title: string;
  level: number;
  blocks: SectionBlock[];
  meta: string; // e.g. "2 Absätze · ca. 40 Sekunden"
}

export interface OutlineEntry {
  id: string;
  label: string;
  level: number;
}

/** Estimate reading/speaking time for a text block */
function estimateSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // ~130 words per minute for presentations
  return Math.round((words / 130) * 60);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `ca. ${Math.max(10, Math.round(seconds / 10) * 10)} Sekunden`;
  const mins = Math.round(seconds / 60);
  return `ca. ${mins} Minute${mins > 1 ? 'n' : ''}`;
}

/**
 * Parse a DOM container with rendered markdown into sections.
 * Splits at h1, h2, h3 elements.
 */
export function parseSectionsFromDOM(container: HTMLElement): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;

  const children = Array.from(container.children);

  for (const el of children) {
    const tag = el.tagName.toLowerCase();
    const isHeading = /^h[1-3]$/.test(tag);

    // A leading frontmatter table (agent skill / YAML metadata) appears before
    // any heading. Promote it to its own intro slide so presentation mode
    // shows the metadata instead of silently dropping pre-heading content.
    if (!current && tag === 'table' && el.classList.contains('frontmatter-table')) {
      current = {
        id: `sec-${sections.length}`,
        title: 'Metadata',
        level: 1,
        blocks: [{ type: 'other', html: el.outerHTML }],
        meta: '',
      };
      sections.push(current);
      // Reset so the next heading opens a fresh section rather than appending.
      current = null;
      continue;
    }

    if (isHeading) {
      // Start a new section
      const level = parseInt(tag[1] ?? '1', 10);
      current = {
        id: `sec-${sections.length}`,
        title: el.textContent?.trim() || '',
        level,
        blocks: [],
        meta: '',
      };
      sections.push(current);
    } else if (current) {
      let type: SectionBlock['type'] = 'other';
      if (tag === 'p') type = 'paragraph';
      else if (tag === 'ul' || tag === 'ol') type = 'list';
      else if (tag === 'pre') type = 'code';

      current.blocks.push({ type, html: el.outerHTML });
    }
  }

  // Every heading becomes a section — including chapters that only contain
  // sub-headings (no direct body). Those render as a title-only header slide.
  // We only discard sections whose blocks are exclusively horizontal rules
  // ("---" → <hr>) with no title, which are pure divider artifacts.
  const isDividerOnly = (b: SectionBlock): boolean =>
    /^\s*<hr\b[^>]*>\s*$/i.test(b.html);
  const filtered = sections.filter(
    (s) => s.title.trim().length > 0 || s.blocks.some((b) => !isDividerOnly(b)),
  );

  // Re-assign stable ids after filtering so index-based lookups stay consistent.
  filtered.forEach((s, i) => {
    s.id = `sec-${i}`;
  });

  sections.length = 0;
  sections.push(...filtered);

  // Compute meta for each section
  for (const section of sections) {
    const counts: Record<string, number> = {};
    let totalText = '';

    for (const block of section.blocks) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = block.html;
      totalText += ' ' + (tempDiv.textContent || '');

      if (block.type === 'paragraph') counts['Absätze'] = (counts['Absätze'] || 0) + 1;
      else if (block.type === 'list') counts['Listen'] = (counts['Listen'] || 0) + 1;
      else if (block.type === 'code') counts['Codeblöcke'] = (counts['Codeblöcke'] || 0) + 1;
    }

    const parts: string[] = [];
    for (const [label, count] of Object.entries(counts)) {
      const singular = label === 'Absätze' ? 'Absatz' :
                       label === 'Listen' ? 'Liste' :
                       label === 'Codeblöcke' ? 'Codeblock' : label;
      parts.push(`${count} ${count === 1 ? singular : label}`);
    }

    const seconds = estimateSeconds(totalText);
    parts.push(formatDuration(seconds));
    section.meta = parts.join(' · ');
  }

  return sections;
}

/**
 * Extract outline entries from sections.
 */
export function extractOutline(sections: Section[]): OutlineEntry[] {
  return sections.map((s) => ({
    id: s.id,
    label: s.title,
    level: s.level,
  }));
}

/**
 * Parse sections from raw HTML string (creates a temp container).
 */
export function parseSectionsFromHTML(html: string): Section[] {
  const container = document.createElement('div');
  container.innerHTML = html;
  return parseSectionsFromDOM(container);
}
