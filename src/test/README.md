# Testing Setup

This directory contains the test configuration and utilities for the Markdown Buddy React application.

## Test Framework

- **Vitest**: Fast test runner built for Vite
- **Testing Library**: React component testing utilities
- **jsdom**: Browser environment simulation

## Test Scripts

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage

# Open test UI (interactive)
npm run test:ui
```

## Test Structure

```
src/
├── __tests__/           # Basic utility tests
├── components/__tests__ # Component tests (planned)
├── hooks/__tests__      # Hook tests (planned) 
├── services/__tests__   # Service layer tests
├── types/__tests__      # Type definition tests
├── utils/__tests__      # Utility function tests
└── test/
    ├── setup.ts         # Global test configuration
    ├── test-utils.tsx   # React testing utilities
    └── README.md        # This file
```

## Test Coverage

Current test coverage focuses on:
- ✅ Basic functionality
- ✅ Theme creation
- ✅ Settings type definitions  
- ✅ Markdown service utilities

## Future Test Areas

- React component testing (requires complex mocking)
- Hook testing with React Testing Library
- Integration tests for file system operations
- E2E tests with Playwright (planned)

## Mocking Strategy

- File System APIs are mocked globally
- react-i18next is mocked for translation tests
- Material-UI components are tested through rendered output
- localStorage is mocked for settings persistence tests