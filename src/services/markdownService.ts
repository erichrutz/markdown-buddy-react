import { marked } from 'marked';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import { PlantUMLService } from './plantumlService';

export class MarkdownService {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose'
    });

    const renderer = new marked.Renderer();

    renderer.link = ({ href, title, text }) => {
      if (href.endsWith('.md') || href.endsWith('.markdown')) {
        return `<a href="#" class="internal-md-link" data-md-path="${href}" title="${title || ''}">${text}</a>`;
      }
      return `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${title || ''}">${text}</a>`;
    };

    renderer.code = ({ text, lang, escaped }) => {
      if (lang === 'mermaid') {
        const id = 'mermaid-' + Math.random().toString(36).substr(2, 9);
        return `<div class="mermaid-diagram" id="${id}">${text}</div>`;
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
      gfm: true
    });

    this.initialized = true;
  }

  static async renderMarkdown(content: string): Promise<string> {
    this.initialize();
    
    try {
      const html = await marked(content);
      return html;
    } catch (error) {
      console.error('Markdown rendering error:', error);
      throw new Error('Failed to render markdown content');
    }
  }

  static async processMermaidDiagrams(container: HTMLElement): Promise<void> {
    const mermaidElements = container.querySelectorAll('.mermaid-diagram');
    
    for (const element of Array.from(mermaidElements)) {
      try {
        const content = element.textContent || '';
        const id = element.id;
        
        if (content.trim()) {
          const { svg } = await mermaid.render(id + '-svg', content);
          element.innerHTML = svg;
        }
      } catch (error) {
        console.error('Mermaid rendering error:', error);
        element.innerHTML = `<div class="mermaid-error">
          <p>Error rendering diagram:</p>
          <pre>${error}</pre>
        </div>`;
      }
    }
  }

  static processPlantUMLDiagrams(container: HTMLElement): void {
    PlantUMLService.processPlantUMLDiagrams(container);
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
}