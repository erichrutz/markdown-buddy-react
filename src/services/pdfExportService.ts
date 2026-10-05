import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { MarkdownFile } from '../types';

export interface PDFExportOptions {
  format: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  includeHeader: boolean;
  includeFooter: boolean;
  filename?: string;
  imageQuality?: number; // 0.1 to 1.0 for JPEG quality
  imageFormat?: 'png' | 'jpeg';
}

export const DEFAULT_PDF_OPTIONS: PDFExportOptions = {
  format: 'A4',
  orientation: 'portrait',
  margins: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  includeHeader: true,
  includeFooter: true,
  imageQuality: 0.7, // 70% quality for good balance of size vs quality
  imageFormat: 'jpeg' // JPEG is much smaller than PNG for photos
};

export class PDFExportService {
  /**
   * Export markdown content to PDF
   */
  static async exportToPDF(
    contentElement: HTMLElement,
    file: MarkdownFile,
    options: Partial<PDFExportOptions> = {}
  ): Promise<void> {
    const exportOptions = { ...DEFAULT_PDF_OPTIONS, ...options };
    
    try {
      // Create a clone of the content for PDF rendering
      const clonedElement = await this.prepareContentForPDF(contentElement);
      
      // Generate canvas from the content with optimized settings
      const canvas = await html2canvas(clonedElement, {
        scale: 1.5, // Reduced from 2 to balance quality and file size
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: clonedElement.scrollWidth,
        height: clonedElement.scrollHeight,
        logging: false, // Disable logging for performance
        imageTimeout: 15000, // 15 second timeout for images
        removeContainer: true // Clean up automatically
      });

      // Calculate PDF dimensions
      const { pdfWidth, pdfHeight } = this.getPDFDimensions(exportOptions.format, exportOptions.orientation);
      const contentWidth = pdfWidth - exportOptions.margins.left - exportOptions.margins.right;
      const contentHeight = pdfHeight - exportOptions.margins.top - exportOptions.margins.bottom;

      // Create PDF
      const pdf = new jsPDF({
        orientation: exportOptions.orientation,
        unit: 'mm',
        format: exportOptions.format
      });

      // Calculate scaling - only scale based on width to allow multi-page height
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Scale factor should only consider width, let height flow across pages
      const scaleFactor = contentWidth / (imgWidth * 0.264583);
      
      const finalWidth = (imgWidth * 0.264583) * scaleFactor;
      const finalHeight = (imgHeight * 0.264583) * scaleFactor;


      // Add header if enabled
      if (exportOptions.includeHeader) {
        this.addHeader(pdf, file, exportOptions);
      }

      // Add content preparation
      
      // Handle multi-page content
      let remainingHeight = finalHeight;
      let sourceY = 0;
      let pageNumber = 1;

      while (remainingHeight > 0) {
        // Calculate available content height per page
        const headerSpace = exportOptions.includeHeader ? 15 : 0;
        const footerSpace = exportOptions.includeFooter ? 10 : 0;
        const pageContentHeight = contentHeight - headerSpace - footerSpace;
        
        // Calculate how much content fits on this page
        let currentPageHeight = Math.min(remainingHeight, pageContentHeight);
        
        // Prevent infinite loops by ensuring minimum progress
        if (currentPageHeight <= 0) {
          currentPageHeight = Math.min(remainingHeight, 10); // Force minimal progress
        }

        
        if (pageNumber > 1) {
          pdf.addPage();
          if (exportOptions.includeHeader) {
            this.addHeader(pdf, file, exportOptions);
          }
        }

        // Calculate Y position for content on current page
        const currentYPosition = exportOptions.includeHeader ? exportOptions.margins.top + 15 : exportOptions.margins.top;

        // Create canvas for current page
        const pageCanvas = document.createElement('canvas');
        const pageCtx = pageCanvas.getContext('2d');
        
        if (pageCtx) {
          const sourceHeight = (currentPageHeight / scaleFactor) / 0.264583;
          pageCanvas.width = imgWidth;
          pageCanvas.height = sourceHeight;
          
          pageCtx.drawImage(canvas, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight);
          
          // Use optimized image format and quality
          const imageFormat = exportOptions.imageFormat || 'jpeg';
          const imageQuality = exportOptions.imageQuality || 0.7;
          
          const pageImgData = imageFormat === 'jpeg' 
            ? pageCanvas.toDataURL('image/jpeg', imageQuality)
            : pageCanvas.toDataURL('image/png');
            
          pdf.addImage(
            pageImgData,
            imageFormat.toUpperCase(),
            exportOptions.margins.left,
            currentYPosition,
            finalWidth,
            currentPageHeight
          );
        }

        // Add footer if enabled
        if (exportOptions.includeFooter) {
          this.addFooter(pdf, pageNumber, exportOptions);
        }

        remainingHeight -= currentPageHeight;
        sourceY += (currentPageHeight / scaleFactor) / 0.264583;
        pageNumber++;
      }

      // Clean up
      document.body.removeChild(clonedElement);

      // Save PDF
      const filename = exportOptions.filename || this.generateFilename(file);
      pdf.save(filename);

    } catch (error) {
      console.error('PDF Export Error:', error);
      throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Prepare content element for PDF rendering
   */
  private static async prepareContentForPDF(originalElement: HTMLElement): Promise<HTMLElement> {
    // Clone the element
    const clone = originalElement.cloneNode(true) as HTMLElement;
    
    // Fix any lost code block content immediately after cloning
    this.fixCodeBlocks(clone, originalElement);
    
    // Apply PDF-specific styles
    clone.style.cssText = `
      width: 210mm;
      max-width: 210mm;
      padding: 20px;
      margin: 0;
      background: white;
      color: black;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      position: absolute;
      top: -9999px;
      left: -9999px;
      overflow: visible;
      box-sizing: border-box;
    `;

    // Style and fix code blocks for better PDF rendering
    const codeBlocks = clone.querySelectorAll('pre, code');
    codeBlocks.forEach((block) => {
      const element = block as HTMLElement;
      
      // Ensure code content is preserved - sometimes innerHTML can be lost
      if (element.textContent && !element.innerHTML.includes(element.textContent)) {
        // Simple HTML escape for code content
        const escapedText = element.textContent
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
        element.innerHTML = escapedText;
      }
      
      // Apply comprehensive styling to ensure visibility
      element.style.cssText += `
        background: #f8f9fa !important;
        border: 1px solid #e1e4e8 !important;
        border-radius: 6px !important;
        padding: 12px !important;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace !important;
        font-size: 12px !important;
        line-height: 1.45 !important;
        overflow-wrap: break-word !important;
        word-break: break-all !important;
        white-space: pre-wrap !important;
        display: block !important;
        margin: 12px 0 !important;
        max-width: 100% !important;
      `;

      // Special handling for pre > code blocks (common in markdown)
      if (element.tagName === 'PRE') {
        const codeChild = element.querySelector('code');
        if (codeChild) {
          // Ensure the code child has the same styling
          (codeChild as HTMLElement).style.cssText += `
            background: transparent !important;
            border: none !important;
            padding: 0 !important;
            font-family: inherit !important;
            font-size: inherit !important;
            color: inherit !important;
            white-space: inherit !important;
          `;
        }
      }


    });

    // Style tables
    const tables = clone.querySelectorAll('table');
    tables.forEach(table => {
      (table as HTMLElement).style.cssText += `
        border-collapse: collapse !important;
        width: 100% !important;
        margin: 16px 0 !important;
      `;
      
      const cells = table.querySelectorAll('th, td');
      cells.forEach(cell => {
        (cell as HTMLElement).style.cssText += `
          border: 1px solid #ddd !important;
          padding: 8px !important;
          text-align: left !important;
        `;
      });
    });

    // Style blockquotes
    const blockquotes = clone.querySelectorAll('blockquote');
    blockquotes.forEach(bq => {
      (bq as HTMLElement).style.cssText += `
        border-left: 4px solid #d1d5db !important;
        margin: 16px 0 !important;
        padding-left: 16px !important;
        color: #6b7280 !important;
      `;
    });

    // Optimize images in the content
    await this.optimizeImagesInContent(clone);
    

    
    // Add to DOM temporarily for rendering
    document.body.appendChild(clone);
    
    // Wait for fonts and images to load
    await this.waitForContent(clone);
    
    return clone;
  }



  /**
   * Fix code blocks to ensure content is preserved in PDF
   */
  private static fixCodeBlocks(clone: HTMLElement, original: HTMLElement): void {
    const cloneCodeBlocks = Array.from(clone.querySelectorAll('pre code, pre, code'));
    const originalCodeBlocks = Array.from(original.querySelectorAll('pre code, pre, code'));

    cloneCodeBlocks.forEach((cloneBlock, index) => {
      if (originalCodeBlocks[index]) {
        const cloneEl = cloneBlock as HTMLElement;
        const originalEl = originalCodeBlocks[index] as HTMLElement;
        
        // If clone lost text content, restore it from original
        if (!cloneEl.textContent?.trim() && originalEl.textContent?.trim()) {
          cloneEl.textContent = originalEl.textContent;
        }
        
        // Ensure innerHTML is preserved too
        if (!cloneEl.innerHTML.trim() && originalEl.innerHTML.trim()) {
          cloneEl.innerHTML = originalEl.innerHTML;
        }
      }
    });
  }



  /**
   * Optimize images in content for better PDF compression
   */
  private static async optimizeImagesInContent(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img');
    
    for (const img of Array.from(images)) {
      try {
        // Set max dimensions for images to prevent oversized images in PDF
        const maxWidth = 600; // Max width in pixels for PDF
        const maxHeight = 400; // Max height in pixels for PDF
        
        img.style.maxWidth = `${maxWidth}px`;
        img.style.maxHeight = `${maxHeight}px`;
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.objectFit = 'contain';
        
        // If image is loaded, we can get its natural dimensions and optimize further
        if (img.complete && img.naturalWidth > 0) {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          
          // Calculate optimal display size
          let displayWidth = Math.min(img.naturalWidth, maxWidth);
          let displayHeight = displayWidth / aspectRatio;
          
          if (displayHeight > maxHeight) {
            displayHeight = maxHeight;
            displayWidth = displayHeight * aspectRatio;
          }
          
          img.style.width = `${displayWidth}px`;
          img.style.height = `${displayHeight}px`;
        }
      } catch (error) {
        console.warn('Error optimizing image for PDF:', error);
      }
    }
  }

  /**
   * Wait for content to be fully loaded
   */
  private static async waitForContent(element: HTMLElement): Promise<void> {
    const images = element.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
      return new Promise<void>((resolve) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Continue even if image fails
        }
      });
    });

    await Promise.all(imagePromises);
    
    // Additional delay for any remaining rendering
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Add header to PDF
   */
  private static addHeader(pdf: jsPDF, file: MarkdownFile, options: PDFExportOptions): void {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(file.name, options.margins.left, options.margins.top + 5);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const exportDate = new Date().toLocaleDateString();
    const pageWidth = this.getPDFDimensions(options.format, options.orientation).pdfWidth;
    pdf.text(
      `Exported: ${exportDate}`,
      pageWidth - options.margins.right,
      options.margins.top + 5,
      { align: 'right' }
    );
    
    // Add line under header
    pdf.setLineWidth(0.5);
    pdf.line(
      options.margins.left,
      options.margins.top + 8,
      pageWidth - options.margins.right,
      options.margins.top + 8
    );
  }

  /**
   * Add footer to PDF
   */
  private static addFooter(pdf: jsPDF, pageNumber: number, options: PDFExportOptions): void {
    const { pdfWidth, pdfHeight } = this.getPDFDimensions(options.format, options.orientation);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    // Add line above footer
    pdf.setLineWidth(0.5);
    pdf.line(
      options.margins.left,
      pdfHeight - options.margins.bottom - 8,
      pdfWidth - options.margins.right,
      pdfHeight - options.margins.bottom - 8
    );
    
    // Page number
    pdf.text(
      `Page ${pageNumber}`,
      pdfWidth - options.margins.right,
      pdfHeight - options.margins.bottom - 3,
      { align: 'right' }
    );
    
    // Generated by MarkDown Buddy
    pdf.text(
      'Generated by MarkDown Buddy',
      options.margins.left,
      pdfHeight - options.margins.bottom - 3
    );
  }

  /**
   * Get PDF dimensions based on format and orientation
   */
  private static getPDFDimensions(format: string, orientation: string): { pdfWidth: number; pdfHeight: number } {
    const dimensions = {
      A4: { width: 210, height: 297 },
      Letter: { width: 216, height: 279 },
      Legal: { width: 216, height: 356 }
    };

    const { width, height } = dimensions[format as keyof typeof dimensions] || dimensions.A4;
    
    return orientation === 'landscape'
      ? { pdfWidth: height, pdfHeight: width }
      : { pdfWidth: width, pdfHeight: height };
  }

  /**
   * Generate filename for PDF export
   */
  private static generateFilename(file: MarkdownFile): string {
    const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}.pdf`;
  }

  /**
   * Check if PDF export is supported
   */
  static isSupported(): boolean {
    try {
      return typeof window !== 'undefined' && 
             typeof document !== 'undefined' && 
             !!document.createElement('canvas').getContext;
    } catch {
      return false;
    }
  }
}