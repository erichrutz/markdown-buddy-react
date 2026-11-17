import { describe, it, expect } from 'vitest';
import { render } from '../../test/test-utils';
import { RawViewer } from '../RawViewer';
import { getSurfaceTokens } from '../../theme/designTokens';

describe('RawViewer', () => {
  it('shows the unrendered source with one numbered row per line', () => {
    const content = '# Title\n\n**bold** text';
    const { container } = render(
      <RawViewer source={content} tokens={getSurfaceTokens('light')} isDark={false} zoom={100} />,
    );
    const pre = container.querySelector('pre.raw-source')!;
    expect(pre).toBeTruthy();
    expect(pre.children).toHaveLength(3);
    expect(pre.textContent).toContain('# Title');
    expect(pre.textContent).toContain('**bold** text');
    expect(container.querySelector('strong')).toBeNull();
    expect(container.querySelector('.hljs-section')?.textContent).toBe('# Title');
  });
});
