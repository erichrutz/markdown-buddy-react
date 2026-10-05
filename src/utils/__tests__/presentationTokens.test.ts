import { describe, it, expect } from 'vitest';
import { interpolate } from '../presentationTokens';
import { TokenContext } from '../../types/presentation';

const ctx: TokenContext = {
  sectionTitle: 'Intro',
  continuation: ' (Fortsetzung)',
  documentTitle: 'My Doc',
  fileName: 'intro.md',
  sectionNumber: 3,
  sectionCount: 10,
  pageNumber: 2,
  pageCount: 4,
  date: '10.09.2026',
  time: '14:07:00',
  author: 'Jane',
};

describe('interpolate', () => {
  it('replaces every known token', () => {
    expect(interpolate('{sectionTitle}', ctx)).toBe('Intro');
    expect(interpolate('{continuation}', ctx)).toBe(' (Fortsetzung)');
    expect(interpolate('{documentTitle}', ctx)).toBe('My Doc');
    expect(interpolate('{fileName}', ctx)).toBe('intro.md');
    expect(interpolate('{sectionNumber}', ctx)).toBe('3');
    expect(interpolate('{sectionCount}', ctx)).toBe('10');
    expect(interpolate('{pageNumber}', ctx)).toBe('2');
    expect(interpolate('{pageCount}', ctx)).toBe('4');
    expect(interpolate('{date}', ctx)).toBe('10.09.2026');
    expect(interpolate('{time}', ctx)).toBe('14:07:00');
    expect(interpolate('{author}', ctx)).toBe('Jane');
  });

  it('combines tokens and literals', () => {
    expect(interpolate('{sectionNumber} / {sectionCount}', ctx)).toBe('3 / 10');
    expect(interpolate('{sectionTitle}{continuation}', ctx)).toBe(
      'Intro (Fortsetzung)',
    );
  });

  it('replaces unknown tokens with empty string', () => {
    expect(interpolate('{nope}', ctx)).toBe('');
    expect(interpolate('a{unknown}b', ctx)).toBe('ab');
  });

  it('leaves text without tokens unchanged', () => {
    expect(interpolate('plain text', ctx)).toBe('plain text');
  });
});
