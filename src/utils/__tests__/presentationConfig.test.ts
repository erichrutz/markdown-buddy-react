import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONFIG,
  parseConfig,
  resolveConfig,
} from '../presentationConfig';

describe('parseConfig', () => {
  it('parses a valid config', () => {
    const raw = {
      defaults: { team: 'X-Team' },
      activeHeader: 'h1',
      activeFooter: 'f1',
      headers: { h1: { left: [{ type: 'text', value: 'A', variant: 'title' }] } },
      footers: { f1: { right: [{ type: 'text', value: 'B' }] } },
    };
    const cfg = parseConfig(raw);
    expect(cfg.defaults.team).toBe('X-Team');
    expect(cfg.activeHeader).toBe('h1');
    expect(cfg.activeFooter).toBe('f1');
    expect(cfg.headers.h1.left?.[0]).toEqual({
      type: 'text',
      value: 'A',
      variant: 'title',
    });
  });

  it('falls back to default for non-object input', () => {
    expect(parseConfig(null)).toBe(DEFAULT_CONFIG);
    expect(parseConfig('nope')).toBe(DEFAULT_CONFIG);
    expect(parseConfig(42)).toBe(DEFAULT_CONFIG);
  });

  it('uses default team when defaults missing', () => {
    const cfg = parseConfig({ headers: {}, footers: {} });
    expect(cfg.defaults.team).toBe(DEFAULT_CONFIG.defaults.team);
  });

  it('falls back to default template when active name is unknown', () => {
    const cfg = parseConfig({
      activeHeader: 'ghost',
      activeFooter: 'ghost',
      headers: { real: { left: [{ type: 'text', value: 'x' }] } },
      footers: { real: { left: [{ type: 'text', value: 'y' }] } },
    });
    // Unknown active names → default active + default templates merged in.
    expect(cfg.activeHeader).toBe(DEFAULT_CONFIG.activeHeader);
    expect(cfg.activeFooter).toBe(DEFAULT_CONFIG.activeFooter);
    expect(cfg.headers[DEFAULT_CONFIG.activeHeader]).toBeDefined();
    expect(cfg.footers[DEFAULT_CONFIG.activeFooter]).toBeDefined();
  });

  it('drops malformed elements but keeps valid ones', () => {
    const cfg = parseConfig({
      activeHeader: 'h',
      activeFooter: 'f',
      headers: {
        h: {
          left: [
            { type: 'text' }, // missing value → dropped
            { type: 'text', value: 'ok' }, // kept
            { type: 'bogus', value: 'x' }, // unknown type → dropped
            { type: 'icon', src: 'a.svg', height: 12 }, // kept
            { type: 'icon' }, // missing src → dropped
          ],
        },
      },
      footers: { f: { left: [{ type: 'text', value: 'z' }] } },
    });
    expect(cfg.headers.h.left).toEqual([
      { type: 'text', value: 'ok' },
      { type: 'icon', src: 'a.svg', height: 12 },
    ]);
  });

  it('ignores invalid variant, keeping text as plain', () => {
    const cfg = parseConfig({
      activeHeader: 'h',
      activeFooter: 'f',
      headers: { h: { left: [{ type: 'text', value: 'v', variant: 'huge' }] } },
      footers: { f: { left: [{ type: 'text', value: 'w' }] } },
    });
    expect(cfg.headers.h.left?.[0]).toEqual({ type: 'text', value: 'v' });
  });

  it('resolveConfig returns active templates', () => {
    const resolved = resolveConfig(DEFAULT_CONFIG);
    expect(resolved.header).toBe(
      DEFAULT_CONFIG.headers[DEFAULT_CONFIG.activeHeader],
    );
    expect(resolved.footer).toBe(
      DEFAULT_CONFIG.footers[DEFAULT_CONFIG.activeFooter],
    );
    expect(resolved.defaults.team).toBe('');
  });
});
