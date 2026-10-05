/**
 * Color Palette
 * Neutral color scale (Tailwind CSS palette, MIT)
 */

// Primary Brand Colors
export const PALETTE = {
  // Brand accent red
  DANGER: '#ef4444',
  
  // Black and White
  BLACK: '#000000',
  WHITE: '#ffffff',
  
  // Yellow Palette
  YELLOW: {
    800: '#92400e',
    700: '#b45309',
    600: '#d97706',
    500: '#f59e0b',
    400: '#fbbf24',
    300: '#fcd34d',
    200: '#fde68a',
    100: '#fef3c7',
  },
  
  // Orange Palette
  ORANGE: {
    800: '#9a3412',
    700: '#c2410c',
    600: '#ea580c',
    500: '#f97316',
    400: '#fb923c',
    300: '#fdba74',
    200: '#fed7aa',
    100: '#ffedd5',
  },
  
  // Red Palette
  RED: {
    800: '#991b1b',
    700: '#b91c1c',
    600: '#dc2626',
    500: '#ef4444',
    400: '#f87171',
    300: '#fca5a5',
    200: '#fecaca',
    100: '#fee2e2',
  },
  
  // Blue Palette
  BLUE: {
    800: '#1e3a8a',
    700: '#1e40af',
    600: '#1d4ed8',
    500: '#2563eb',
    400: '#3b82f6',
    300: '#93c5fd',
    200: '#bfdbfe',
    100: '#dbeafe',
  },
  
  // Cyan Palette
  CYAN: {
    800: '#075985',
    700: '#0369a1',
    600: '#0284c7',
    500: '#0ea5e9',
    400: '#38bdf8',
    300: '#7dd3fc',
    200: '#bae6fd',
    100: '#e0f2fe',
  },
  
  // Green Palette
  GREEN: {
    800: '#166534',
    700: '#15803d',
    600: '#16a34a',
    500: '#22c55e',
    400: '#4ade80',
    300: '#86efac',
    200: '#bbf7d0',
    100: '#dcfce7',
  },
  
  // Cool Gray Palette
  COOL_GRAY: {
    800: '#111827',
    700: '#1f2937',
    600: '#374151',
    500: '#6b7280',
    400: '#9ca3af',
    300: '#d1d5db',
    200: '#e5e7eb',
    100: '#f3f4f6',
  },
  
  // Warm Gray Palette
  WARM_GRAY: {
    800: '#292524',
    700: '#44403c',
    600: '#57534e',
    500: '#78716c',
    400: '#a8a29e',
    300: '#d6d3d1',
    200: '#e7e5e4',
    100: '#f5f5f4',
  },
};

// Semantic Color Mapping for UI Components
export const SEMANTIC_COLORS = {
  // Primary theme colors - using darker variants for better contrast
  PRIMARY: PALETTE.BLUE[600],      // Changed from 500 to 600 for better contrast
  PRIMARY_LIGHT: PALETTE.BLUE[400],
  PRIMARY_DARK: PALETTE.BLUE[700],  // Changed from 600 to 700
  
  // Secondary/accent colors - using darker variants for better contrast  
  SECONDARY: PALETTE.RED[600],       // Using 600 instead of 500 for better contrast
  SECONDARY_LIGHT: PALETTE.RED[400],
  SECONDARY_DARK: PALETTE.RED[700],  // Changed from 600 to 700
  
  // Background colors - Light theme
  BACKGROUND_LIGHT: PALETTE.WHITE,
  BACKGROUND_LIGHT_PAPER: PALETTE.WARM_GRAY[100],
  BACKGROUND_LIGHT_SIDEBAR: PALETTE.COOL_GRAY[100],
  
  // Background colors - Dark theme
  BACKGROUND_DARK: PALETTE.COOL_GRAY[800],
  BACKGROUND_DARK_PAPER: PALETTE.COOL_GRAY[700],
  BACKGROUND_DARK_SIDEBAR: PALETTE.COOL_GRAY[700],
  
  // Text colors - Light theme
  TEXT_PRIMARY_LIGHT: PALETTE.COOL_GRAY[800],
  TEXT_SECONDARY_LIGHT: PALETTE.COOL_GRAY[600],
  TEXT_DISABLED_LIGHT: PALETTE.COOL_GRAY[400],
  
  // Text colors - Dark theme
  TEXT_PRIMARY_DARK: PALETTE.WHITE,
  TEXT_SECONDARY_DARK: PALETTE.COOL_GRAY[300],
  TEXT_DISABLED_DARK: PALETTE.COOL_GRAY[500],
  
  // Links and interactive elements
  LINK_COLOR_LIGHT: PALETTE.CYAN[700],  // Changed from 600 to 700 for better contrast
  LINK_COLOR_DARK: PALETTE.CYAN[400],
  LINK_HOVER_LIGHT: PALETTE.CYAN[800],  // Changed from 700 to 800 for better contrast
  LINK_HOVER_DARK: PALETTE.CYAN[300],
  
  // Status colors
  SUCCESS: PALETTE.GREEN[500],
  WARNING: PALETTE.YELLOW[600],
  ERROR: PALETTE.RED[500],
  INFO: PALETTE.CYAN[500],
  
  // Status colors for dark mode - better contrast
  SUCCESS_DARK: PALETTE.GREEN[400],
  WARNING_DARK: PALETTE.YELLOW[400],
  ERROR_DARK: PALETTE.RED[400],
  INFO_DARK: PALETTE.CYAN[300],  // Much lighter for better contrast on dark backgrounds
  
  // Primary colors for dark mode - better contrast
  PRIMARY_DARK_MODE: PALETTE.BLUE[300],      // #4a9aef - much lighter blue for dark mode
  PRIMARY_LIGHT_DARK_MODE: PALETTE.BLUE[200], // #7db5f5 - even lighter
  PRIMARY_DARK_DARK_MODE: PALETTE.BLUE[400],   // #1e7dcf - medium blue
  
  // Border colors
  BORDER_LIGHT: PALETTE.COOL_GRAY[200],
  BORDER_DARK: PALETTE.COOL_GRAY[600],
  DIVIDER_LIGHT: PALETTE.COOL_GRAY[200],
  DIVIDER_DARK: PALETTE.COOL_GRAY[600],
  
  // Code and syntax highlighting
  CODE_BACKGROUND_LIGHT: PALETTE.COOL_GRAY[100],
  CODE_BACKGROUND_DARK: PALETTE.COOL_GRAY[700],
  CODE_TEXT_LIGHT: PALETTE.COOL_GRAY[800],
  CODE_TEXT_DARK: PALETTE.COOL_GRAY[200],
};

// Export individual color families for specific use cases
export const {
  YELLOW,
  ORANGE,
  RED,
  BLUE,
  CYAN,
  GREEN,
  COOL_GRAY,
  WARM_GRAY,
} = PALETTE;

export default PALETTE;