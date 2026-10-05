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
  summary: SectionSummary;
}

/** Block counts and estimated speaking time; formatted for display by the UI. */
export interface SectionSummary {
  paragraphs: number;
  lists: number;
  code: number;
  seconds: number;
}

const EMPTY_SUMMARY: SectionSummary = { paragraphs: 0, lists: 0, code: 0, seconds: 0 };

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

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Format a section summary, e.g. "2 paragraphs · about 40 seconds". */
export function formatSectionSummary(summary: SectionSummary, t: Translate): string {
  const parts: string[] = [];
  if (summary.paragraphs) parts.push(t('sections.paragraphs', { count: summary.paragraphs }));
  if (summary.lists) parts.push(t('sections.lists', { count: summary.lists }));
  if (summary.code) parts.push(t('sections.codeBlocks', { count: summary.code }));
  if (summary.seconds < 60) {
    parts.push(t('sections.durationSeconds', { count: Math.max(10, Math.round(summary.seconds / 10) * 10) }));
  } else {
    parts.push(t('sections.durationMinutes', { count: Math.round(summary.seconds / 60) }));
  }
  return parts.join(' · ');
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
        summary: { ...EMPTY_SUMMARY },
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
        summary: { ...EMPTY_SUMMARY },
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
    const summary: SectionSummary = { ...EMPTY_SUMMARY };
    let totalText = '';

    for (const block of section.blocks) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = block.html;
      totalText += ' ' + (tempDiv.textContent || '');

      if (block.type === 'paragraph') summary.paragraphs++;
      else if (block.type === 'list') summary.lists++;
      else if (block.type === 'code') summary.code++;
    }

    summary.seconds = estimateSeconds(totalText);
    section.summary = summary;
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
