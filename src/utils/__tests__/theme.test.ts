import { describe, it, expect } from 'vitest';
import { createAppTheme } from '../../theme/theme';

describe('Theme Creation', () => {
  it('creates light theme', () => {
    const theme = createAppTheme('light');
    expect(theme.palette.mode).toBe('light');
  });

  it('creates dark theme', () => {
    const theme = createAppTheme('dark');
    expect(theme.palette.mode).toBe('dark');
  });

  it('applies appearance settings', () => {
    const theme = createAppTheme('light', {
      fontFamily: 'Arial'
    });
    expect(theme.typography.fontFamily).toContain('Arial');
  });
});