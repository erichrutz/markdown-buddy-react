export class ImageService {
  private static imageCache: Map<string, string> = new Map();

  /**
   * Register image files and create blob URLs for them
   */
  static registerImages(files: any[]): void {
    // Clear previous cache
    this.clearCache();
    
    files.forEach(fileData => {
      if (fileData.type === 'image') {
        const blobUrl = URL.createObjectURL(fileData.file);
        this.imageCache.set(fileData.path, blobUrl);
      }
    });
  }

  /**
   * Get blob URL for an image path
   */
  static getImageUrl(imagePath: string): string | null {
    return this.imageCache.get(imagePath) || null;
  }

  /**
   * Resolve relative image paths in markdown content
   */
  static resolveImagePaths(content: string, currentFilePath: string, files: any[]): string {
    if (!content) return content;

    // Create a map of relative paths to blob URLs
    const pathMap = new Map<string, string>();
    
    files.forEach(fileData => {
      if (fileData.type === 'image') {
        const blobUrl = this.getImageUrl(fileData.path);
        if (blobUrl) {
          // Map the full path
          pathMap.set(fileData.path, blobUrl);
          
          // Map just the filename for same-directory references
          const filename = fileData.path.split('/').pop();
          if (filename) {
            pathMap.set(filename, blobUrl);
            pathMap.set('./' + filename, blobUrl);
          }
          
          // Also map relative paths from current file's directory
          const currentDir = currentFilePath.split('/').slice(0, -1).join('/');
          const relativePath = this.getRelativePath(currentDir, fileData.path);
          if (relativePath) {
            pathMap.set(relativePath, blobUrl);
          }
        }
      }
    });


    // Replace image src attributes in the content
    let resolvedContent = content;
    
    // Match img tags with src attributes
    const imgRegex = /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi;
    resolvedContent = resolvedContent.replace(imgRegex, (_match, before, src, after) => {
      const resolvedSrc = this.resolveImageSrc(src, pathMap);
      return `<img${before}src="${resolvedSrc}"${after}>`;
    });

    // Match markdown image syntax ![alt](src)
    const markdownImgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    resolvedContent = resolvedContent.replace(markdownImgRegex, (_match, alt, src) => {
      const resolvedSrc = this.resolveImageSrc(src, pathMap);
      return `![${alt}](${resolvedSrc})`;
    });

    return resolvedContent;
  }

  /**
   * Resolve a single image src attribute
   */
  private static resolveImageSrc(src: string, pathMap: Map<string, string>): string {
    // Skip absolute URLs and data URLs
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
      return src;
    }

    // Check direct path match
    if (pathMap.has(src)) {
      return pathMap.get(src)!;
    }

    // Check for partial matches (handle different path formats)
    for (const [path, blobUrl] of pathMap.entries()) {
      if (path.endsWith(src) || src.endsWith(path.split('/').pop() || '')) {
        return blobUrl;
      }
    }

    // Return original src if no match found
    return src;
  }

  /**
   * Get relative path from one directory to another file
   */
  private static getRelativePath(fromDir: string, toFilePath: string): string | null {
    if (!fromDir || !toFilePath) return null;

    const fromParts = fromDir.split('/').filter(Boolean);
    const toParts = toFilePath.split('/').filter(Boolean);

    // Find common prefix
    let commonLength = 0;
    while (
      commonLength < fromParts.length &&
      commonLength < toParts.length &&
      fromParts[commonLength] === toParts[commonLength]
    ) {
      commonLength++;
    }

    // Build relative path
    const upDirs = fromParts.length - commonLength;
    const relativeParts = [
      ...Array(upDirs).fill('..'),
      ...toParts.slice(commonLength)
    ];

    return relativeParts.join('/');
  }

  /**
   * Clear all cached blob URLs to prevent memory leaks
   */
  static clearCache(): void {
    this.imageCache.forEach(blobUrl => {
      URL.revokeObjectURL(blobUrl);
    });
    this.imageCache.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheInfo(): { count: number; paths: string[] } {
    return {
      count: this.imageCache.size,
      paths: Array.from(this.imageCache.keys())
    };
  }
}