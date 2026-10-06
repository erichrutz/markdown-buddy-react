import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert
} from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PDFExportOptions, DEFAULT_PDF_OPTIONS } from '../services/pdfExportService';
import { ProgressSteps } from './LoadingIndicator';

interface PDFExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: PDFExportOptions & { useTextBasedExport?: boolean }) => Promise<void>;
  defaultFilename: string;
  defaultFormat?: 'A4' | 'Letter' | 'Legal';
  defaultOrientation?: 'portrait' | 'landscape';
}

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  open,
  onClose,
  onExport,
  defaultFilename,
  defaultFormat,
  defaultOrientation
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<PDFExportOptions & { useTextBasedExport?: boolean }>({
    ...DEFAULT_PDF_OPTIONS,
    ...(defaultFormat && { format: defaultFormat }),
    ...(defaultOrientation && { orientation: defaultOrientation }),
    filename: defaultFilename,
    useTextBasedExport: true // Default to the new improved method
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Update filename when defaultFilename prop changes
  useEffect(() => {
    setOptions(prevOptions => ({
      ...prevOptions,
      filename: defaultFilename
    }));
  }, [defaultFilename]);

  const exportSteps = [
    t('export.step.preparing', { defaultValue: 'Preparing content...' }),
    t('export.step.processing', { defaultValue: 'Processing markdown...' }),
    t('export.step.generating', { defaultValue: 'Generating PDF...' }),
    t('export.step.downloading', { defaultValue: 'Downloading file...' })
  ];

  const handleExport = async () => {
    setIsExporting(true);
    setExportStep(0);
    setError(null);
    
    try {
      // Simulate step progress for better UX
      setExportStep(0);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setExportStep(1);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setExportStep(2);
      await onExport(options);
      
      setExportStep(3);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('export.unknownError'));
    } finally {
      setIsExporting(false);
      setExportStep(0);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
    }
  };

  const updateOptions = (updates: Partial<PDFExportOptions & { useTextBasedExport?: boolean }>) => {
    setOptions(prev => ({ ...prev, ...updates }));
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PictureAsPdf color="primary" />
          <Typography variant="h6" component="div">
            {t('export.title')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('export.subtitle')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {isExporting && (
          <Box sx={{ mb: 2 }}>
            <ProgressSteps
              steps={exportSteps}
              currentStep={exportStep}
              completedSteps={Array.from({ length: exportStep }, (_, i) => i)}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Filename */}
          <TextField
            label={t('export.filename')}
            value={options.filename || ''}
            onChange={(e) => updateOptions({ filename: e.target.value })}
            fullWidth
            disabled={isExporting}
            placeholder="document.pdf"
          />

          {/* Format and Orientation */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth disabled={isExporting}>
              <InputLabel>{t('export.format')}</InputLabel>
              <Select
                value={options.format}
                onChange={(e) => updateOptions({ format: e.target.value as 'A4' | 'Letter' | 'Legal' })}
                label={t('export.format')}
              >
                <MenuItem value="A4">A4 (210 × 297 mm)</MenuItem>
                <MenuItem value="Letter">Letter (8.5 × 11 in)</MenuItem>
                <MenuItem value="Legal">Legal (8.5 × 14 in)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={isExporting}>
              <InputLabel>{t('export.orientation')}</InputLabel>
              <Select
                value={options.orientation}
                onChange={(e) => updateOptions({ orientation: e.target.value as 'portrait' | 'landscape' })}
                label={t('export.orientation')}
              >
                <MenuItem value="portrait">{t('export.portrait')}</MenuItem>
                <MenuItem value="landscape">{t('export.landscape')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Export Method */}
          <FormControl fullWidth disabled={isExporting}>
            <InputLabel>Export Method</InputLabel>
            <Select
              value={options.useTextBasedExport ? 'text' : 'image'}
              onChange={(e) => updateOptions({ useTextBasedExport: e.target.value === 'text' })}
              label="Export Method"
            >
              <MenuItem value="text">
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Text-based (Recommended)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Proper page breaks, selectable text, smaller file size
                  </Typography>
                </Box>
              </MenuItem>
              <MenuItem value="image">
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    Image-based (Legacy)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Exact visual appearance, includes diagrams, larger file
                  </Typography>
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          {/* Margins */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('export.margins')} (mm)
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                label={t('export.marginTop')}
                type="number"
                value={options.margins.top}
                onChange={(e) => updateOptions({
                  margins: { ...options.margins, top: Number(e.target.value) }
                })}
                disabled={isExporting}
                inputProps={{ min: 0, max: 50 }}
              />
              <TextField
                label={t('export.marginRight')}
                type="number"
                value={options.margins.right}
                onChange={(e) => updateOptions({
                  margins: { ...options.margins, right: Number(e.target.value) }
                })}
                disabled={isExporting}
                inputProps={{ min: 0, max: 50 }}
              />
              <TextField
                label={t('export.marginBottom')}
                type="number"
                value={options.margins.bottom}
                onChange={(e) => updateOptions({
                  margins: { ...options.margins, bottom: Number(e.target.value) }
                })}
                disabled={isExporting}
                inputProps={{ min: 0, max: 50 }}
              />
              <TextField
                label={t('export.marginLeft')}
                type="number"
                value={options.margins.left}
                onChange={(e) => updateOptions({
                  margins: { ...options.margins, left: Number(e.target.value) }
                })}
                disabled={isExporting}
                inputProps={{ min: 0, max: 50 }}
              />
            </Box>
          </Box>

          {/* Options */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('export.options')}
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={options.includeHeader}
                  onChange={(e) => updateOptions({ includeHeader: e.target.checked })}
                  disabled={isExporting}
                />
              }
              label={t('export.includeHeader')}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={options.includeFooter}
                  onChange={(e) => updateOptions({ includeFooter: e.target.checked })}
                  disabled={isExporting}
                />
              }
              label={t('export.includeFooter')}
            />
          </Box>

          {/* Image Quality Settings */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('export.imageSettings', { defaultValue: 'Image Settings' })}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl fullWidth disabled={isExporting}>
                <InputLabel>{t('export.imageFormat', { defaultValue: 'Image Format' })}</InputLabel>
                <Select
                  value={options.imageFormat || 'jpeg'}
                  onChange={(e) => updateOptions({ imageFormat: e.target.value as 'png' | 'jpeg' })}
                  label={t('export.imageFormat', { defaultValue: 'Image Format' })}
                >
                  <MenuItem value="jpeg">JPEG (Smaller file size)</MenuItem>
                  <MenuItem value="png">PNG (Better quality, larger size)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {(options.imageFormat === 'jpeg' || !options.imageFormat) && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('export.imageQuality', { defaultValue: 'Image Quality' })}: {Math.round((options.imageQuality || 0.7) * 100)}%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('export.smallerSize', { defaultValue: 'Smaller' })}
                  </Typography>
                  <TextField
                    type="range"
                    value={Math.round((options.imageQuality || 0.7) * 100)}
                    onChange={(e) => updateOptions({ imageQuality: Number(e.target.value) / 100 })}
                    disabled={isExporting}
                    inputProps={{
                      min: 10,
                      max: 100,
                      step: 10
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {t('export.betterQuality', { defaultValue: 'Better Quality' })}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {t('export.imageQualityHelp', { 
                    defaultValue: 'Lower quality reduces file size. 70% is recommended for most documents.' 
                  })}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Info */}
          <Alert severity="info">
            {t('export.info')}
          </Alert>
          
          {!options.includeHeader && !options.includeFooter && (
            <Alert severity="warning">
              {t('export.noHeaderFooterWarning')}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isExporting}>
          {t('ui.cancel')}
        </Button>
        <Button
          onClick={handleExport}
          variant="contained"
          disabled={isExporting || !options.filename}
          startIcon={<PictureAsPdf />}
        >
          {isExporting ? t('export.generating') : t('export.export')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};