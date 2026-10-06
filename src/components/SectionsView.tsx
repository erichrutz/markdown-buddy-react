import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import { PlayArrow } from '@mui/icons-material';
import { SurfaceTokens, BRAND } from '../theme/designTokens';
import { Section, formatSectionSummary } from '../utils/sectionParser';

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
  const included = sections.length - skipped.length;

  return (
    <Box sx={{ flex: 1, overflow: 'auto', padding: '32px 40px 56px', background: tokens.paper }}>
      <Box sx={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header: title + description left, present button right */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', mb: '26px' }}>
          <Box>
            <Box sx={{ mb: '8px', fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {t('sections.title')}
            </Box>
            <Box sx={{ fontSize: 13, lineHeight: 1.6, color: tokens.fg2, maxWidth: '62ch' }}>
              {t('sections.intro')}
            </Box>
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => onPresentFrom(0)}
            sx={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: '8px',
              height: 36, px: '16px', border: 0,
              background: BRAND.ACCENT, color: '#fff',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
              whiteSpace: 'nowrap',
              '&:hover': { background: BRAND.ACCENT_HOVER },
            }}
          >
            <PlayArrow sx={{ fontSize: 18 }} />
            {t('toolbar.present')} {t('toolbar.sectionsOf', { included, total: sections.length })}
          </Box>
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
                opacity: isSkipped ? 0.5 : 1,
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
                    textDecoration: isSkipped ? 'line-through' : 'none',
                  }}
                >
                  {section.title}
                </Box>
                <Box sx={{ fontSize: 12, lineHeight: 1.55, color: tokens.fg3 }}>
                  {isSkipped ? t('sections.skipped') : formatSectionSummary(section.summary, t)}
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
                  '&:hover': { background: tokens.hover },
                }}
              >
                {isSkipped ? t('sections.show') : t('sections.skip')}
              </Box>

              {/* Present from here */}
              {!isSkipped && (
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
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
