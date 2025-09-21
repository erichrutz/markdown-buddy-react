import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../settings';

describe('Settings Types', () => {
  it('has valid default settings structure', () => {
    expect(DEFAULT_SETTINGS).toBeDefined();
    expect(DEFAULT_SETTINGS.appearance).toBeDefined();
    expect(DEFAULT_SETTINGS.behavior).toBeDefined();
    expect(DEFAULT_SETTINGS.diagrams).toBeDefined();
    expect(DEFAULT_SETTINGS.export).toBeDefined();
    expect(DEFAULT_SETTINGS.keyboard).toBeDefined();
    expect(DEFAULT_SETTINGS.performance).toBeDefined();
  });

  it('has correct default appearance settings', () => {
    const { appearance } = DEFAULT_SETTINGS;
    expect(appearance.theme).toBe('auto');
    expect(appearance.fontSize).toBe('medium');
    expect(appearance.fontFamily).toContain('apple-system');
    expect(appearance.compactMode).toBe(false);
    expect(appearance.showLineNumbers).toBe(false);
    expect(appearance.wordWrap).toBe(true);
  });

  it('has correct default behavior settings', () => {
    const { behavior } = DEFAULT_SETTINGS;
    expect(behavior.language).toBe('en');
    expect(behavior.autoSave).toBe(false);
    expect(behavior.confirmBeforeExit).toBe(true);
    expect(behavior.rememberLastFolder).toBe(true);
  });

  it('has valid font size options', () => {
    const validFontSizes = ['small', 'medium', 'large'];
    expect(validFontSizes).toContain(DEFAULT_SETTINGS.appearance.fontSize);
  });

  it('has valid theme options', () => {
    const validThemes = ['light', 'dark', 'auto'];
    expect(validThemes).toContain(DEFAULT_SETTINGS.appearance.theme);
  });
});