/**
 * Brand configuration interface.
 *
 * Each brand module (e.g. default.ts, db.ts) must default-export
 * an object satisfying this shape.
 */

export interface ColorScale {
  800: string; 700: string; 600: string; 500: string;
  400: string; 300: string; 200: string; 100: string;
}

export interface BrandPalette {
  BLACK: string;
  WHITE: string;
  YELLOW: ColorScale;
  ORANGE: ColorScale;
  RED: ColorScale;
  BLUE: ColorScale;
  CYAN: ColorScale;
  GREEN: ColorScale;
  COOL_GRAY: ColorScale;
  WARM_GRAY: ColorScale;
}

export interface BrandTokens {
  accent: string;
  accentHover: string;
  danger: string;
  dangerHover: string;
  markerBg: string;
  markerFg: string;
}

export interface SurfaceTokens {
  chrome: string; canvas: string; paper: string; field: string;
  border: string; border2: string; hover: string;
  fg1: string; fg2: string; fg3: string; body: string;
  code: string; pre: string;
  selBg: string; selFg: string; folder: string; file: string;
}

export interface StageTokens {
  stage: string; line: string; dim: string; title: string;
  body: string; pre: string; hover: string; activeBg: string;
}

export interface SurroundTokens {
  surround: string;
}

export interface GreyScale {
  [key: string]: string;
}

export interface BrandConfig {
  id: string;
  productName: string;
  fontFamily: string;
  palette: BrandPalette;
  brandTokens: BrandTokens;
  surfaceLight: SurfaceTokens;
  surfaceDark: SurfaceTokens;
  stageLight: StageTokens;
  stageDark: StageTokens;
  surroundLight: SurroundTokens;
  surroundDark: SurroundTokens;
  greyLight: GreyScale;
  greyDark: GreyScale;
}
