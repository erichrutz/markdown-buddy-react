import { describe, it, expect } from 'vitest';
import { parseSectionsFromHTML } from '../sectionParser';

describe('parseSectionsFromHTML', () => {
  it('keeps headings that have their own content', () => {
    const html = `
      <h1>Intro</h1>
      <p>Hello world</p>
      <h2>Details</h2>
      <p>More text</p>
    `;
    const sections = parseSectionsFromHTML(html);
    expect(sections.map((s) => s.title)).toEqual(['Intro', 'Details']);
  });

  it('keeps a higher-level heading with no own content as a header slide', () => {
    const html = `
      <h1>Title Only</h1>
      <h2>Chapter A</h2>
      <p>Content A</p>
      <h2>Chapter B</h2>
      <p>Content B</p>
    `;
    const sections = parseSectionsFromHTML(html);
    // "Title Only" has no direct body but must still appear as a title-only
    // header slide (e.g. "## 3. Installation" that only has sub-headings).
    expect(sections.map((s) => s.title)).toEqual(['Title Only', 'Chapter A', 'Chapter B']);
  });

  it('keeps trailing empty headings as header slides', () => {
    const html = `
      <h1>Real</h1>
      <p>Body</p>
      <h2>Empty Trailing</h2>
    `;
    const sections = parseSectionsFromHTML(html);
    expect(sections.map((s) => s.title)).toEqual(['Real', 'Empty Trailing']);
  });

  it('drops divider-only sections with no title', () => {
    const html = `
      <hr>
      <h1>Real</h1>
      <p>Body</p>
    `;
    const sections = parseSectionsFromHTML(html);
    // A leading <hr> before any heading has no title and only a divider block.
    expect(sections.map((s) => s.title)).toEqual(['Real']);
  });

  it('assigns stable sequential ids after filtering', () => {
    const html = `
      <h1>Empty</h1>
      <h2>Has Content</h2>
      <p>Body</p>
    `;
    const sections = parseSectionsFromHTML(html);
    // Both kept now: "Empty" is a header slide, "Has Content" has a body.
    expect(sections).toHaveLength(2);
    expect(sections[0]!.id).toBe('sec-0');
    expect(sections[0]!.title).toBe('Empty');
    expect(sections[1]!.id).toBe('sec-1');
    expect(sections[1]!.title).toBe('Has Content');
  });

  it('promotes a leading frontmatter table to a Metadata intro section', () => {
    const html = `
      <table class="frontmatter-table"><tbody><tr><th>name</th><td>caveman</td></tr></tbody></table>
      <h1>Intro</h1>
      <p>Body</p>
    `;
    const sections = parseSectionsFromHTML(html);
    expect(sections.map((s) => s.title)).toEqual(['Metadata', 'Intro']);
    expect(sections[0]!.blocks[0]!.html).toContain('frontmatter-table');
    // A following heading opens its own section, not appended to Metadata.
    expect(sections[1]!.blocks.map((b) => b.type)).toEqual(['paragraph']);
  });
});
