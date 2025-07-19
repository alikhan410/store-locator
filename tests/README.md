# Testing Framework Documentation

This document describes the comprehensive testing framework set up for the Store Locator app.

## 🧪 Testing Stack

### Unit & Integration Tests
- **Vitest** - Fast unit test runner with React support
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM testing
- **@testing-library/user-event** - User interaction simulation

### End-to-End Tests
- **Playwright** - Cross-browser end-to-end testing
- **Multiple browsers** - Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari

## 📁 Test Structure

```
tests/
├── setup.js                    # Global test setup and mocks
├── unit/                       # Unit tests
│   └── helper/                 # Helper function tests
│       ├── exportAction.test.js
│       └── geoUtils.test.js
├── integration/                # Integration tests
│   └── routes/                 # Route integration tests
│       └── gdpr.test.js
├── e2e/                        # End-to-end tests
│   └── gdpr-compliance.spec.js
└── README.md                   # This file
```

## 🚀 Quick Start

### Running Tests

```bash
# Run all unit and integration tests
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run end-to-end tests
npm run test:e2e

# Run all tests (unit + e2e)
npm run test:all
```

### Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Start Vitest in watch mode |
| `npm run test:run` | Run all tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ui` | Open Vitest UI |
| `npm run test:e2e` | Run Playwright tests |
| `npm run test:e2e:ui` | Open Playwright UI |
| `npm run test:e2e:headed` | Run E2E tests with browser visible |
| `npm run test:e2e:debug` | Run E2E tests in debug mode |

## 📝 Writing Tests

### Unit Tests

Unit tests focus on testing individual functions and components in isolation.

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Integration Tests

Integration tests test how different parts of the application work together.

```javascript
import { describe, it, expect, vi } from 'vitest';
import { createRequest } from '@remix-run/node';

describe('Route Integration', () => {
  it('should handle form submission', async () => {
    const request = createRequest('http://localhost:3000/app/test', {
      method: 'POST',
      body: new FormData(),
    });
    
    const { action } = await import('../app/routes/app.test.jsx');
    const result = await action({ request });
    
    expect(result.status).toBe(200);
  });
});
```

### End-to-End Tests

E2E tests simulate real user interactions across the entire application.

```javascript
import { test, expect } from '@playwright/test';

test('user can add a store', async ({ page }) => {
  await page.goto('/app/add-store');
  await page.fill('[name="name"]', 'Test Store');
  await page.fill('[name="address"]', '123 Main St');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Store saved successfully')).toBeVisible();
});
```

## 🔧 Test Configuration

### Vitest Configuration (`vitest.config.js`)

- **Environment**: jsdom for DOM testing
- **Coverage**: V8 provider with HTML reports
- **Aliases**: `~` points to `./app` directory
- **Setup**: Global mocks and test environment setup

### Playwright Configuration (`playwright.config.js`)

- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel**: Tests run in parallel when possible
- **Retries**: 2 retries in CI, 0 in development
- **Web Server**: Automatically starts dev server for E2E tests

## 🎭 Mocking Strategy

### Global Mocks (`tests/setup.js`)

- **Shopify App Bridge**: Mocked to avoid authentication issues
- **Remix Hooks**: Mocked for consistent testing
- **Google Maps**: Mocked to avoid API dependencies
- **Environment Variables**: Set to test values
- **Browser APIs**: Mocked for consistent behavior

### Component-Specific Mocks

```javascript
// Mock specific modules in individual tests
vi.mock('../app/db.server', () => ({
  default: {
    store: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
```

## 📊 Coverage Reports

### Running Coverage

```bash
npm run test:coverage
```

This generates:
- **Console report**: Coverage summary in terminal
- **HTML report**: Detailed coverage in `coverage/` directory
- **JSON report**: Machine-readable coverage data

### Coverage Targets

- **Statements**: 80% minimum
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum

## 🧪 Test Categories

### 1. Unit Tests
- **Helper functions**: `exportAction.js`, `geoUtils.js`
- **Utility functions**: Data validation, formatting
- **Pure functions**: No side effects, easy to test

### 2. Integration Tests
- **Route handlers**: Loader and action functions
- **Database operations**: Prisma queries with mocks
- **API integrations**: External service calls

### 3. End-to-End Tests
- **User workflows**: Complete user journeys
- **Cross-browser compatibility**: Different browsers
- **Responsive design**: Mobile and desktop views

## 🔍 Testing Best Practices

### 1. Test Organization
- Group related tests using `describe` blocks
- Use descriptive test names that explain the behavior
- Keep tests focused and single-purpose

### 2. Mocking
- Mock external dependencies (APIs, databases)
- Use realistic mock data
- Reset mocks between tests

### 3. Assertions
- Test behavior, not implementation
- Use specific assertions
- Test error conditions and edge cases

### 4. Performance
- Keep tests fast and focused
- Use parallel execution when possible
- Avoid unnecessary setup/teardown

## 🚨 Common Issues & Solutions

### 1. Module Import Issues
```javascript
// Use dynamic imports for ES modules
const { loader } = await import('../app/routes/app.test.jsx');
```

### 2. Async Test Issues
```javascript
// Always await async operations
it('should handle async operation', async () => {
  const result = await someAsyncFunction();
  expect(result).toBeDefined();
});
```

### 3. Mock Reset Issues
```javascript
// Reset mocks in beforeEach
beforeEach(() => {
  vi.clearAllMocks();
});
```

## 📈 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
```

## 🎯 Test Priorities

### High Priority (Critical Path)
- [x] GDPR compliance features
- [x] Store CRUD operations
- [x] Authentication and authorization
- [x] Data export/import functionality

### Medium Priority (Important Features)
- [ ] Map integration
- [ ] Search and filtering
- [ ] CSV import/export
- [ ] Error handling

### Low Priority (Nice to Have)
- [ ] Performance optimization
- [ ] Accessibility features
- [ ] Edge case handling
- [ ] UI polish

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Remix Testing Guide](https://remix.run/docs/en/main/guides/testing)

---

**Note**: This testing framework is designed to provide comprehensive coverage while maintaining fast execution times. Regular test maintenance and updates are essential for keeping the test suite effective and reliable. 