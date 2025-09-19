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
  includeFooter: true
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
      
      // Generate canvas from the content
      const canvas = await html2canvas(clonedElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        width: clonedElement.scrollWidth,
        height: clonedElement.scrollHeight
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

      // Add content
      const imgData = canvas.toDataURL('image/png');
      const yPosition = exportOptions.includeHeader ? exportOptions.margins.top + 15 : exportOptions.margins.top;
      
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
          
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(
            pageImgData,
            'PNG',
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

    // Style code blocks for better PDF rendering
    const codeBlocks = clone.querySelectorAll('pre, code');
    codeBlocks.forEach(block => {
      (block as HTMLElement).style.cssText += `
        background: #f5f5f5 !important;
        border: 1px solid #ddd !important;
        border-radius: 4px !important;
        padding: 8px !important;
        font-family: 'Courier New', monospace !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
        overflow-wrap: break-word !important;
        word-break: break-all !important;
      `;
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
        border-left: 4px solid #ddd !important;
        margin: 16px 0 !important;
        padding-left: 16px !important;
        color: #666 !important;
      `;
    });

    // Add to DOM temporarily for rendering
    document.body.appendChild(clone);
    
    // Wait for fonts and images to load
    await this.waitForContent(clone);
    
    return clone;
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
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${baseName}_${timestamp}.pdf`;
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