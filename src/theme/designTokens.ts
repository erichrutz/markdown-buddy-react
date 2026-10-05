/**
 * Design Tokens for MarkDown Buddy Redesign A – "Klare Werkbank"
 */

export const BRAND = {
  DANGER: '#EF4444',
  DANGER_HOVER: '#DC2626',
  ACCENT: '#0284C7',
  ACCENT_HOVER: '#0369A1',
  MARKER_BG: '#FFE14D',
  MARKER_FG: '#111827',
} as const;

// Document reading-width control (standard + presentation mode)
export const DOC_WIDTH_MIN = 640;
export const DOC_WIDTH_MAX = 1600;
export const DOC_WIDTH_STEP = 20;
export const DOC_WIDTH_DEFAULT = 900;

export interface SurfaceTokens {
  chrome: string;
  canvas: string;
  paper: string;
  field: string;
  border: string;
  border2: string;
  hover: string;
  fg1: string;
  fg2: string;
  fg3: string;
  body: string;
  code: string;
  pre: string;
  selBg: string;
  selFg: string;
  folder: string;
  file: string;
}

export const SURFACE_LIGHT: SurfaceTokens = {
  chrome: '#ffffff',
  canvas: '#f3f4f6',
  paper: '#ffffff',
  field: '#ffffff',
  border: '#e5e7eb',
  border2: '#d1d5db',
  hover: '#f3f4f6',
  fg1: '#111827',
  fg2: '#6b7280',
  fg3: '#9ca3af',
  body: '#1f2937',
  code: '#f3f4f6',
  pre: '#f3f4f6',
  selBg: '#e0f2fe',
  selFg: '#075985',
  folder: '#9ca3af',
  file: '#d1d5db',
};

export const SURFACE_DARK: SurfaceTokens = {
  chrome: '#111827',
  canvas: '#0a0d13',
  paper: '#111827',
  field: '#1b212b',
  border: '#1f2937',
  border2: '#374151',
  hover: '#1b212b',
  fg1: '#ffffff',
  fg2: '#d1d5db',
  fg3: '#9ca3af',
  body: '#e5e7eb',
  code: '#1f2937',
  pre: '#1b212b',
  selBg: '#00303f',
  selFg: '#7dd3fc',
  folder: '#9ca3af',
  file: '#6b7280',
};

export interface StageTokens {
  stage: string;
  line: string;
  dim: string;
  title: string;
  body: string;
  pre: string;
  hover: string;
  activeBg: string;
}

export const STAGE_LIGHT: StageTokens = {
  stage: '#ffffff',
  line: '#e5e7eb',
  dim: '#6b7280',
  title: '#111827',
  body: '#1f2937',
  pre: '#f3f4f6',
  hover: '#f3f4f6',
  activeBg: 'rgba(0,135,185,.05)',
};

export const STAGE_DARK: StageTokens = {
  stage: '#0a0d13',
  line: '#1f2937',
  dim: '#9ca3af',
  title: '#ffffff',
  body: '#e5e7eb',
  pre: '#1b212b',
  hover: '#111827',
  activeBg: 'rgba(0,135,185,.10)',
};

/** Surround area behind the slide card */
export interface SurroundTokens {
  surround: string;
}
export const SURROUND_LIGHT: SurroundTokens = { surround: '#f3f4f6' };
export const SURROUND_DARK: SurroundTokens = { surround: '#000000' };

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

export const getSurfaceTokens = (mode: 'light' | 'dark'): SurfaceTokens =>
  mode === 'dark' ? SURFACE_DARK : SURFACE_LIGHT;

export const getStageTokens = (mode: 'light' | 'dark'): StageTokens =>
  mode === 'dark' ? STAGE_DARK : STAGE_LIGHT;
