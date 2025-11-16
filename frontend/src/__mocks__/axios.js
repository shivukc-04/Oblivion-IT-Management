import axios from 'axios';
import { vi } from 'vitest';

// Mock axios
vi.mock('axios');

export const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  },
};

axios.create.mockReturnValue(mockAxiosInstance);

export default mockAxiosInstance;
