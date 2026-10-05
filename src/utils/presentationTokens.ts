// Token interpolation for presentation band text (spec §4).
// Unknown tokens are replaced with an empty string.

import { TokenContext } from '../types/presentation';

/**
 * Replace every {token} in `value` using `ctx`. Tokens not present in the
 * context resolve to an empty string (documented behaviour).
 *
 * Token names: letters/digits/underscore. Braces around unknown names are
 * consumed so no literal "{foo}" leaks into the slide.
 */
export function interpolate(value: string, ctx: TokenContext): string {
  const map: Record<string, string> = {
    sectionTitle: ctx.sectionTitle,
    continuation: ctx.continuation,
    documentTitle: ctx.documentTitle,
    fileName: ctx.fileName,
    sectionNumber: String(ctx.sectionNumber),
    sectionCount: String(ctx.sectionCount),
    pageNumber: String(ctx.pageNumber),
    pageCount: String(ctx.pageCount),
    date: ctx.date,
    time: ctx.time,
    author: ctx.author,
  };

  return value.replace(/\{(\w+)\}/g, (_match, name: string) =>
    Object.prototype.hasOwnProperty.call(map, name) ? map[name] ?? '' : '',
  );
}
