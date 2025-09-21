import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { createAppTheme } from '../theme/theme';

// Create a test theme
const testTheme = createAppTheme('light');

// Custom render function that includes providers
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ThemeProvider theme={testTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock MarkdownFile factory
export const createMockMarkdownFile = (path: string, content: string = '# Test Content') => {
  const mockFile = new File([content], path.split('/').pop() || 'test.md', {
    type: 'text/markdown'
  });
  
  return {
    path,
    name: mockFile.name,
    file: mockFile,
    isDirectory: false,
    children: []
  };
};

// Mock File System Directory Structure
export const createMockDirectory = (name: string, path: string, children: any[] = []) => ({
  path,
  name,
  file: null,
  isDirectory: true,
  children
});

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };