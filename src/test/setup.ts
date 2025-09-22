// Mock problematic modules BEFORE any other imports
vi.mock('whatwg-url', () => ({
  URL: class MockURL {
    href: string;
    constructor(url: string) {
      this.href = url;
    }
    toString() { return this.href; }
  },
  URLSearchParams: class MockURLSearchParams {
    constructor() {}
    get() { return null; }
    set() {}
    append() {}
    toString() { return ''; }
  }
}));

vi.mock('webidl-conversions', () => ({
  default: {},
  ...Object.fromEntries(['boolean', 'byte', 'octet', 'short', 'unsigned short', 'long', 'unsigned long', 'long long', 'unsigned long long', 'float', 'unrestricted float', 'double', 'unrestricted double', 'DOMString', 'ByteString', 'USVString'].map(name => [name, (val: any) => val]))
}));

// Set up process.env for Node.js compatibility
if (typeof process === 'undefined') {
  (globalThis as any).process = { env: {} };
}

// Mock global APIs that might be missing in CI
global.showDirectoryPicker = vi.fn();
global.showOpenFilePicker = vi.fn();
global.requestIdleCallback = vi.fn();
global.cancelIdleCallback = vi.fn();

// Silence problematic console errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args[0]?.toString?.() || '';
  if (message.includes('webidl-conversions') || 
      message.includes('whatwg-url') ||
      message.includes('Cannot read properties of undefined')) {
    return; // Suppress these specific errors
  }
  originalConsoleError.apply(console, args);
};

import '@testing-library/jest-dom';

// Mock react-i18next completely
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'de',
      changeLanguage: vi.fn(),
    },
  }),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock File System Access API for tests
global.showDirectoryPicker = vi.fn();
global.showOpenFilePicker = vi.fn();

// Mock matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock URL and URLSearchParams
global.URL = global.URL || class MockURL {
  constructor(url: string) {
    this.href = url;
  }
  href: string;
};

global.URLSearchParams = global.URLSearchParams || class MockURLSearchParams {
  constructor() {}
  get() { return null; }
  set() {}
  append() {}
};

// Mock fetch for tests
global.fetch = vi.fn();

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Silence console.log in tests
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};