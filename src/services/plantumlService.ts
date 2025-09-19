import plantumlEncoder from 'plantuml-encoder';

interface PlantUMLCache {
  [hash: string]: {
    svg: string;
    timestamp: number;
  };
}

export class PlantUMLService {
  private static readonly PLANTUML_SERVER = 'https://www.plantuml.com/plantuml';
  private static readonly CACHE_KEY = 'plantuml-diagram-cache';
  private static readonly CACHE_EXPIRY_DAYS = 30; // Cache expires after 30 days
  private static cache: Map<string, string> = new Map();
  private static currentTheme: 'light' | 'dark' = 'light';
  
  /**
   * Set the current theme for PlantUML diagrams
   */
  static setTheme(theme: 'light' | 'dark') {
    this.currentTheme = theme;
  }
  
  /**
   * Process PlantUML diagrams in a container element
   */
  static async processPlantUMLDiagrams(container: HTMLElement, theme: 'light' | 'dark' = 'light'): Promise<void> {
    this.setTheme(theme);
    try {
      const plantUMLBlocks = container.querySelectorAll('pre code.language-plantuml:not([data-processed]), pre code.language-puml:not([data-processed])');
      
      // Process all diagrams in parallel
      const renderPromises = Array.from(plantUMLBlocks).map((block) => {
        const content = block.textContent || '';
        if (content.trim() && !content.includes('<svg')) {
          // Mark as processing to prevent double rendering
          block.setAttribute('data-processed', 'true');
          return this.renderPlantUMLDiagram(block as HTMLElement, content);
        }
        return Promise.resolve();
      });
      
      await Promise.all(renderPromises);
    } catch (error) {
      console.error('PlantUMLService: Error processing PlantUML diagrams:', error);
    }
  }

