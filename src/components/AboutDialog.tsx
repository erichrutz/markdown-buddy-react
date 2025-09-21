import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Link
} from '@mui/material';
import { useTranslation } from 'react-i18next';

interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AboutDialog: React.FC<AboutDialogProps> = ({ open, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('about.title')}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Markdown Buddy React
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('about.version')}: 0.0.0
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('about.author')}: Erich Rutz
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
            {t('about.year')}: 2025
          </Typography>
          <Typography variant="body1" paragraph>
            {t('about.description')}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('about.license.title')}
          </Typography>
          <Typography variant="body2" paragraph>
            {t('about.license.description')}
          </Typography>
          <Box sx={{ 
            bgcolor: 'background.paper', 
            border: 1,
            borderColor: 'divider',
            p: 2, 
            borderRadius: 1,
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            mb: 2
          }}>
            <Typography 
              component="pre" 
              sx={{ 
                whiteSpace: 'pre-wrap', 
                margin: 0,
                color: 'text.primary'
              }}
            >
{`MIT License

Copyright (c) 2025 Erich Rutz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('about.dependencies.title')}
          </Typography>
          <Typography variant="body2" paragraph>
            {t('about.dependencies.description')}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {[
              { name: 'React', url: 'https://reactjs.org/' },
              { name: 'Material-UI', url: 'https://mui.com/' },
              { name: 'Marked', url: 'https://marked.js.org/' },
              { name: 'Mermaid', url: 'https://mermaid.js.org/' },
              { name: 'PlantUML', url: 'https://plantuml.com/' },
              { name: 'Highlight.js', url: 'https://highlightjs.org/' }
            ].map((dep) => (
              <Link
                key={dep.name}
                href={dep.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {dep.name}
              </Link>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t('ui.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};