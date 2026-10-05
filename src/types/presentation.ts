// Types for configurable presentation header/footer bands.
// See docs/specs/presentation-header-footer.md

export type TextVariant = 'title' | 'normal' | 'meta';

export interface TextElement {
  type: 'text';
  /** Text, may contain {tokens} interpolated at render time. */
  value: string;
  /** Styling variant; defaults to "normal". */
  variant?: TextVariant;
}

export interface IconElement {
  type: 'icon';
  /** Path relative to public/presentation/, e.g. "icons/logo.svg". */
  src: string;
  /** Rendered height in px; defaults to 20. */
  height?: number;
}

export type BandElement = TextElement | IconElement;

/** A header or footer template with up to three horizontal slots. */
export interface BandTemplate {
  left?: BandElement[];
  center?: BandElement[];
  right?: BandElement[];
}

export interface PresentationDefaults {
  /** Fallback for {author} when no frontmatter author is present. */
  team: string;
}

export interface PresentationConfig {
  defaults: PresentationDefaults;
  activeHeader: string;
  activeFooter: string;
  headers: Record<string, BandTemplate>;
  footers: Record<string, BandTemplate>;
}

/** Resolved active templates plus defaults, ready for rendering. */
export interface ResolvedPresentationConfig {
  header: BandTemplate;
  footer: BandTemplate;
  defaults: PresentationDefaults;
}

/** Values available to token interpolation, computed per slide. */
export interface TokenContext {
  sectionTitle: string;
  continuation: string;
  documentTitle: string;
  fileName: string;
  sectionNumber: number;
  sectionCount: number;
  pageNumber: number;
  pageCount: number;
  date: string;
  time: string;
  author: string;
}
