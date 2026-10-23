import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';

// Configure testing library
configure({ testIdAttribute: 'data-testid' });

// Stateful localStorage Mock adhering to W3C Storage Specification
const createLocalStorageMock = () => {
  let store = {};

  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

const localStorageMock = createLocalStorageMock();
vi.stubGlobal('localStorage', localStorageMock);

// Mock window.matchMedia for components relying on media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Reset all mocks and storage state after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorageMock.clear();
});

// Suppress console errors/warnings in tests
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};