# Image Rendering Test - Working Example

This document demonstrates embedded image functionality in MarkDown Buddy.

## Test Image

The image below should render correctly:

![Test Image](./test-image.svg)

## How It Works

When you open this directory in MarkDown Buddy:

1. **File Loading**: Both `.md` and image files are loaded
2. **Tree Display**: Only markdown files appear in the tree navigation  
3. **Image Resolution**: Relative paths are converted to blob URLs
4. **Rendering**: Images display inline with the markdown content

## Supported Image Formats

- PNG (.png)
- JPEG (.jpg, .jpeg) 
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)
- SVG (.svg)

## Path Examples

Same directory:
![Same Dir](./test-image.svg)

You can also use HTML syntax:
<img src="./test-image.svg" alt="HTML syntax" width="200">

## Troubleshooting

If images don't appear:
- Ensure the image file is in the same directory as this markdown file
- Check that the file extension is supported
- Verify the relative path is correct
- Make sure both files were loaded when you selected the directory

## Success Indicators

✅ This markdown file appears in the file tree  
✅ The test-image.svg file is loaded but hidden from tree  
✅ Images render without broken image icons  
✅ Both markdown and HTML image syntax work  