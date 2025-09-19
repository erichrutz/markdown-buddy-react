# Multi-Page PDF Test Document

This document is specifically designed to test multi-page PDF export functionality without headers and footers.

## Section 1: Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

### Subsection 1.1

More content to increase page length. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

### Subsection 1.2

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.

## Section 2: Code Examples

Here are some extensive code examples that should span multiple pages:

```javascript
// Complex JavaScript example
class MarkdownProcessor {
  constructor(options = {}) {
    this.options = {
      enableMermaid: true,
      enablePlantUML: true,
      syntaxHighlighting: true,
      ...options
    };
    this.cache = new Map();
  }

  async processMarkdown(content) {
    const tokens = this.tokenize(content);
    const html = await this.renderTokens(tokens);
    return this.postProcess(html);
  }

  tokenize(content) {
    // Tokenization logic here
    return content.split('\n').map((line, index) => ({
      type: this.detectLineType(line),
      content: line,
      lineNumber: index + 1
    }));
  }

  async renderTokens(tokens) {
    let html = '';
    for (const token of tokens) {
      switch (token.type) {
        case 'heading':
          html += this.renderHeading(token);
          break;
        case 'code':
          html += await this.renderCode(token);
          break;
        case 'diagram':
          html += await this.renderDiagram(token);
          break;
        default:
          html += this.renderText(token);
      }
    }
    return html;
  }

  detectLineType(line) {
    if (line.startsWith('#')) return 'heading';
    if (line.startsWith('```')) return 'code';
    if (line.includes('mermaid') || line.includes('plantuml')) return 'diagram';
    return 'text';
  }

  renderHeading(token) {
    const level = token.content.match(/^#+/)[0].length;
    const text = token.content.replace(/^#+\s*/, '');
    return `<h${level}>${text}</h${level}>`;
  }

  async renderCode(token) {
    if (this.options.syntaxHighlighting) {
      return await this.highlightCode(token.content);
    }
    return `<pre><code>${token.content}</code></pre>`;
  }

  async renderDiagram(token) {
    const cached = this.cache.get(token.content);
    if (cached) return cached;
    
    const rendered = await this.processDiagram(token.content);
    this.cache.set(token.content, rendered);
    return rendered;
  }
}
```

## Section 3: More Content

Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?

### Another Subsection

At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.

Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.

## Section 4: Tables and Lists

### Large Table

| Feature | Description | Status | Priority | Notes |
|---------|-------------|--------|----------|-------|
| PDF Export | Export markdown to PDF | ✅ | High | Multi-page support needed |
| Mermaid Diagrams | Render Mermaid diagrams | ✅ | High | Caching implemented |
| PlantUML Diagrams | Render PlantUML diagrams | ✅ | High | Server-based rendering |
| Syntax Highlighting | Code block highlighting | ✅ | Medium | Multiple languages |
| File Tree Navigation | Navigate markdown files | ✅ | High | Hierarchical structure |
| Focus Mode | Distraction-free reading | ✅ | Medium | Hide UI elements |
| Keyboard Shortcuts | Quick navigation | ✅ | Medium | Platform-aware |
| Session Management | Restore last state | ✅ | Low | localStorage based |
| Internationalization | Multi-language support | ✅ | Low | German/English |
| VS Code Integration | Deep linking | ✅ | Low | Development workflow |

### Extensive List

1. First major item with extensive description that should take up multiple lines to test how lists are rendered in the PDF export functionality
2. Second major item with even more content including:
   - Sub-item A with detailed explanation
   - Sub-item B with technical specifications
   - Sub-item C with implementation notes
3. Third major item that includes code references and technical details
4. Fourth item with cross-references to other sections
5. Fifth item with additional metadata and context

## Section 5: Final Content

This final section should ensure that we have enough content to definitely require multiple pages when exported to PDF without headers and footers.

### Conclusion

The multi-page PDF export functionality is crucial for large markdown documents. Without proper page breaks, users would receive unusable single-page PDFs with tiny, unreadable text.

The implementation should:
- Scale content based on width only
- Allow height to flow across multiple pages
- Maintain proper image quality
- Handle diagrams correctly
- Preserve formatting and styling

This test document contains approximately 1000+ words and should definitely require multiple pages when exported at normal scale without headers and footers.

### Additional Padding Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

END OF DOCUMENT