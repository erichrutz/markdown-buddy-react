import { useCallback, useState } from 'react';
import { PDFExportService, PDFExportOptions } from '../services/pdfExportService';
import { PDFExportServiceV2 } from '../services/pdfExportServiceV2';
import { MarkdownFile } from '../types';

export const usePDFExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToPDF = useCallback(async (
    contentElement: HTMLElement,
    file: MarkdownFile,
    options: PDFExportOptions & { useTextBasedExport?: boolean }
  ): Promise<void> => {
    const service = options.useTextBasedExport ? PDFExportServiceV2 : PDFExportService;

    if (!service.isSupported()) {
      throw new Error('PDF export is not supported in this browser');
    }

    setIsExporting(true);
    setError(null);

    try {
      await service.exportToPDF(contentElement, file, options);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during PDF export';
      setError(errorMessage);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateDefaultFilename = useCallback((file: MarkdownFile): string => {
    const baseName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${baseName}_${timestamp}.pdf`;
  }, []);

  return {
    isExporting,
    error,
    exportToPDF,
    clearError,
    generateDefaultFilename,
    isSupported: PDFExportService.isSupported()
  };
};