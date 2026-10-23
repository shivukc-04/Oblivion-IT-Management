import { vi } from 'vitest';

const interceptors = {
  request: { use: vi.fn(), eject: vi.fn() },
  response: { use: vi.fn(), eject: vi.fn() },
};

const mockAxios = {
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  patch: vi.fn().mockResolvedValue({ data: {} }),
  delete: vi.fn().mockResolvedValue({ data: {} }),
  head: vi.fn().mockResolvedValue({ data: {} }),
  options: vi.fn().mockResolvedValue({ data: {} }),
  request: vi.fn().mockResolvedValue({ data: {} }),
  interceptors,

  // Helper utility methods
  all: vi.fn((promises) => Promise.all(promises)),
  spread: vi.fn((callback) => (arr) => callback(...arr)),
  // Return self on create() so method calls on custom instances stay mocked
  create: vi.fn(),
};

mockAxios.create.mockReturnValue(mockAxios);

export default mockAxios;