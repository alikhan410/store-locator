import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Set up environment variables for dev database
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/store_locator_test';

// Mock browser APIs that are not available in jsdom
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document methods for CSV export tests
const mockLink = {
  href: '',
  download: '',
  click: vi.fn(),
  style: { display: '' },
  setAttribute: vi.fn(),
};

global.document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return mockLink;
  }
  // For other elements, use the real createElement
  const realCreateElement = global.document.constructor.prototype.createElement;
  return realCreateElement.call(document, tagName);
});

global.document.body.appendChild = vi.fn();
global.document.body.removeChild = vi.fn();

// Only mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}; 