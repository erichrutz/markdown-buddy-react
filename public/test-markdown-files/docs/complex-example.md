# Complex Markdown Example

This document demonstrates various markdown features supported by MarkDown Buddy.

## Table of Contents
- [Headers](#headers)
- [Text Formatting](#text-formatting)
- [Lists](#lists)
- [Tables](#tables)
- [Code Blocks](#code-blocks)
- [Links and References](#links-and-references)
- [Blockquotes](#blockquotes)

## Headers

# H1 Header
## H2 Header  
### H3 Header
#### H4 Header
##### H5 Header
###### H6 Header

## Text Formatting

**Bold text** and __also bold__

*Italic text* and _also italic_

***Bold and italic*** and ___also bold and italic___

~~Strikethrough text~~

`Inline code` with backticks

## Lists

### Unordered Lists
- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
    - Deep nested item
- Item 3

### Ordered Lists
1. First item
2. Second item
   1. Nested numbered item
   2. Another nested item
3. Third item

### Task Lists
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
- [ ] Another incomplete task

## Tables

| Feature | Supported | Notes |
|---------|-----------|-------|
| Headers | ✅ Yes | All levels H1-H6 |
| Tables | ✅ Yes | With alignment |
| Code | ✅ Yes | Syntax highlighting |
| Links | ✅ Yes | Internal and external |
| Images | ✅ Yes | Standard markdown |

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Left | Center | Right |
| Test | Test | Test |

## Code Blocks

### JavaScript Example
\`\`\`javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
\`\`\`

### Python Example
\`\`\`python
def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    
    return quick_sort(left) + middle + quick_sort(right)

print(quick_sort([3, 6, 8, 10, 1, 2, 1]))
\`\`\`

### JSON Example
\`\`\`json
{
  "name": "MarkDown Buddy",
  "version": "1.0.0",
  "features": [
    "Syntax Highlighting",
    "Internal Links",
    "Mermaid Diagrams",
    "File Tree Navigation"
  ],
  "supported_languages": {
    "interface": ["German", "English"],
    "code": ["JavaScript", "Python", "JSON", "TypeScript", "CSS", "HTML"]
  }
}
\`\`\`

## Links and References

### External Links
- [GitHub](https://github.com)
- [Markdown Guide](https://www.markdownguide.org/)
- [Mermaid Documentation](https://mermaid.js.org/)

### Internal Links
- [Back to README](../README.md)
- [Internal Links Test](internal-links.md)
- [Getting Started Guide](getting-started.md)
- [Code Examples](../examples/code-examples.md)

## Blockquotes

> This is a simple blockquote.

> This is a longer blockquote that spans multiple lines.
> It continues here with more text to demonstrate
> how blockquotes are rendered.

> ### Blockquote with Header
> 
> You can even include other markdown elements inside blockquotes:
> 
> - List item 1
> - List item 2
> 
> And `inline code` too!

## Horizontal Rules

---

Use horizontal rules to separate sections.

***

Different syntax, same result.

___

## Emphasis and Strong

*Emphasis* vs **Strong** vs ***Both***

## Line Breaks

This is a paragraph with  
a manual line break.

This is a new paragraph.

---

**End of complex example** - This document tests most markdown features supported by MarkDown Buddy!