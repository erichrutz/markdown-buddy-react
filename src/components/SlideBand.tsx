import React from 'react';
import { Box } from '@mui/material';
import { StageTokens } from '../theme/designTokens';
import { BandElement, BandTemplate, TokenContext } from '../types/presentation';
import { interpolate } from '../utils/presentationTokens';

interface SlideBandProps {
  template: BandTemplate;
  ctx: TokenContext;
  pc: StageTokens;
}

const variantSx = (variant: string | undefined, pc: StageTokens) => {
  switch (variant) {
    case 'title':
      return {
        fontSize: 'clamp(28px, 4.4vh, 44px)',
        fontWeight: 700,
        lineHeight: 1.2,
        letterSpacing: '-0.02em',
        color: pc.title,
      };
    case 'meta':
      return {
        fontSize: 'clamp(12px, 1.6vh, 16px)',
        fontWeight: 600,
        fontVariantNumeric: 'tabular-nums' as const,
        color: pc.dim,
      };
    case 'normal':
    default:
      return {
        fontSize: 'clamp(14px, 2vh, 20px)',
        color: pc.body,
      };
  }
};

const renderElement = (
  el: BandElement,
  i: number,
  ctx: TokenContext,
  pc: StageTokens,
) => {
  if (el.type === 'icon') {
    return (
      <Box
        key={i}
        component="img"
        src={`/presentation/${el.src}`}
        alt=""
        sx={{ height: el.height ?? 20, width: 'auto', display: 'block' }}
      />
    );
  }
  // text
  const isTitle = el.variant === 'title';
  return (
    <Box
      key={i}
      component="span"
      sx={{
        ...variantSx(el.variant, pc),
        minWidth: 0,
        // Titles may wrap across up to 2 lines (like the old layout) instead
        // of clipping. Meta/normal stay single-line with ellipsis.
        ...(isTitle
          ? {
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }
          : {
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }),
      }}
    >
      {interpolate(el.value, ctx)}
    </Box>
  );
};

const Slot: React.FC<{
  elements: BandElement[] | undefined;
  ctx: TokenContext;
  pc: StageTokens;
  justify: 'flex-start' | 'center' | 'flex-end';
}> = ({ elements, ctx, pc, justify }) => {
  const els = elements ?? [];
  const hasContent = els.length > 0;
  // A slot grows to fill the band only if it carries a title; meta/number and
  // icon slots hug their content so the title gets the remaining width.
  const grows = els.some((e) => e.type === 'text' && e.variant === 'title');
  return (
    <Box
      sx={{
        flex: grows ? '1 1 0' : '0 0 auto',
        minWidth: 0,
        display: hasContent ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: justify,
        gap: '10px',
        textAlign:
          justify === 'center' ? 'center' : justify === 'flex-end' ? 'right' : 'left',
      }}
    >
      {els.map((el, i) => renderElement(el, i, ctx, pc))}
    </Box>
  );
};

/**
 * Renders a header/footer band with left/center/right slots.
 * Fonts are fixed (clamp-based) and intentionally NOT part of the content
 * auto-fit so they never trigger a measure→resize loop (spec §5.4).
 */
export const SlideBand: React.FC<SlideBandProps> = ({ template, ctx, pc }) => {
  return (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        width: '100%',
      }}
    >
      <Slot elements={template.left} ctx={ctx} pc={pc} justify="flex-start" />
      <Slot elements={template.center} ctx={ctx} pc={pc} justify="center" />
      <Slot elements={template.right} ctx={ctx} pc={pc} justify="flex-end" />
    </Box>
  );
};
