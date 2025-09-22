# Image Support Test

This test demonstrates that embedded images work correctly in MarkDown Buddy.

## Test Image from Parent Directory

This image is located in the parent directory:

![Test SVG Image](../test-image.svg)

## How to Test

1. Open the `test-markdown-files` directory in MarkDown Buddy
2. Navigate to this file in `examples/image-test.md`
3. The image above should render correctly even though it's in the parent directory

## What Should Happen

✅ **Tree View**: Only markdown files appear in the file tree navigation  
✅ **Image Loading**: Image files are loaded silently in the background  
✅ **Path Resolution**: Relative paths like `../test-image.svg` work correctly  
✅ **Rendering**: Images display inline without broken image icons  

## Success Criteria

- You can see the test image with shapes and "✓ Working" text
- No broken image placeholder appears
- The file tree shows this markdown file but hides the SVG file
- Navigation and selection work normally

If you see the image above, then embedded image support is working perfectly!