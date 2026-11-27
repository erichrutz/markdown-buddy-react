import { describe, it, expect, beforeAll, vi } from 'vitest';
import { ImageService } from '../imageService';
import type { MarkdownFile } from '../../types';

// jsdom may not implement createObjectURL
beforeAll(() => {
  if (!('createObjectURL' in URL)) {
    // @ts-expect-error test shim
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    // @ts-expect-error test shim
    URL.revokeObjectURL = vi.fn();
  }
});

function imgFile(path: string): MarkdownFile {
  return {
    name: path.split('/').pop() || path,
    path,
    type: 'image',
    file: new Blob(['x']),
  } as MarkdownFile;
}

describe('ImageService.resolveImagePaths', () => {
  it('resolves relative markdown image to blob url', () => {
    let n = 0;
    URL.createObjectURL = vi.fn(() => `blob:mock-${n++}`);

    const files = [imgFile('/root/img/MDB-Light.png')];
    ImageService.registerImages(files);

    const md = '![alt text](img/MDB-Light.png)';
    const out = ImageService.resolveImagePaths(md, '/root/README.md', files);

    expect(out).toMatch(/^!\[alt text\]\(blob:mock-\d+\)$/);
  });

  it('resolves html img src to blob url', () => {
    const files = [imgFile('/root/img/MDB-Light.png')];
    ImageService.registerImages(files);
    const html = '<img src="img/MDB-Light.png" alt="x">';
    const out = ImageService.resolveImagePaths(html, '/root/README.md', files);
    expect(out).toContain('blob:');
    expect(out).not.toContain('img/MDB-Light.png');
  });

  it('resolves URL-encoded paths (spaces as %20) to files with spaces', () => {
    const files = [imgFile('docs/HTML KIT Overview.png')];
    ImageService.registerImages(files);
    const out = ImageService.resolveImagePaths('![alt text](./HTML%20KIT%20Overview.png)', 'docs/Proposal.md', files);
    expect(out).toMatch(/^!\[alt text\]\(blob:[^)]+\)$/);
  });

  it('resolves angle-bracket paths and keeps an image title', () => {
    const files = [imgFile('docs/img/My Diagram.png')];
    ImageService.registerImages(files);
    const out = ImageService.resolveImagePaths('![d](<img/My Diagram.png> "Overview")', 'docs/a.md', files);
    expect(out).toMatch(/^!\[d\]\(blob:\S+ "Overview"\)$/);
  });

  it('resolves html img src with encoded spaces', () => {
    const files = [imgFile('docs/HTML KIT Overview.png')];
    ImageService.registerImages(files);
    const out = ImageService.resolveImagePaths('<img src="HTML%20KIT%20Overview.png">', 'docs/a.md', files);
    expect(out).toContain('blob:');
  });

  it('leaves unknown images and malformed escapes untouched', () => {
    const files = [imgFile('docs/a.png')];
    ImageService.registerImages(files);
    expect(ImageService.resolveImagePaths('![x](missing%zz.png)', 'docs/a.md', files)).toBe('![x](missing%zz.png)');
  });
});
