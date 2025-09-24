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
  fontSize: number;
  lineHeight: number;
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
  fontSize: 11,
  lineHeight: 1.0
};

interface ParsedContent {
  type: 'text' | 'heading' | 'code' | 'list' | 'table' | 'image' | 'diagram';
  content: string;
  level?: number; // for headings
  style?: 'bold' | 'italic' | 'normal';
  metadata?: any;
  imageData?: string; // Base64 image data for diagrams
  width?: number;
  height?: number;
}

export class PDFExportServiceV2 {
  /**
   * Process text to handle Unicode characters properly
   */
  private static processUnicodeText(text: string): string {
    // Remove all emoji and Unicode symbols using regex
    // This regex matches most emoji ranges and common symbols
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Regional indicator symbols
      .replace(/[\u{2600}-\u{26FF}]/gu, '') // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '') // Dingbats
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '') // Variation Selectors
      .replace(/[\u{200D}]/gu, '') // Zero Width Joiner
      .replace(/∅|Ÿ|Üe/g, '') // Specific problematic characters
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .trim(); // Remove leading/trailing spaces
  }

  /**
   * Export markdown content to PDF using text-based approach
   */
  static async exportToPDF(
    contentElement: HTMLElement,
    file: MarkdownFile,
    options: Partial<PDFExportOptions> = {}
  ): Promise<void> {
    const exportOptions = { ...DEFAULT_PDF_OPTIONS, ...options };

    try {
      // Parse the HTML content into structured elements
      const parsedContent = this.parseHTMLContent(contentElement);

      // Capture diagram images
      await this.captureDiagramImages(parsedContent);

      // Create PDF
      const pdf = new jsPDF({
        orientation: exportOptions.orientation,
        unit: 'mm',
        format: exportOptions.format
      });

      // Set up PDF context
      const context = this.initializePDFContext(pdf, exportOptions);

      // Add header on first page
      if (exportOptions.includeHeader) {
        this.addHeader(pdf, file, exportOptions, context);
        context.currentY += 15;
      }

      // Process content with intelligent page breaking
      await this.renderContentToPDF(pdf, parsedContent, context, exportOptions);

      // Save PDF
      const filename = exportOptions.filename || this.generateFilename(file);
      pdf.save(filename);

    } catch (error) {
      console.error('PDF Export Error:', error);
      throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse HTML content into structured elements
   */
  private static parseHTMLContent(element: HTMLElement): ParsedContent[] {
    const parsed: ParsedContent[] = [];

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text) {
          parsed.push({
            type: 'text',
            content: text,
            style: 'normal'
          });
        }
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        switch (tagName) {
          case 'h1':
          case 'h2':
          case 'h3':
          case 'h4':
          case 'h5':
          case 'h6':
            parsed.push({
              type: 'heading',
              content: element.textContent || '',
              level: parseInt(tagName.charAt(1)),
              style: 'bold'
            });
            break;

          case 'p': {
            const textContent = element.textContent?.trim();
            if (textContent) {
              parsed.push({
                type: 'text',
                content: textContent,
                style: 'normal'
              });
            }
            break;
          }

          case 'pre':
          case 'code':
            // Handle diagrams specially by capturing as images
            if (element.classList.contains('mermaid-diagram') ||
                element.classList.contains('plantuml-diagram')) {
              // We'll process diagrams in a separate pass after parsing
              parsed.push({
                type: 'diagram',
                content: element.textContent || '',
                metadata: {
                  diagramType: element.classList.contains('mermaid-diagram') ? 'mermaid' : 'plantuml',
                  element: element // Store reference for image capture
                }
              });
            } else {
              parsed.push({
                type: 'code',
                content: element.textContent || '',
                style: 'normal'
              });
            }
            break;

          case 'div':
            // Handle div-based diagrams (both Mermaid and PlantUML render into divs)
            if (element.classList.contains('mermaid-diagram') ||
                element.classList.contains('plantuml-diagram')) {
              // We'll process diagrams in a separate pass after parsing
              parsed.push({
                type: 'diagram',
                content: element.textContent || '',
                metadata: {
                  diagramType: element.classList.contains('mermaid-diagram') ? 'mermaid' : 'plantuml',
                  element: element // Store reference for image capture
                }
              });
            } else {
              // For other divs, process children
              Array.from(node.childNodes).forEach(processNode);
            }
            break;

          case 'ul':
          case 'ol': {
            const listItems = Array.from(element.querySelectorAll('li'))
              .map((li, index) => {
                const prefix = tagName === 'ul' ? '• ' : `${index + 1}. `;
                return prefix + (li.textContent || '');
              })
              .join('\n');

            parsed.push({
              type: 'list',
              content: listItems,
              style: 'normal'
            });
            break;
          }

          case 'table':
            parsed.push({
              type: 'table',
              content: this.parseTableContent(element),
              style: 'normal'
            });
            break;

          case 'img': {
            const imgElement = element as HTMLImageElement;
            parsed.push({
              type: 'image',
              content: `[Image: ${imgElement.alt || 'Embedded image'}]`,
              metadata: {
                src: imgElement.src,
                alt: imgElement.alt,
                element: imgElement
              }
            });
            break;
          }

          case 'strong':
          case 'b':
            parsed.push({
              type: 'text',
              content: element.textContent || '',
              style: 'bold'
            });
            break;

          case 'em':
          case 'i':
            parsed.push({
              type: 'text',
              content: element.textContent || '',
              style: 'italic'
            });
            break;

          case 'blockquote':
            parsed.push({
              type: 'text',
              content: `"${element.textContent || ''}"`,
              style: 'italic'
            });
            break;

          default:
            // For other elements, process children
            Array.from(node.childNodes).forEach(processNode);
            break;
        }
      }
    };

    Array.from(element.childNodes).forEach(processNode);
    return parsed;
  }

  /**
   * Capture diagram and regular images for embedding in PDF
   */
  private static async captureDiagramImages(content: ParsedContent[]): Promise<void> {
    for (const item of content) {
      if ((item.type === 'diagram' || item.type === 'image') && item.metadata?.element) {
        try {
          const element = item.metadata.element as HTMLElement;

          let targetElement: Element;

          if (item.type === 'diagram') {
            // Find the actual SVG or rendered diagram within the element
            let diagramElement: Element | null = element.querySelector('svg');
            if (!diagramElement) {
              // For PlantUML, look for img elements
              diagramElement = element.querySelector('img');
            }
            targetElement = diagramElement || element;


          } else {
            // For regular images, use the img element directly
            targetElement = element;
          }

          if (targetElement) {
            // For regular img elements that might use blob URLs, we can directly get their data
            if (targetElement.tagName === 'IMG') {
              const img = targetElement as HTMLImageElement;

              // If it's a blob URL (like our embedded images), capture it
              if (img.src.startsWith('blob:') || img.src.startsWith('data:')) {
                // Use html2canvas to capture the image
                const canvas = await html2canvas(img as HTMLElement, {
                  backgroundColor: null,
                  scale: 1,
                  logging: false,
                  useCORS: true,
                  allowTaint: true
                });

                item.imageData = canvas.toDataURL('image/png');
                item.width = canvas.width;
                item.height = canvas.height;

                if (item.type === 'image') {
                  item.content = `[Image: ${img.alt || 'Embedded image'} - captured]`;
                } else {
                  item.content = `[${item.metadata.diagramType} diagram captured]`;
                }
              } else {
                // For external URLs, we can try to embed directly
                item.imageData = img.src;
                item.width = img.naturalWidth || img.offsetWidth || 400;
                item.height = img.naturalHeight || img.offsetHeight || 300;

                if (item.type === 'image') {
                  item.content = `[Image: ${img.alt || 'External image'} - embedded]`;
                } else {
                  item.content = `[${item.metadata.diagramType} diagram embedded]`;
                }
              }
            } else {
              // For SVG diagrams, capture using html2canvas
              const htmlElement = targetElement as HTMLElement;

              // For SVG elements, ensure they have proper dimensions
              if (htmlElement.tagName === 'SVG') {
                const svg = htmlElement as unknown as SVGElement;
                const containerElement = element;

                // Get the container's dimensions as fallback
                const containerWidth = containerElement.offsetWidth || 800;
                const containerHeight = containerElement.offsetHeight || 600;

                // Ensure SVG has explicit width and height for rendering
                if (!svg.style.width || svg.style.width === '100%') {
                  svg.style.width = containerWidth + 'px';
                }
                if (!svg.style.height || svg.style.height === 'auto') {
                  svg.style.height = containerHeight + 'px';
                }

                // Force a layout recalculation
                svg.getBoundingClientRect();
              }

              // Capture the container element instead of just the SVG for better results
              const elementToCapture = (targetElement as HTMLElement).offsetWidth > 0 ? targetElement as HTMLElement : element;

              const canvas = await html2canvas(elementToCapture, {
                backgroundColor: null,
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
                width: elementToCapture.offsetWidth || 800,
                height: elementToCapture.offsetHeight || 600
              });

              item.imageData = canvas.toDataURL('image/png');
              item.width = canvas.width;
              item.height = canvas.height;
              item.content = `[${item.metadata.diagramType} diagram captured]`;
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Failed to capture ${item.type === 'diagram' ? item.metadata?.diagramType : 'image'}:`, {
            error: errorMessage,
            elementType: item.type,
            diagramType: item.metadata?.diagramType
          });
          // Fallback to placeholder text
          if (item.type === 'diagram') {
            item.content = `[${item.metadata.diagramType} diagram - capture failed]`;
          } else {
            item.content = `[Image - capture failed]`;
          }
        }
      }
    }
  }

  /**
   * Parse table content into readable text
   */
  private static parseTableContent(table: HTMLElement): string {
    const rows = Array.from(table.querySelectorAll('tr'));
    return rows.map(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      return cells.map(cell => cell.textContent || '').join(' | ');
    }).join('\n');
  }

  /**
   * Initialize PDF rendering context
   */
  private static initializePDFContext(pdf: jsPDF, options: PDFExportOptions) {
    const { pdfWidth, pdfHeight } = this.getPDFDimensions(options.format, options.orientation);

    return {
      pdf,
      pageWidth: pdfWidth,
      pageHeight: pdfHeight,
      contentWidth: pdfWidth - options.margins.left - options.margins.right,
      contentHeight: pdfHeight - options.margins.top - options.margins.bottom,
      currentY: options.margins.top,
      currentPage: 1,
      margins: options.margins
    };
  }

  /**
   * Render parsed content to PDF with intelligent page breaking
   */
  private static async renderContentToPDF(
    pdf: jsPDF,
    content: ParsedContent[],
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    for (const item of content) {
      await this.renderContentItem(pdf, item, context, options);
    }
  }

  /**
   * Render individual content item
   */
  private static async renderContentItem(
    pdf: jsPDF,
    item: ParsedContent,
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    switch (item.type) {
      case 'heading':
        await this.renderHeading(pdf, item, context, options);
        break;

      case 'text':
        await this.renderText(pdf, item, context, options);
        break;

      case 'code':
        await this.renderCode(pdf, item, context, options);
        break;

      case 'list':
        await this.renderList(pdf, item, context, options);
        break;

      case 'table':
        await this.renderTable(pdf, item, context, options);
        break;

      case 'image':
      case 'diagram':
        await this.renderPlaceholder(pdf, item, context, options);
        break;
    }
  }

  /**
   * Render heading with proper styling
   */
  private static async renderHeading(
    pdf: jsPDF,
    item: ParsedContent,
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    const fontSize = options.fontSize + (6 - (item.level || 1)) * 2;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', 'bold');

    // Add spacing before heading
    context.currentY += options.fontSize * 0.3;

    // Check if heading fits on current page
    const headingHeight = fontSize * 1.2;
    if (context.currentY + headingHeight > context.pageHeight - context.margins.bottom) {
      this.addNewPage(pdf, context, options);
    }

    // Render heading with Unicode processing
    const processedContent = this.processUnicodeText(item.content);
    const lines = pdf.splitTextToSize(processedContent, context.contentWidth);
    pdf.text(lines, context.margins.left, context.currentY);

    context.currentY += headingHeight;

    // Add spacing after heading
    context.currentY += options.fontSize * 0.2;
  }

  /**
   * Render regular text with word wrapping and page breaks
   */
  private static async renderText(
    pdf: jsPDF,
    item: ParsedContent,
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    pdf.setFontSize(options.fontSize);
    pdf.setFont('helvetica', item.style === 'bold' ? 'bold' :
                               item.style === 'italic' ? 'italic' : 'normal');

    // Process Unicode characters and split text into lines that fit within the page width
    const processedContent = this.processUnicodeText(item.content);
    const lines = pdf.splitTextToSize(processedContent, context.contentWidth);
    const lineHeight = options.fontSize * options.lineHeight;

    for (const line of lines) {
      // Check if line fits on current page
      if (context.currentY + lineHeight > context.pageHeight - context.margins.bottom) {
        this.addNewPage(pdf, context, options);
      }

      // Render line
      pdf.text(line, context.margins.left, context.currentY);
      context.currentY += lineHeight;
    }

    // Add paragraph spacing
    context.currentY += lineHeight * 0.2;
  }

  /**
   * Render code block with monospace font
   */
  private static async renderCode(
    pdf: jsPDF,
    item: ParsedContent,
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    pdf.setFontSize(options.fontSize - 1);
    pdf.setFont('courier', 'normal');

    const lines = item.content.split('\n');
    const lineHeight = (options.fontSize - 1) * 1.2;

    // Add background placeholder for code blocks
    const totalHeight = lines.length * lineHeight + 6;

    // Check if code block fits on current page
    if (context.currentY + totalHeight > context.pageHeight - context.margins.bottom) {
      this.addNewPage(pdf, context, options);
    }

    // Add light background rectangle
    pdf.setFillColor(245, 245, 245);
    pdf.rect(
      context.margins.left - 2,
      context.currentY - 3,
      context.contentWidth + 4,
      totalHeight,
      'F'
    );

    // Render code lines
    for (const line of lines) {
      pdf.text(line, context.margins.left, context.currentY);
      context.currentY += lineHeight;
    }

    context.currentY += 6; // Extra spacing after code
  }

  /**
   * Render list items
   */
  private static async renderList(
    pdf: jsPDF,
    item: ParsedContent,
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    pdf.setFontSize(options.fontSize);
    pdf.setFont('helvetica', 'normal');

    const processedContent = this.processUnicodeText(item.content);
    const lines = processedContent.split('\n');
    const lineHeight = options.fontSize * options.lineHeight;

    for (const line of lines) {
      // Check if line fits on current page
      if (context.currentY + lineHeight > context.pageHeight - context.margins.bottom) {
        this.addNewPage(pdf, context, options);
      }

      // Render list item
      pdf.text(line, context.margins.left + 5, context.currentY);
      context.currentY += lineHeight;
    }

    // Add spacing after list
    context.currentY += lineHeight * 0.1;
  }

  /**
   * Render table content
   */
  private static async renderTable(
    pdf: jsPDF,
    item: ParsedContent,
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    pdf.setFontSize(options.fontSize - 1);
    pdf.setFont('helvetica', 'normal');

    const processedContent = this.processUnicodeText(item.content);
    const lines = processedContent.split('\n');
    const lineHeight = (options.fontSize - 1) * 1.3;

    for (const line of lines) {
      // Check if line fits on current page
      if (context.currentY + lineHeight > context.pageHeight - context.margins.bottom) {
        this.addNewPage(pdf, context, options);
      }

      // Render table row
      pdf.text(line, context.margins.left, context.currentY);
      context.currentY += lineHeight;
    }

    // Add spacing after table
    context.currentY += lineHeight * 0.2;
  }

  /**
   * Render images and diagrams
   */
  private static async renderPlaceholder(
    pdf: jsPDF,
    item: ParsedContent,
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    if ((item.type === 'diagram' || item.type === 'image') && item.imageData) {
      // Render actual image (diagram or regular image)
      await this.renderDiagramImage(pdf, item, context, options);
    } else {
      // Render placeholder text for images or failed diagrams
      pdf.setFontSize(options.fontSize);
      pdf.setFont('helvetica', 'italic');

      const lineHeight = options.fontSize * options.lineHeight;

      // Check if placeholder fits on current page
      if (context.currentY + lineHeight > context.pageHeight - context.margins.bottom) {
        this.addNewPage(pdf, context, options);
      }

      // Render placeholder with Unicode processing
      const processedContent = this.processUnicodeText(item.content);
      pdf.text(processedContent, context.margins.left, context.currentY);
      context.currentY += lineHeight * 1.5;
    }
  }

  /**
   * Render diagram image in PDF
   */
  private static async renderDiagramImage(
    pdf: jsPDF,
    item: ParsedContent,
    context: any,
    options: PDFExportOptions
  ): Promise<void> {

    if (!item.imageData || !item.width || !item.height) return;

    // Calculate image dimensions to fit within page width
    const maxWidth = context.contentWidth;
    const maxHeight = context.contentHeight * 0.6; // Don't take more than 60% of page height

    // Calculate scaling to fit within constraints
    const scaleX = maxWidth / (item.width * 0.264583); // Convert pixels to mm
    const scaleY = maxHeight / (item.height * 0.264583);
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up

    const finalWidth = (item.width * 0.264583) * scale;
    const finalHeight = (item.height * 0.264583) * scale;

    // Check if image fits on current page
    if (context.currentY + finalHeight > context.pageHeight - context.margins.bottom) {
      this.addNewPage(pdf, context, options);
    }

    // Center the image
    const imageX = context.margins.left + (context.contentWidth - finalWidth) / 2;

    // Add the image to PDF
    try {
      pdf.addImage(
        item.imageData,
        'PNG',
        imageX,
        context.currentY,
        finalWidth,
        finalHeight
      );

      context.currentY += finalHeight + (options.fontSize * 0.5); // Add some spacing after image
    } catch (error) {
      console.warn('Failed to add diagram image to PDF:', error);
      // Fallback to text
      pdf.setFontSize(options.fontSize);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`[${item.metadata?.diagramType || 'Diagram'} - failed to embed]`, context.margins.left, context.currentY);
      context.currentY += options.fontSize * options.lineHeight;
    }
  }

  /**
   * Add new page with header/footer
   */
  private static addNewPage(pdf: jsPDF, context: any, options: PDFExportOptions): void {
    // Add footer to current page
    if (options.includeFooter) {
      this.addFooter(pdf, context.currentPage, options, context);
    }

    // Add new page
    pdf.addPage();
    context.currentPage++;
    context.currentY = context.margins.top;

    // Add header to new page
    if (options.includeHeader) {
      // Note: We'd need to pass the file info here in a real implementation
      context.currentY += 15;
    }
  }

  /**
   * Add header to PDF
   */
  private static addHeader(
    pdf: jsPDF,
    file: MarkdownFile,
    options: PDFExportOptions,
    context: any
  ): void {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const processedFileName = this.processUnicodeText(file.name);
    pdf.text(processedFileName, options.margins.left, options.margins.top + 5);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const exportDate = new Date().toLocaleDateString();
    pdf.text(
      `Exported: ${exportDate}`,
      context.pageWidth - options.margins.right,
      options.margins.top + 5,
      { align: 'right' }
    );

    // Add line under header
    pdf.setLineWidth(0.5);
    pdf.line(
      options.margins.left,
      options.margins.top + 8,
      context.pageWidth - options.margins.right,
      options.margins.top + 8
    );
  }

  /**
   * Add footer to PDF
   */
  private static addFooter(
    pdf: jsPDF,
    pageNumber: number,
    options: PDFExportOptions,
    context: any
  ): void {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    // Add line above footer
    pdf.setLineWidth(0.5);
    pdf.line(
      options.margins.left,
      context.pageHeight - options.margins.bottom - 8,
      context.pageWidth - options.margins.right,
      context.pageHeight - options.margins.bottom - 8
    );

    // Page number
    pdf.text(
      `Page ${pageNumber}`,
      context.pageWidth - options.margins.right,
      context.pageHeight - options.margins.bottom - 3,
      { align: 'right' }
    );

    // Generated by MarkDown Buddy
    pdf.text(
      'Generated by MarkDown Buddy',
      options.margins.left,
      context.pageHeight - options.margins.bottom - 3
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
    return typeof window !== 'undefined' && typeof jsPDF !== 'undefined';
  }
}