/**
 * Build-time brand configuration loader.
 *
 * Set VITE_BRAND to the name of a brand module in src/theme/brands/ (without
 * extension). Falls back to "default" when the variable is unset or the
 * requested module does not exist.
 *
 * Brand modules are discovered at build time via import.meta.glob, so only
 * modules that actually exist on disk are bundled.
 */

import type { BrandConfig } from './brands/types';
import defaultConfig from './brands/default';

// Eagerly import every brand module that exists at build time.
const brandModules = import.meta.glob<{ default: BrandConfig }>(
  './brands/!(types).ts',
  { eager: true },
);

const brandId = (import.meta.env.VITE_BRAND as string | undefined) ?? 'default';
const brandKey = `./brands/${brandId}.ts`;
const config: BrandConfig = brandModules[brandKey]?.default ?? defaultConfig;

// ---------------------------------------------------------------------------
// Re-exports  (consumed by palette.ts, designTokens.ts, theme.ts, etc.)
// ---------------------------------------------------------------------------

export const isDBBrand = config.id === 'db';

export const PALETTE = config.palette;
export const FONT_FAMILY = config.fontFamily;
export const PRODUCT_NAME = config.productName;
export const BRAND_TOKENS = config.brandTokens;

export const SURFACE_LIGHT = config.surfaceLight;
export const SURFACE_DARK = config.surfaceDark;
export const STAGE_LIGHT = config.stageLight;
export const STAGE_DARK = config.stageDark;
export const SURROUND_LIGHT = config.surroundLight;
export const SURROUND_DARK = config.surroundDark;
export const GREY_LIGHT = config.greyLight;
export const GREY_DARK = config.greyDark;

// Semantic colors derived from the active palette (same mapping for every brand)
function buildSemanticColors(p: BrandConfig['palette']) {
  return {
    PRIMARY: p.BLUE[600],
    PRIMARY_LIGHT: p.BLUE[400],
    PRIMARY_DARK: p.BLUE[700],
    SECONDARY: p.RED[600],
    SECONDARY_LIGHT: p.RED[400],
    SECONDARY_DARK: p.RED[700],
    BACKGROUND_LIGHT: p.WHITE,
    BACKGROUND_LIGHT_PAPER: p.WARM_GRAY[100],
    BACKGROUND_LIGHT_SIDEBAR: p.COOL_GRAY[100],
    BACKGROUND_DARK: p.COOL_GRAY[800],
    BACKGROUND_DARK_PAPER: p.COOL_GRAY[700],
    BACKGROUND_DARK_SIDEBAR: p.COOL_GRAY[700],
    TEXT_PRIMARY_LIGHT: p.COOL_GRAY[800],
    TEXT_SECONDARY_LIGHT: p.COOL_GRAY[600],
    TEXT_DISABLED_LIGHT: p.COOL_GRAY[400],
    TEXT_PRIMARY_DARK: p.WHITE,
    TEXT_SECONDARY_DARK: p.COOL_GRAY[300],
    TEXT_DISABLED_DARK: p.COOL_GRAY[500],
    LINK_COLOR_LIGHT: p.CYAN[700],
    LINK_COLOR_DARK: p.CYAN[400],
    LINK_HOVER_LIGHT: p.CYAN[800],
    LINK_HOVER_DARK: p.CYAN[300],
    SUCCESS: p.GREEN[500],
    WARNING: p.YELLOW[600],
    ERROR: p.RED[500],
    INFO: p.CYAN[500],
    SUCCESS_DARK: p.GREEN[400],
    WARNING_DARK: p.YELLOW[400],
    ERROR_DARK: p.RED[400],
    INFO_DARK: p.CYAN[300],
    PRIMARY_DARK_MODE: p.BLUE[300],
    PRIMARY_LIGHT_DARK_MODE: p.BLUE[200],
    PRIMARY_DARK_DARK_MODE: p.BLUE[400],
    BORDER_LIGHT: p.COOL_GRAY[200],
    BORDER_DARK: p.COOL_GRAY[600],
    DIVIDER_LIGHT: p.COOL_GRAY[200],
    DIVIDER_DARK: p.COOL_GRAY[600],
    CODE_BACKGROUND_LIGHT: p.COOL_GRAY[100],
    CODE_BACKGROUND_DARK: p.COOL_GRAY[700],
    CODE_TEXT_LIGHT: p.COOL_GRAY[800],
    CODE_TEXT_DARK: p.COOL_GRAY[200],
  };
}

export const SEMANTIC_COLORS = buildSemanticColors(PALETTE);

export type { BrandConfig } from './brands/types';