  /**
   * Render a single PlantUML diagram with caching
   */
  private static async renderPlantUMLDiagram(element: HTMLElement, plantUMLCode: string): Promise<void> {
    try {
      // Clean up the PlantUML code
      let cleanCode = plantUMLCode.trim();
      
      // Add @startuml/@enduml if not present
      if (!cleanCode.startsWith('@start')) {
        cleanCode = `@startuml\n${cleanCode}\n@enduml`;
      }

      // Create container for the diagram
      const diagramContainer = document.createElement('div');
      diagramContainer.className = 'plantuml-diagram';
      const borderColor = this.currentTheme === 'dark' ? '#404040' : '#e0e0e0';
      const backgroundColor = this.currentTheme === 'dark' ? '#2d2d2d' : 'white';
      const textColor = this.currentTheme === 'dark' ? '#ffffff' : '#666';
      
      diagramContainer.style.cssText = `
        margin: 16px 0;
        text-align: center;
        border: 1px solid ${borderColor};
        border-radius: 4px;
        padding: 16px;
        background-color: ${backgroundColor};
        color: ${textColor};
      `;
      
      // Add loading indicator first
      diagramContainer.innerHTML = `
        <div style="color: ${textColor}; padding: 16px;">
          Loading PlantUML diagram...
        </div>
      `;

      // Replace the code block with the container immediately
      const preElement = element.closest('pre');
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(diagramContainer, preElement);
      }

      try {
        // Try to get cached SVG first
        const svgContent = await this.getCachedOrRenderSVG(cleanCode);
        
        if (svgContent.startsWith('<svg')) {
          // Direct SVG content
          diagramContainer.innerHTML = svgContent;
        } else {
          // URL to image
          const img = document.createElement('img');
          img.src = svgContent;
          img.alt = 'PlantUML Diagram';
          img.style.cssText = `
            max-width: 100%;
            height: auto;
          `;
          
          img.onload = () => {
            diagramContainer.innerHTML = '';
            diagramContainer.appendChild(img);
          };
          
          img.onerror = () => {
            this.showError(diagramContainer, 'Failed to load diagram. Please check your PlantUML syntax.');
          };
        }
      } catch (error) {
        console.error('PlantUMLService: Error loading diagram:', error);
        this.showError(diagramContainer, error instanceof Error ? error.message : 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('PlantUMLService: Error rendering diagram:', error);
      this.showError(element, error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Get cached SVG or render new one
   */
  private static async getCachedOrRenderSVG(cleanCode: string): Promise<string> {
    const codeHash = this.hashCode(cleanCode);
    
    // Check memory cache first
    if (this.cache.has(codeHash)) {
      console.log('PlantUMLService: Using memory cache for diagram');
      return this.cache.get(codeHash)!;
    }
    
    // Check localStorage cache
    const cachedSvg = this.getCachedSVG(codeHash);
    if (cachedSvg) {
      console.log('PlantUMLService: Using localStorage cache for diagram');
      this.cache.set(codeHash, cachedSvg);
      return cachedSvg;
    }
    
    // Render new diagram
    console.log('PlantUMLService: Rendering new diagram');
    const encoded = plantumlEncoder.encode(cleanCode);
    const imageUrl = `${this.PLANTUML_SERVER}/svg/${encoded}`;
    
    try {
      // Fetch SVG content
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const svgContent = await response.text();
      
      // Cache the result
      this.cacheSVG(codeHash, svgContent);
      this.cache.set(codeHash, svgContent);
      
      return svgContent;
    } catch (error) {
      // Fallback to image URL if direct SVG fetch fails
      console.warn('PlantUMLService: SVG fetch failed, falling back to image URL:', error);
      return imageUrl;
    }
  }

  /**
   * Generate hash code for PlantUML content
   */
  private static hashCode(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached SVG from localStorage
   */
  private static getCachedSVG(hash: string): string | null {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return null;
      
      const cache: PlantUMLCache = JSON.parse(cacheData);
      const entry = cache[hash];
      
      if (!entry) return null;
      
      // Check if cache entry is expired
      const now = Date.now();
      const expiryTime = entry.timestamp + (this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      
      if (now > expiryTime) {
        console.log('PlantUMLService: Cache entry expired for hash:', hash);
        delete cache[hash];
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        return null;
      }
      
      return entry.svg;
    } catch (error) {
      console.warn('PlantUMLService: Error reading cache:', error);
      return null;
    }
  }

  /**
   * Cache SVG in localStorage
   */
  private static cacheSVG(hash: string, svg: string): void {
    try {
      let cache: PlantUMLCache = {};
      
      const existingCache = localStorage.getItem(this.CACHE_KEY);
      if (existingCache) {
        cache = JSON.parse(existingCache);
      }
      
      cache[hash] = {
        svg,
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
      console.log('PlantUMLService: Cached diagram with hash:', hash);
    } catch (error) {
      console.warn('PlantUMLService: Error saving to cache:', error);
    }
  }

  /**
   * Show error message in container
   */
  private static showError(container: HTMLElement, message: string): void {
    if (container.tagName === 'DIV' && container.classList.contains('plantuml-diagram')) {
      container.innerHTML = `
        <div style="color: #f44336; padding: 16px; text-align: center;">
          <strong>PlantUML Diagram Error</strong><br>
          ${message}
        </div>
      `;
    } else {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'plantuml-error';
      errorDiv.style.cssText = `
        margin: 16px 0;
        padding: 16px;
        border: 1px solid #f44336;
        border-radius: 4px;
        background-color: #ffebee;
        color: #c62828;
        text-align: center;
      `;
      errorDiv.innerHTML = `
        <strong>PlantUML Error</strong><br>
        ${message}
      `;
      
      const preElement = container.closest('pre');
      if (preElement && preElement.parentNode) {
        preElement.parentNode.replaceChild(errorDiv, preElement);
      }
    }
  }

  /**
   * Check if PlantUML server is available
   */
  static async checkServerAvailability(): Promise<boolean> {
    try {
      const testCode = '@startuml\nAlice -> Bob: Hello\n@enduml';
      const encoded = plantumlEncoder.encode(testCode);
      const testUrl = `${this.PLANTUML_SERVER}/svg/${encoded}`;
      
      const response = await fetch(testUrl, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Clear all cached diagrams
   */
  static clearCache(): void {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      this.cache.clear();
      console.log('PlantUMLService: Cache cleared');
    } catch (error) {
      console.warn('PlantUMLService: Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getCacheInfo(): { count: number; sizeEstimate: string; expiredCount: number } {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) {
        return { count: 0, sizeEstimate: '0 KB', expiredCount: 0 };
      }

      const cache: PlantUMLCache = JSON.parse(cacheData);
      const entries = Object.entries(cache);
      const now = Date.now();
      const expiryTime = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      let expiredCount = 0;
      entries.forEach(([_, entry]) => {
        if (now > entry.timestamp + expiryTime) {
          expiredCount++;
        }
      });

      const sizeBytes = new Blob([cacheData]).size;
      const sizeKB = (sizeBytes / 1024).toFixed(1);

      return {
        count: entries.length,
        sizeEstimate: `${sizeKB} KB`,
        expiredCount
      };
    } catch (error) {
      console.warn('PlantUMLService: Error getting cache info:', error);
      return { count: 0, sizeEstimate: '0 KB', expiredCount: 0 };
    }
  }

  /**
   * Clean up expired cache entries
   */
  static cleanExpiredCache(): number {
    try {
      const cacheData = localStorage.getItem(this.CACHE_KEY);
      if (!cacheData) return 0;

      const cache: PlantUMLCache = JSON.parse(cacheData);
      const now = Date.now();
      const expiryTime = this.CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      
      let removedCount = 0;
      Object.keys(cache).forEach(hash => {
        if (now > cache[hash].timestamp + expiryTime) {
          delete cache[hash];
          removedCount++;
        }
      });

      if (removedCount > 0) {
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        console.log(`PlantUMLService: Cleaned ${removedCount} expired cache entries`);
      }

      return removedCount;
    } catch (error) {
      console.warn('PlantUMLService: Error cleaning expired cache:', error);
      return 0;
    }
  }
}