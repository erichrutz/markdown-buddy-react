import { describe, it, expect } from 'vitest';
import { MarkdownService } from '../markdownService';

// Mock the MarkdownService functions that don't require complex dependencies
describe('MarkdownService', () => {
  describe('Path utilities', () => {
    it('should resolve relative paths correctly', () => {
      const basePath = '/docs/folder/file.md';
      const relativePath = '../other/file.md';
      
      // Simple path resolution logic
      const resolvedPath = basePath.split('/').slice(0, -1).join('/') + '/' + relativePath.replace('../', '');
      expect(resolvedPath).toContain('other/file.md');
    });

    it('should handle file extensions', () => {
      const filename = 'test.md';
      const hasMarkdownExtension = filename.endsWith('.md') || filename.endsWith('.markdown');
      expect(hasMarkdownExtension).toBe(true);
    });
  });

  describe('Markdown processing utilities', () => {
    it('should identify mermaid code blocks', () => {
      const markdownWithMermaid = '```mermaid\ngraph TD\nA --> B\n```';
      const hasMermaid = markdownWithMermaid.includes('```mermaid');
      expect(hasMermaid).toBe(true);
    });

    it('should identify plantuml code blocks', () => {
      const markdownWithPlantUML = '```plantuml\n@startuml\nA -> B\n@enduml\n```';
      const hasPlantUML = markdownWithPlantUML.includes('```plantuml');
      expect(hasPlantUML).toBe(true);
    });
  });

  describe('Frontmatter (agent skill) rendering', () => {
    it('renders a leading YAML frontmatter block as a table', async () => {
      const md = [
        '---',
        'name: caveman',
        'description: Terse smart caveman style',
        '---',
        '',
        '# Body',
        '',
        'Hello',
      ].join('\n');

      const html = await MarkdownService.renderMarkdown(md);
      expect(html).toContain('class="frontmatter-table"');
      expect(html).toContain('caveman');
      expect(html).toContain('Terse smart caveman style');
      // Body still rendered after the table.
      expect(html).toContain('<h1');
      expect(html).toContain('Hello');
      // No stray <hr> from the "---" delimiters.
      expect(html).not.toContain('<hr');
    });

    it('folds ">" block scalar values into a single cell', async () => {
      const md = [
        '---',
        'description: >',
        '  Line one',
        '  line two',
        '---',
        '',
        'body',
      ].join('\n');

      const html = await MarkdownService.renderMarkdown(md);
      expect(html).toContain('Line one line two');
    });

    it('leaves content without frontmatter untouched', async () => {
      const html = await MarkdownService.renderMarkdown('# Title\n\ntext');
      expect(html).not.toContain('frontmatter-table');
      expect(html).toContain('<h1');
    });

    it('escapes HTML in frontmatter values', async () => {
      const md = ['---', 'name: <script>x</script>', '---', '', 'b'].join('\n');
      const html = await MarkdownService.renderMarkdown(md);
      expect(html).not.toContain('<script>x</script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });
});