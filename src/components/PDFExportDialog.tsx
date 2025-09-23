import React, { useState } from 'react';
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
  LinearProgress,
  Alert
} from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PDFExportOptions, DEFAULT_PDF_OPTIONS } from '../services/pdfExportService';

interface PDFExportDialogProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: PDFExportOptions & { useTextBasedExport?: boolean }) => Promise<void>;
  defaultFilename: string;
}

export const PDFExportDialog: React.FC<PDFExportDialogProps> = ({
  open,
  onClose,
  onExport,
  defaultFilename
}) => {
  const { t } = useTranslation();
  const [options, setOptions] = useState<PDFExportOptions & { useTextBasedExport?: boolean }>({
    ...DEFAULT_PDF_OPTIONS,
    filename: defaultFilename,
    useTextBasedExport: true // Default to the new improved method
  });
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    
    try {
      await onExport(options);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('export.unknownError'));
    } finally {
      setIsExporting(false);
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
            <Typography variant="body2" gutterBottom>
              {t('export.generating')}
            </Typography>
            <LinearProgress />
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