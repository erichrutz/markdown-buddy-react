import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { SurfaceTokens, BRAND } from '../theme/designTokens';
import { Section } from '../utils/sectionParser';

interface SectionsViewProps {
  tokens: SurfaceTokens;
  sections: Section[];
  skipped: number[];
  onToggleSkip: (index: number) => void;
  onPresentFrom: (index: number) => void;
}

export const SectionsView: React.FC<SectionsViewProps> = ({
  tokens,
  sections,
  skipped,
  onToggleSkip,
  onPresentFrom,
}) => {
  const { t } = useTranslation();
  return (
    <Box sx={{ flex: 1, overflow: 'auto', padding: '32px 40px 56px', background: tokens.paper }}>
      <Box sx={{ maxWidth: 760, margin: '0 auto' }}>
        <Box sx={{ mb: '8px', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {t('sections.title')}
        </Box>
        <Box
          sx={{
            mb: '26px',
            fontSize: 13,
            lineHeight: 1.6,
            color: tokens.fg2,
            maxWidth: '62ch',
          }}
        >
          {t('sections.intro')}
        </Box>

        {sections.map((section, i) => {
          const isSkipped = skipped.includes(i);
          return (
            <Box
              key={section.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '16px',
                padding: '14px 16px',
                mb: '8px',
                border: `1px solid ${tokens.border}`,
                background: isSkipped ? 'transparent' : tokens.paper,
              }}
            >
              {/* Number */}
              <Box
                sx={{
                  flexShrink: 0,
                  width: 26,
                  fontSize: 12,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: isSkipped ? tokens.fg3 : BRAND.ACCENT,
                  pt: '2px',
                }}
              >
                {String(i + 1).padStart(2, '0')}
              </Box>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.35,
                    mb: '4px',
                    color: isSkipped ? tokens.fg3 : tokens.fg1,
                  }}
                >
                  {section.title}
                </Box>
                <Box sx={{ fontSize: 12, lineHeight: 1.55, color: tokens.fg3 }}>
                  {isSkipped ? t('sections.skipped') : section.meta}
                </Box>
              </Box>

              {/* Skip/Include toggle */}
              <Box
                component="button"
                type="button"
                onClick={() => onToggleSkip(i)}
                sx={{
                  flexShrink: 0,
                  height: 26,
                  px: '11px',
                  border: `1px solid ${tokens.border}`,
                  background: 'transparent',
                  font: "600 11px 'Noto Sans', Arial, sans-serif",
                  cursor: 'pointer',
                  color: isSkipped ? BRAND.ACCENT : tokens.fg2,
                }}
              >
                {isSkipped ? t('sections.show') : t('sections.skip')}
              </Box>

              {/* Present from here */}
              <Box
                component="button"
                type="button"
                onClick={() => onPresentFrom(i)}
                title={t('sections.presentFromHere')}
                sx={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  border: `1px solid ${tokens.border}`,
                  background: 'transparent',
                  cursor: 'pointer',
                  color: tokens.fg2,
                  '&:hover': { borderColor: BRAND.ACCENT, color: BRAND.ACCENT },
                }}
              >
                <PlayArrow sx={{ fontSize: 15 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
