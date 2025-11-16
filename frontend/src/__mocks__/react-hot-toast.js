import { vi } from 'vitest';

const toast = {
  error: vi.fn(),
  success: vi.fn(),
  // provide other commonly used toast methods as no-ops/mocks
  loading: vi.fn(),
  dismiss: vi.fn(),
};

export default toast;
