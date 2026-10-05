// Default presentation config + tolerant parser/validator.
// Missing or malformed config falls back to DEFAULT_CONFIG (spec §2 decision 10).

import {
  BandElement,
  BandTemplate,
  PresentationConfig,
  TextVariant,
} from '../types/presentation';

/**
 * Built-in default. Reproduces the pre-feature look:
 *   header = section title (left) + "NN / MM" section counter (right)
 *   footer = app logo (left) + document title (center) + date (right)
 */
export const DEFAULT_CONFIG: PresentationConfig = {
  defaults: { team: '' },
  activeHeader: 'default',
  activeFooter: 'standard',
  headers: {
    'default': {
      left: [
        { type: 'text', value: '{sectionTitle}{continuation}', variant: 'title' },
      ],
      right: [
        { type: 'text', value: '{sectionNumber} / {sectionCount}', variant: 'meta' },
      ],
    },
  },
  footers: {
    'standard': {
      left: [{ type: 'icon', src: 'icons/logo.svg', height: 18 }],
      center: [{ type: 'text', value: '{documentTitle}', variant: 'meta' }],
      right: [{ type: 'text', value: '{date}', variant: 'meta' }],
    },
  },
};

const VALID_VARIANTS = new Set(['title', 'normal', 'meta']);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Validate a single element; return null if unusable so it can be dropped. */
function parseElement(raw: unknown): BandElement | null {
  if (!isPlainObject(raw)) return null;

  if (raw.type === 'text') {
    if (typeof raw.value !== 'string') return null;
    if (typeof raw.variant === 'string' && VALID_VARIANTS.has(raw.variant)) {
      return {
        type: 'text',
        value: raw.value,
        variant: raw.variant as TextVariant,
      };
    }
    return { type: 'text', value: raw.value };
  }

  if (raw.type === 'icon') {
    if (typeof raw.src !== 'string') return null;
    if (typeof raw.height === 'number' && raw.height > 0) {
      return { type: 'icon', src: raw.src, height: raw.height };
    }
    return { type: 'icon', src: raw.src };
  }

  return null;
}

function parseSlot(raw: unknown): BandElement[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const els = raw.map(parseElement).filter((e): e is BandElement => e !== null);
  return els.length > 0 ? els : undefined;
}

function parseBand(raw: unknown): BandTemplate | null {
  if (!isPlainObject(raw)) return null;
  const band: BandTemplate = {};
  const left = parseSlot(raw.left);
  const center = parseSlot(raw.center);
  const right = parseSlot(raw.right);
  if (left) band.left = left;
  if (center) band.center = center;
  if (right) band.right = right;
  return band;
}

function parseBandMap(raw: unknown): Record<string, BandTemplate> {
  if (!isPlainObject(raw)) return {};
  const out: Record<string, BandTemplate> = {};
  for (const [name, value] of Object.entries(raw)) {
    const band = parseBand(value);
    if (band) out[name] = band;
  }
  return out;
}

/**
 * Parse an untrusted config object into a valid PresentationConfig.
 * Any structural problem degrades gracefully toward DEFAULT_CONFIG rather
 * than throwing. Guarantees the active templates exist.
 */
export function parseConfig(raw: unknown): PresentationConfig {
  if (!isPlainObject(raw)) return DEFAULT_CONFIG;

  const team =
    isPlainObject(raw.defaults) && typeof raw.defaults.team === 'string'
      ? raw.defaults.team
      : DEFAULT_CONFIG.defaults.team;

  const headers = parseBandMap(raw.headers);
  const footers = parseBandMap(raw.footers);

  const activeHeader =
    typeof raw.activeHeader === 'string' ? raw.activeHeader : '';
  const activeFooter =
    typeof raw.activeFooter === 'string' ? raw.activeFooter : '';

  // Ensure the selected templates resolve. If not, fall back to defaults so
  // rendering always has something valid.
  const hasHeader = activeHeader && headers[activeHeader];
  const hasFooter = activeFooter && footers[activeFooter];

  if (!hasHeader) {
    Object.assign(headers, DEFAULT_CONFIG.headers);
  }
  if (!hasFooter) {
    Object.assign(footers, DEFAULT_CONFIG.footers);
  }

  return {
    defaults: { team },
    activeHeader: hasHeader ? activeHeader : DEFAULT_CONFIG.activeHeader,
    activeFooter: hasFooter ? activeFooter : DEFAULT_CONFIG.activeFooter,
    headers,
    footers,
  };
}

/** Pick active templates out of a parsed config. */
export function resolveConfig(config: PresentationConfig) {
  return {
    header: config.headers[config.activeHeader] ?? {},
    footer: config.footers[config.activeFooter] ?? {},
    defaults: config.defaults,
  };
}
