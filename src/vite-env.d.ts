/// <reference types="vite/client" />

// CSS Custom Highlight API
// https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API
declare class Highlight {
  constructor(...ranges: AbstractRange[]);
}

interface HighlightRegistry {
  set(name: string, highlight: Highlight): void;
  get(name: string): Highlight | undefined;
  has(name: string): boolean;
  delete(name: string): boolean;
  clear(): void;
}

interface CSSInterface {
  highlights: HighlightRegistry;
}

declare namespace CSS {
  const highlights: HighlightRegistry;
}