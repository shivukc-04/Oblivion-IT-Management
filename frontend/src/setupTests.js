import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Reset all mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Suppress console errors/warnings in tests (optional)
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
