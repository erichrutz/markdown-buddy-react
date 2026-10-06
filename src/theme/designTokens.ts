/**
 * Design Tokens for MarkDown Buddy -- "Klare Werkbank"
 *
 * Surface and stage tokens are brand-aware (see brand.ts).
 * This file re-exports them and keeps layout constants.
 */

import { BRAND_TOKENS } from './brand';

export const BRAND = {
  DANGER: BRAND_TOKENS.danger,
  DANGER_HOVER: BRAND_TOKENS.dangerHover,
  ACCENT: BRAND_TOKENS.accent,
  ACCENT_HOVER: BRAND_TOKENS.accentHover,
  MARKER_BG: BRAND_TOKENS.markerBg,
  MARKER_FG: BRAND_TOKENS.markerFg,
} as const;

// Document reading-width control (standard + presentation mode)
export const DOC_WIDTH_MIN = 640;
export const DOC_WIDTH_MAX = 1600;
export const DOC_WIDTH_STEP = 20;
export const DOC_WIDTH_DEFAULT = 900;

// Re-export types from the shared brand types module
export type { SurfaceTokens, StageTokens, SurroundTokens } from './brands/types';

// Re-export brand-aware token sets
export {
  SURFACE_LIGHT,
  SURFACE_DARK,
  STAGE_LIGHT,
  STAGE_DARK,
  SURROUND_LIGHT,
  SURROUND_DARK,
  FONT_FAMILY,
  PRODUCT_NAME,
  isDBBrand,
} from './brand';

import {
  SURFACE_LIGHT,
  SURFACE_DARK,
  STAGE_LIGHT,
  STAGE_DARK,
  SURROUND_LIGHT,
  SURROUND_DARK,
} from './brand';

import type { SurfaceTokens, StageTokens, SurroundTokens } from './brands/types';

export const getSurfaceTokens = (mode: 'light' | 'dark'): SurfaceTokens =>
  mode === 'dark' ? SURFACE_DARK : SURFACE_LIGHT;

export const getStageTokens = (mode: 'light' | 'dark'): StageTokens =>
  mode === 'dark' ? STAGE_DARK : STAGE_LIGHT;

export const getSurroundTokens = (mode: 'light' | 'dark'): SurroundTokens =>
  mode === 'dark' ? SURROUND_DARK : SURROUND_LIGHT;

/** Fixed dimensions from the design spec */
export const DIMENSIONS = {
  HEADER_HEIGHT: 56,
  FILE_TREE_WIDTH: 288,
  OUTLINE_WIDTH: 236,
  PRES_OUTLINE_WIDTH: 264,
  PRES_HEADER_HEIGHT: 52,
  PRES_FOOTER_HEIGHT: 38,
  TREE_ROW_HEIGHT: 30,
} as const;
