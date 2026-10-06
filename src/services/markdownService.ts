import { marked } from 'marked';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import { PlantUMLService } from './plantumlService';

export class MarkdownService {
  private static initialized = false;
  private static currentTheme: 'light' | 'dark' = 'light';
  private static imageMap: Map<string, string> = new Map(); // Map of image paths to blob URLs
  private static currentDirectory: string = '';
  private static mermaidProcessing = false; // Global flag to prevent concurrent processing
  private static openLinksInNewTab = true;

  static initialize(theme: 'light' | 'dark' = 'light') {
    if (this.initialized && this.currentTheme === theme) {
      return; // Already initialized with the same theme
    }
    
    this.currentTheme = theme;
    
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        // Configure for better compatibility with Vite
        deterministicIds: true,
        fontFamily: "'Noto Sans', Arial, sans-serif",
        themeVariables: {
          fontSize: '16px',
          fontFamily: "'Noto Sans', Arial, sans-serif"
        },
        // Explicit configuration for different diagram types
        flowchart: {
          htmlLabels: true,
          curve: 'linear'
        },
        sequence: {
          diagramMarginX: 50,
          diagramMarginY: 10,
          actorMargin: 50,
          width: 150,
          height: 65,
          boxMargin: 10,
          boxTextMargin: 5,
          noteMargin: 10,
          messageMargin: 35
        }
      });
    } catch (error) {
      console.error('Mermaid initialization error:', error);
    }

    const renderer = new marked.Renderer();

    renderer.link = ({ href, title, text }) => {
      if (href.endsWith('.md') || href.endsWith('.markdown')) {
        return `<a href="#" class="internal-md-link" data-md-path="${href}" title="${title || ''}">${text}</a>`;
      }
      const targetAttr = this.openLinksInNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `<a href="${href}"${targetAttr} title="${title || ''}">${text}</a>`;
    };

    renderer.image = ({ href, title, text }) => {
      // Check if it's a relative path and we have it in our image map
      const imageUrl = this.resolveImageUrl(href);
      return `<img src="${imageUrl}" alt="${text || ''}" title="${title || ''}" />`;
    };

    renderer.code = ({ text, lang, escaped }) => {
      if (lang === 'mermaid') {
        // Additional validation: don't create empty mermaid elements
        const trimmedText = text?.trim() || '';
        if (!trimmedText || trimmedText.length < 3) {
          console.warn('Skipping empty or too short mermaid block:', trimmedText);
          return `<div class="mermaid-empty">Empty mermaid diagram</div>`;
        }
        
        const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        // Escape the source so it survives the innerHTML → textContent
        // round-trip intact. Without escaping, tags like <br/> inside node
        // labels (e.g. A["line1<br/>line2"]) are parsed into real DOM nodes
        // and stripped by textContent, collapsing multi-line boxes to one line.
        return `<div class="mermaid-diagram" id="${id}">${this.escapeHtml(text)}</div>`;
      }

      if (lang === 'plantuml' || lang === 'puml') {
        return `<pre><code class="language-${lang}">${escaped ? text : this.escapeHtml(text)}</code></pre>`;
      }

      if (lang && hljs.getLanguage(lang)) {
        try {
          const highlighted = hljs.highlight(text, { language: lang }).value;
          return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
        } catch (err) {
          console.warn('Syntax highlighting failed:', err);
        }
      }

      return `<pre><code class="hljs">${escaped ? text : this.escapeHtml(text)}</code></pre>`;
    };

    marked.setOptions({
      renderer,
      breaks: true,
      gfm: true,
      pedantic: false
    });

    this.initialized = true;
  }

  private static async ensureMermaidReady(): Promise<void> {
    // Simple check to ensure mermaid is available
    if (!mermaid || typeof mermaid.render !== 'function') {
      throw new Error('Mermaid not properly loaded');
    }
    
    // Ensure mermaid is initialized
    if (!this.initialized) {
      this.initialize(this.currentTheme);
    }
    
    // Additional check for mermaid readiness in development
    try {
      // Test if mermaid can access its core functionality
      if (typeof mermaid.initialize !== 'function') {
        throw new Error('Mermaid core functions not available');
      }
    } catch (error) {
      console.warn('Mermaid readiness check failed:', error);
      // Try to reinitialize
      this.initialized = false;
      this.initialize(this.currentTheme);
    }
  }

  static updateTheme(theme: 'light' | 'dark') {
    if (this.currentTheme !== theme) {
      this.currentTheme = theme;
      this.initialized = false; // Force re-initialization
      this.initialize(theme);
    }
  }

  static setOpenLinksInNewTab(value: boolean) {
    if (this.openLinksInNewTab !== value) {
      this.openLinksInNewTab = value;
      this.initialized = false; // Force re-initialization to update renderer
    }
  }

  static async renderMarkdown(
    content: string,
    theme: 'light' | 'dark' = 'light',
    currentFilePath?: string,
    allFiles?: Map<string, any>
  ): Promise<string> {
    this.initialize(theme);
    
    // Set up image resolution context
    if (currentFilePath) {
      this.currentDirectory = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
      if (allFiles) {
        await this.setupImageMap(allFiles);
      }
    }
    
    try {
      // Agent skill files (and any doc) may start with a YAML frontmatter
      // block delimited by "---" lines. Render that metadata as a table
      // instead of letting marked turn it into an <hr> + loose text.
      const { table, body } = this.extractFrontmatterTable(content);
      const html = await marked.parse(body);
      return table ? table + html : html;
    } catch (error) {
      console.error('Markdown rendering error:', error);
      throw new Error('Failed to render markdown content');
    }
  }

  /**
   * Detect a leading YAML frontmatter block delimited by "---" lines and
   * convert it into an HTML table. Returns the table HTML (empty when no
   * frontmatter is present) and the remaining markdown body.
   *
   * Supported YAML shapes (kept intentionally simple, no external dep):
   *   key: value
   *   key: >          (folded block scalar — following indented lines joined)
   *   key: |          (literal block scalar — following indented lines joined with <br>)
   *   key:            (followed by "- item" list lines)
   */
  private static extractFrontmatterTable(content: string): { table: string; body: string } {
    // Must start with "---" on the very first line (allow leading BOM/whitespace-free).
    const fmMatch = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
    if (!fmMatch) {
      return { table: '', body: content };
    }

    const rawBlock = fmMatch[1] ?? '';
    const body = content.slice(fmMatch[0].length);

    const rows = this.parseFrontmatterBlock(rawBlock);
    if (rows.length === 0) {
      // Nothing parseable — leave content untouched so we don't hide data.
      return { table: '', body: content };
    }

    const esc = (s: string) => this.escapeHtml(s);
    const bodyRows = rows
      .map(
        ([key, value]) =>
          `<tr><th scope="row">${esc(key)}</th><td>${value}</td></tr>`,
      )
      .join('');

    const table =
      `<table class="frontmatter-table" data-frontmatter="true">` +
      `<thead><tr><th>Key</th><th>Value</th></tr></thead>` +
      `<tbody>${bodyRows}</tbody></table>`;

    return { table, body };
  }

  /**
   * Parse a YAML frontmatter block into [key, valueHtml] pairs.
   * Values are HTML-escaped; multi-line/list values are collapsed into a
   * single cell. Nested structures are flattened with a best-effort join.
   */
  private static parseFrontmatterBlock(block: string): Array<[string, string]> {
    const lines = block.split(/\r?\n/);
    const rows: Array<[string, string]> = [];
    const esc = (s: string) => this.escapeHtml(s);

    let i = 0;
    while (i < lines.length) {
      const line = lines[i] ?? '';

      // Skip blank lines and comments at the top level.
      if (!line.trim() || /^\s*#/.test(line)) {
        i++;
        continue;
      }

      // Match a top-level "key:" or "key: value" (no leading indentation).
      const kv = line.match(/^([^\s:][^:]*?):[ \t]*(.*)$/);
      if (!kv) {
        i++;
        continue;
      }

      const key = (kv[1] ?? '').trim();
      let inlineValue = (kv[2] ?? '').trim();
      const collected: string[] = [];
      let joinWith = ' ';

      // Block scalar indicators.
      if (inlineValue === '>' || inlineValue === '|') {
        joinWith = inlineValue === '|' ? '<br>' : ' ';
        inlineValue = '';
      } else if (inlineValue) {
        // Strip surrounding quotes on simple inline values.
        inlineValue = inlineValue.replace(/^["'](.*)["']$/, '$1');
      }

      // Consume following indented continuation / list lines.
      let j = i + 1;
      while (j < lines.length) {
        const next = lines[j] ?? '';
        if (!next.trim()) {
          // Blank line: keep scanning within an indented block, stop otherwise.
          if (/^\s+/.test(lines[j + 1] || '')) {
            j++;
            continue;
          }
          break;
        }
        if (!/^\s+/.test(next)) break; // dedent → next top-level key

        const listItem = next.match(/^\s+-\s+(.*)$/);
        if (listItem) {
          collected.push(esc((listItem[1] ?? '').trim().replace(/^["'](.*)["']$/, '$1')));
        } else {
          collected.push(esc(next.trim()));
        }
        j++;
      }

      let valueHtml: string;
      if (collected.length > 0) {
        valueHtml = (inlineValue ? esc(inlineValue) + joinWith : '') + collected.join(joinWith);
      } else {
        valueHtml = esc(inlineValue);
      }

      rows.push([key, valueHtml]);
      i = j;
    }

    return rows;
  }

  static async processMermaidDiagrams(container: HTMLElement): Promise<void> {
    // Global concurrency protection
    if (this.mermaidProcessing) {
      console.log('Mermaid processing already in progress, skipping');
      return;
    }
    
    this.mermaidProcessing = true;
    
    try {
      const mermaidElements = container.querySelectorAll('.mermaid-diagram:not([data-processed])');
      
      // Log mermaid processing for debugging
      if (mermaidElements.length > 0) {
        console.log(`Processing ${mermaidElements.length} mermaid elements`);
      }
      
      // Exit early if no elements to process
      if (mermaidElements.length === 0) {
        return;
      }
      
      // Additional safety: don't process if container seems to be in an invalid state
      if (!container.isConnected || !document.body.contains(container)) {
        console.warn('Mermaid processing skipped: container not in DOM');
        return;
      }
      
      await this._processMermaidElements(Array.from(mermaidElements));
    } finally {
      this.mermaidProcessing = false;
    }
  }

  private static async _processMermaidElements(mermaidElements: Element[]): Promise<void> {
    for (const element of mermaidElements) {
      try {
        const content = element.textContent || '';
        const id = element.id;
        
        // Validate element has proper ID and is a legitimate mermaid diagram
        if (!id || !id.startsWith('mermaid-')) {
          console.warn('Mermaid element with invalid ID found:', id, 'Content:', content.substring(0, 50));
          element.setAttribute('data-processed', 'invalid');
          element.innerHTML = ''; // Clear content to prevent confusion
          continue;
        }
        
        // Early exit for empty content or already processed SVG
        if (!content.trim() || content.includes('<svg')) {
          element.setAttribute('data-processed', 'empty');
          continue;
        }
        
        const trimmedContent = content.trim();
        
        // Much more robust validation for mermaid content
        const mermaidKeywords = [
          'graph', 'flowchart', 'sequenceDiagram', 'gantt', 'pie', 'gitgraph',
          'classDiagram', 'stateDiagram', 'journey', 'erDiagram', 'mindmap',
          'timeline', 'quadrantChart', 'requirementDiagram'
        ];
        
        // First check: must start with a mermaid keyword (more strict)
        const startsWithMermaidKeyword = mermaidKeywords.some(keyword => {
          const lines = trimmedContent.split('\n');
          const firstLine = lines[0]?.trim().toLowerCase() || '';
          return firstLine.startsWith(keyword.toLowerCase()) || firstLine.includes(keyword.toLowerCase());
        });
        
        // Additional validation checks
        // Table detection: must have pipes AND look like a markdown table structure (|---|---|)
        const isTable = !startsWithMermaidKeyword && 
          trimmedContent.includes('|') && 
          /\|[\s]*[-:]+[\s]*\|/.test(trimmedContent); // markdown table separator pattern
        const isCodeSnippet = trimmedContent.includes('{') && trimmedContent.includes('}') && !startsWithMermaidKeyword;
        // Allow <br/> and <br> tags in mermaid diagrams (valid for node labels), but reject other HTML
        const hasHTMLTags = trimmedContent.includes('<') && trimmedContent.includes('>');
        const hasMermaidAllowedHTML = hasHTMLTags && /(<br\s*\/?>)/gi.test(trimmedContent);
        const isHTML = hasHTMLTags && !hasMermaidAllowedHTML;
        const isPlainText = !/[{}[\]()><=|#*`]/.test(trimmedContent) && trimmedContent.length < 100;
        const isTooShort = trimmedContent.length < 5;
        const isTooLong = trimmedContent.length > 10000; // Prevent processing massive content
        
        // Log suspicious content for debugging
        if (trimmedContent.length > 0 && !startsWithMermaidKeyword) {
          console.warn('Invalid mermaid content detected:', {
            id,
            contentPreview: trimmedContent.substring(0, 50),
            isTable,
            isPlainText
          });
        }
        
        // Very strict validation: must pass all checks
        const looksLikeMermaid = startsWithMermaidKeyword && 
          !isTable && 
          !isCodeSnippet && 
          !isHTML && 
          !isPlainText && 
          !isTooShort && 
          !isTooLong;

        // Additional ultra-strict check: must have proper mermaid syntax elements
        const hasValidMermaidSyntax = looksLikeMermaid && (
          trimmedContent.includes('-->') ||  // flowchart/graph arrows
          trimmedContent.includes('>>') ||   // sequence diagram arrows  
          trimmedContent.includes('::') ||   // class diagram
          trimmedContent.includes('%{') ||   // gantt
          (trimmedContent.toLowerCase().includes('participant') && trimmedContent.includes('-')) || // sequence
          trimmedContent.includes('[') ||    // node definitions
          trimmedContent.includes('subgraph') || // subgraph
          (trimmedContent.toLowerCase().includes('pie') && trimmedContent.includes(':')) // pie chart
        );
        
        if (hasValidMermaidSyntax) {
          // Mark as processing to prevent double rendering
          element.setAttribute('data-processed', 'processing');
          
          // Validate mermaid syntax before calling render
          try {
            // Ensure mermaid is ready
            await this.ensureMermaidReady();
            
            // Add retry logic for dynamic import failures
            let retryCount = 0;
            const maxRetries = 2;
            
            while (retryCount <= maxRetries) {
              try {
                const { svg } = await mermaid.render(id + '-svg', trimmedContent);
                element.innerHTML = svg;
                element.setAttribute('data-processed', 'rendered');
                break; // Success, exit retry loop
              } catch (renderError: unknown) {
                const error = renderError as Error;
                
                if (error.message && error.message.includes('Failed to fetch dynamically imported module') && retryCount < maxRetries) {
                  console.warn(`Mermaid dynamic import failed, retrying... (${retryCount + 1}/${maxRetries})`);
                  retryCount++;
                  // Wait a bit before retrying
                  await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
                  continue;
                } else {
                  throw renderError; // Re-throw if not a retry case
                }
              }
            }
          } catch (mermaidError: unknown) {
            // Handle mermaid-specific parsing errors
            const error = mermaidError as Error;
            console.error('Mermaid rendering error details:', error);
            
            if (error.message && (
              error.message.includes('Syntax error in text') || 
              error.message.includes('Failed to fetch') ||
              error.message.includes('dynamically imported module')
            )) {
              element.setAttribute('data-processed', 'syntax-error');
              element.innerHTML = `<div class="mermaid-error">
                <p>⚠️ Mermaid diagram failed to load</p>
                <details>
                  <summary>Show error details</summary>
                  <pre>${error.message}</pre>
                </details>
                <details>
                  <summary>Show diagram source</summary>
                  <pre>${trimmedContent}</pre>
                </details>
                <p><small>Try refreshing the page or check the diagram syntax.</small></p>
              </div>`;
            } else {
              throw error; // Re-throw other errors
            }
          }
        } else {
          // Not mermaid content, mark as processed but don't render
          element.setAttribute('data-processed', 'skipped');
          // Remove the element content to prevent confusion
          element.innerHTML = '';
        }
      } catch (error) {
        console.error('Mermaid processing error:', error);
        element.setAttribute('data-processed', 'error');
        element.innerHTML = `<div class="mermaid-error">
          <p>Error processing content:</p>
          <pre>${error}</pre>
        </div>`;
      }
    }
  }

  static async processPlantUMLDiagrams(container: HTMLElement, theme: 'light' | 'dark' = 'light'): Promise<void> {
    await PlantUMLService.processPlantUMLDiagrams(container, theme);
  }

  static activateInternalLinks(
    container: HTMLElement, 
    onInternalLink: (path: string) => void
  ): void {
    const internalLinks = container.querySelectorAll('.internal-md-link');
    
    internalLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const path = link.getAttribute('data-md-path');
        if (path) {
          onInternalLink(path);
        }
      });
    });
  }

  static findInternalFile(
    targetPath: string, 
    currentFilePath: string, 
    allFiles: Map<string, any>
  ): any | null {
    if (targetPath.startsWith('/')) {
      return allFiles.get(targetPath.substring(1)) || null;
    }

    const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
    const resolvedPath = currentDir ? `${currentDir}/${targetPath}` : targetPath;
    
    let found = allFiles.get(resolvedPath);
    if (found) return found;

    if (!targetPath.includes('.')) {
      found = allFiles.get(resolvedPath + '.md') || allFiles.get(resolvedPath + '.markdown');
      if (found) return found;
    }

    for (const [path, file] of allFiles) {
      if (path.endsWith('/' + targetPath) || 
          path.endsWith('/' + targetPath + '.md') || 
          path.endsWith('/' + targetPath + '.markdown')) {
        return file;
      }
    }

    return null;
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private static async setupImageMap(allFiles: Map<string, any>): Promise<void> {
    // Clear existing blob URLs to prevent memory leaks
    this.imageMap.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.imageMap.clear();

    // Create blob URLs for image files
    for (const [path, fileData] of allFiles) {
      if (this.isImageFile(path) && fileData.file) {
        try {
          const blob = new Blob([await this.readFileAsArrayBuffer(fileData.file)], { 
            type: this.getImageMimeType(path) 
          });
          const blobUrl = URL.createObjectURL(blob);
          this.imageMap.set(path, blobUrl);
        } catch (error) {
          console.error('Failed to create blob URL for image:', path, error);
        }
      }
    }
  }

  private static resolveImageUrl(href: string): string {
    // If it's already an absolute URL, return as-is
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('data:')) {
      return href;
    }

    // Handle relative paths
    let resolvedPath = href;
    if (href.startsWith('./')) {
      resolvedPath = this.currentDirectory ? `${this.currentDirectory}/${href.substring(2)}` : href.substring(2);
    } else if (href.startsWith('../')) {
      // Handle parent directory references
      const parts = this.currentDirectory.split('/');
      const hrefParts = href.split('/');
      let parentCount = 0;
      
      for (const part of hrefParts) {
        if (part === '..') {
          parentCount++;
        } else {
          break;
        }
      }
      
      const baseParts = parts.slice(0, parts.length - parentCount);
      const remainingHref = hrefParts.slice(parentCount).join('/');
      resolvedPath = baseParts.length > 0 ? `${baseParts.join('/')}/${remainingHref}` : remainingHref;
    } else if (!href.startsWith('/')) {
      // Relative path without ./
      resolvedPath = this.currentDirectory ? `${this.currentDirectory}/${href}` : href;
    }

    // Check if we have a blob URL for this path
    const blobUrl = this.imageMap.get(resolvedPath);
    return blobUrl || href; // Fallback to original href if no blob URL found
  }

  private static isImageFile(path: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.bmp', '.webp'];
    const extension = path.toLowerCase().substring(path.lastIndexOf('.'));
    return imageExtensions.includes(extension);
  }

  private static getImageMimeType(path: string): string {
    const extension = path.toLowerCase().substring(path.lastIndexOf('.'));
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  private static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  static cleanup(): void {
    // Clean up blob URLs to prevent memory leaks
    this.imageMap.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    this.imageMap.clear();
  }
}