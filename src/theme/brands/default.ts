import type { BrandConfig } from './types';

/**
 * Default brand — neutral Tailwind-based palette.
 */
const config: BrandConfig = {
  id: 'default',
  productName: 'MarkDown Buddy',
  fontFamily: '"Roboto", "Helvetica Neue", "Helvetica", "Arial", sans-serif',

  palette: {
    BLACK: '#000000',
    WHITE: '#ffffff',
    YELLOW:    { 800: '#92400e', 700: '#b45309', 600: '#d97706', 500: '#f59e0b', 400: '#fbbf24', 300: '#fcd34d', 200: '#fde68a', 100: '#fef3c7' },
    ORANGE:    { 800: '#9a3412', 700: '#c2410c', 600: '#ea580c', 500: '#f97316', 400: '#fb923c', 300: '#fdba74', 200: '#fed7aa', 100: '#ffedd5' },
    RED:       { 800: '#991b1b', 700: '#b91c1c', 600: '#dc2626', 500: '#ef4444', 400: '#f87171', 300: '#fca5a5', 200: '#fecaca', 100: '#fee2e2' },
    BLUE:      { 800: '#1e3a8a', 700: '#1e40af', 600: '#1d4ed8', 500: '#2563eb', 400: '#3b82f6', 300: '#93c5fd', 200: '#bfdbfe', 100: '#dbeafe' },
    CYAN:      { 800: '#075985', 700: '#0369a1', 600: '#0284c7', 500: '#0ea5e9', 400: '#38bdf8', 300: '#7dd3fc', 200: '#bae6fd', 100: '#e0f2fe' },
    GREEN:     { 800: '#166534', 700: '#15803d', 600: '#16a34a', 500: '#22c55e', 400: '#4ade80', 300: '#86efac', 200: '#bbf7d0', 100: '#dcfce7' },
    COOL_GRAY: { 800: '#111827', 700: '#1f2937', 600: '#374151', 500: '#6b7280', 400: '#9ca3af', 300: '#d1d5db', 200: '#e5e7eb', 100: '#f3f4f6' },
    WARM_GRAY: { 800: '#292524', 700: '#44403c', 600: '#57534e', 500: '#78716c', 400: '#a8a29e', 300: '#d6d3d1', 200: '#e7e5e4', 100: '#f5f5f4' },
  },

  brandTokens: {
    accent: '#0284C7',
    accentHover: '#0369A1',
    danger: '#EF4444',
    dangerHover: '#DC2626',
    markerBg: '#FFE14D',
    markerFg: '#111827',
  },

  surfaceLight: {
    chrome: '#ffffff', canvas: '#f3f4f6', paper: '#ffffff', field: '#ffffff',
    border: '#e5e7eb', border2: '#d1d5db', hover: '#f3f4f6',
    fg1: '#111827', fg2: '#6b7280', fg3: '#9ca3af', body: '#1f2937',
    code: '#f3f4f6', pre: '#f3f4f6',
    selBg: '#e0f2fe', selFg: '#075985', folder: '#9ca3af', file: '#d1d5db',
  },
  surfaceDark: {
    chrome: '#111827', canvas: '#0a0d13', paper: '#111827', field: '#1b212b',
    border: '#1f2937', border2: '#374151', hover: '#1b212b',
    fg1: '#ffffff', fg2: '#d1d5db', fg3: '#9ca3af', body: '#e5e7eb',
    code: '#1f2937', pre: '#1b212b',
    selBg: '#00303f', selFg: '#7dd3fc', folder: '#9ca3af', file: '#6b7280',
  },

  stageLight: {
    stage: '#ffffff', line: '#e5e7eb', dim: '#6b7280', title: '#111827',
    body: '#1f2937', pre: '#f3f4f6', hover: '#f3f4f6', activeBg: 'rgba(0,135,185,.05)',
  },
  stageDark: {
    stage: '#0a0d13', line: '#1f2937', dim: '#9ca3af', title: '#ffffff',
    body: '#e5e7eb', pre: '#1b212b', hover: '#111827', activeBg: 'rgba(0,135,185,.10)',
  },

  surroundLight: { surround: '#f3f4f6' },
  surroundDark:  { surround: '#000000' },

  greyLight: { 50: '#f3f4f6', 100: '#e5e7eb', 200: '#d1d5db', 300: '#9ca3af', 400: '#6b7280', 500: '#374151' },
  greyDark:  { 50: '#f3f4f6', 100: '#e5e7eb', 200: '#d1d5db', 300: '#9ca3af', 400: '#6b7280', 500: '#374151', 600: '#1f2937', 700: '#111827', 800: '#0a0b0f', 900: '#050506' },
};

export default config;
