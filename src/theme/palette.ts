/**
 * Color Palette
 *
 * Re-exports the brand-aware palette so existing consumers keep working.
 * The actual color values are determined by VITE_BRAND in brand.ts.
 */

export { PALETTE, SEMANTIC_COLORS } from './brand';
import { PALETTE } from './brand';

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
