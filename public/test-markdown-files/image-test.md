# Enhanced Image Support Test

This document demonstrates the comprehensive embedded image support implementation.

## Local Images (Same Directory)

### SVG Image with Markdown Syntax
![Test Logo](./vite.svg)

### SVG Image with HTML Tag
<img src="./vite.svg" alt="Test Logo HTML" width="100">

### Vite Logo
![Vite Logo](./vite.svg)

## Different Path Formats

### Without ./prefix
![Test 1](vite.svg)

### With ./prefix  
![Test 2](./vite.svg)

## Expected Results

1. ✅ **File Tree**: Should only show `.md` files, not `.svg` files
2. ✅ **Image Rendering**: All images above should display with blob URLs  
3. ✅ **Path Resolution**: Different relative path formats should work
4. ✅ **Security**: Image sources converted to safe blob URLs via ImageService

If images display correctly, enhanced image support is working! ✨t

Testing local image display:

![Test Logo](./vite.svg)

![Vite Logo](./vite.svg)

Testing relative image in subdirectory:

![Example Image in docs](./docs/complex-example.md)

Testing external image:

![GitHub Logo](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)