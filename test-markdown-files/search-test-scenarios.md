# Search Test Scenarios

This file documents test scenarios for the search functionality.

## Test Cases

### 1. Exact Filename Matches
- `alpha-test.md` should match search for "alpha"
- `beta-version.md` should match search for "beta"
- `alphabet-soup.md` should match search for "alphabet"

### 2. Fuzzy Filename Matches
- `alphabet-soup.md` should match search for "alpha" (fuzzy)
- `change-detection-test.md` should match search for "change"
- `pdf-export-test.md` should match search for "pdf"

### 3. Path-based Matches
- Files in `export/` folder should match search for "export"
- Files with extension `.md` should be searchable

### 4. Content Search (Future Feature)
- Files containing "alpha" in content should be found
- Case-insensitive content search
- Regex search support

## Debug Information

When searching for "alpha", expected results:
1. `alpha-test.md` (exact filename match)
2. `alphabet-soup.md` (fuzzy filename match)

The search should log:
- Number of available files
- Fuse.js search results
- Processed search results