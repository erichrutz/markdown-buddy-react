import { useState, useCallback, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { MarkdownFile } from '../types';

interface SearchResult {
  type: 'file' | 'content';
  file: MarkdownFile;
  matches?: string[];
  score?: number;
  preview?: string;
  line?: number;
  column?: number;
}

interface ContentSearchResult {
  file: MarkdownFile;
  matches: Array<{
    line: number;
    column: number;
    text: string;
    preview: string;
  }>;
}

interface SearchOptions {
  includeContent?: boolean;
  caseSensitive?: boolean;
  useRegex?: boolean;
  fuzzyMatching?: boolean;
  maxResults?: number;
}

export const useSearch = (files: Map<string, MarkdownFile>) => {
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('markdown-buddy-search-history') || '[]');
    } catch {
      return [];
    }
  });
  
  const [contentIndex, setContentIndex] = useState<Map<string, string>>(new Map());
  const indexingInProgress = useRef(false);
  
  // File search using Fuse.js
  const filesArray = useMemo(() => Array.from(files.values()), [files]);
  
  const fuseOptions = useMemo(() => ({
    keys: [
      { name: 'name', weight: 0.7 },
      { name: 'path', weight: 0.3 }
    ],
    threshold: 0.3,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1,
    ignoreLocation: true
  }), []);
  
  const fuse = useMemo(() => new Fuse(filesArray, fuseOptions), [filesArray, fuseOptions]);
  
  // Build content index for full-text search
  const buildContentIndex = useCallback(async () => {
    if (indexingInProgress.current) return;
    indexingInProgress.current = true;
    
    const newIndex = new Map<string, string>();
    
    try {
      // Process files in batches to avoid blocking UI
      const batchSize = 10;
      const fileEntries = Array.from(files.entries());
      
      for (let i = 0; i < fileEntries.length; i += batchSize) {
        const batch = fileEntries.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async ([path, file]) => {
            try {
              const content = await file.file.text();
              newIndex.set(path, content.toLowerCase()); // Store lowercase for faster searching
            } catch (error) {
              console.warn(`Failed to index content for ${path}:`, error);
            }
          })
        );
        
        // Yield to UI between batches
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      setContentIndex(newIndex);
      console.log(`Search index built for ${newIndex.size} files`);
    } catch (error) {
      console.error('Error building search index:', error);
    } finally {
      indexingInProgress.current = false;
    }
  }, [files]);
  
  // Search files by name
  const searchFiles = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];
    
    return fuse.search(query).map(result => ({
      type: 'file' as const,
      file: result.item,
      matches: result.matches?.map(match => match.key || '') || [],
      score: result.score || 0
    }));
  }, [fuse]);
  
  // Search content within files
  const searchContent = useCallback(async (
    query: string, 
    options: { caseSensitive?: boolean; useRegex?: boolean } = {}
  ): Promise<ContentSearchResult[]> => {
    if (!query.trim()) return [];
    
    const results: ContentSearchResult[] = [];
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    
    // Use regex search if requested
    let searchRegex: RegExp | null = null;
    if (options.useRegex) {
      try {
        searchRegex = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
      } catch (error) {
        console.warn('Invalid regex pattern:', query);
        return [];
      }
    }
    
    for (const [path, indexedContent] of contentIndex.entries()) {
      const file = files.get(path);
      if (!file) continue;
      
      const matches: ContentSearchResult['matches'] = [];
      
      if (searchRegex) {
        // Regex search
        const originalContent = await file.file.text();
        const lines = originalContent.split('\n');
        
        lines.forEach((line, lineIndex) => {
          let match;
          searchRegex.lastIndex = 0; // Reset regex
          
          while ((match = searchRegex.exec(line)) !== null) {
            const preview = getLinePreview(line, match.index, query.length);
            matches.push({
              line: lineIndex + 1,
              column: match.index + 1,
              text: match[0],
              preview
            });
            
            // Prevent infinite loop for zero-width matches
            if (match.index === searchRegex.lastIndex) {
              searchRegex.lastIndex++;
            }
          }
        });
      } else {
        // Simple string search
        const searchContent = options.caseSensitive ? await file.file.text() : indexedContent;
        const lines = searchContent.split('\n');
        
        lines.forEach((line, lineIndex) => {
          let startIndex = 0;
          let matchIndex;
          
          while ((matchIndex = line.indexOf(searchQuery, startIndex)) !== -1) {
            const preview = getLinePreview(line, matchIndex, searchQuery.length);
            matches.push({
              line: lineIndex + 1,
              column: matchIndex + 1,
              text: searchQuery,
              preview
            });
            startIndex = matchIndex + 1;
          }
        });
      }
      
      if (matches.length > 0) {
        results.push({ file, matches });
      }
    }
    
    return results.sort((a, b) => b.matches.length - a.matches.length);
  }, [contentIndex, files]);
  
  // Get line preview with context
  const getLinePreview = (line: string, matchIndex: number, matchLength: number): string => {
    const contextLength = 40;
    const start = Math.max(0, matchIndex - contextLength);
    const end = Math.min(line.length, matchIndex + matchLength + contextLength);
    
    let preview = line.substring(start, end);
    if (start > 0) preview = '...' + preview;
    if (end < line.length) preview = preview + '...';
    
    return preview.trim();
  };
  
  // Combined search (files + content)
  const searchAll = useCallback(async (
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> => {
    const {
      includeContent = false,
      caseSensitive = false,
      useRegex = false,
      maxResults = 50
    } = options;
    
    const results: SearchResult[] = [];
    
    // File name search
    const fileResults = searchFiles(query);
    results.push(...fileResults.slice(0, maxResults / 2));
    
    // Content search if requested
    if (includeContent && contentIndex.size > 0) {
      const contentResults = await searchContent(query, { caseSensitive, useRegex });
      
      contentResults.forEach(result => {
        result.matches.forEach(match => {
          results.push({
            type: 'content',
            file: result.file,
            matches: [match.text],
            preview: match.preview,
            line: match.line,
            column: match.column,
            score: 0.5 // Content matches have lower score than file name matches
          });
        });
      });
    }
    
    // Sort by score and limit results
    return results
      .sort((a, b) => (a.score || 0) - (b.score || 0))
      .slice(0, maxResults);
  }, [searchFiles, searchContent, contentIndex.size]);
  
  // Update search history
  const updateSearchHistory = useCallback((newHistory: string[]) => {
    setSearchHistory(newHistory);
    localStorage.setItem('markdown-buddy-search-history', JSON.stringify(newHistory));
  }, []);

  // Add search to history
  const addToHistory = useCallback((query: string) => {
    const newHistory = [
      query,
      ...searchHistory.filter(item => item !== query)
    ].slice(0, 10); // Keep last 10 searches
    
    updateSearchHistory(newHistory);
  }, [searchHistory, updateSearchHistory]);
  
  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('markdown-buddy-search-history');
  }, []);
  
  return {
    searchFiles,
    searchContent,
    searchAll,
    searchHistory,
    addToHistory,
    updateSearchHistory,
    clearHistory,
    buildContentIndex,
    isIndexing: indexingInProgress.current,
    indexSize: contentIndex.size
  };
};