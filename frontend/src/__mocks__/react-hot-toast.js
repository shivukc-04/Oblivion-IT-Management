import { vi } from 'vitest';

const toast = {
  error: vi.fn(),
  success: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
  custom: vi.fn(),
};

export { toast };
export default toast;
