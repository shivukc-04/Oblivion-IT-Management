import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import api from './axiosConfig';

vi.mock('axios');

describe('axiosConfig Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should create axios instance with correct baseURL', () => {
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://localhost:5250/api',
      })
    );
  });

  it('should add authorization token to requests when token exists', () => {
    localStorage.setItem(
      'authToken',
      'test-token-123'
    );

    const mockConfig = { headers: {} };
    const interceptor = axios.create.mock.results[0].value.interceptors.request
      .use.mock.calls[0][0];

    const result = interceptor(mockConfig);

    expect(result.headers.Authorization).toBe('Bearer test-token-123');
  });

  it('should not add authorization header when no token exists', () => {
    localStorage.removeItem('authToken');

    const mockConfig = { headers: {} };
    const interceptor = axios.create.mock.results[0].value.interceptors.request
      .use.mock.calls[0][0];

    const result = interceptor(mockConfig);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should pass through config unchanged when token exists', () => {
    localStorage.setItem('authToken', 'my-token');

    const mockConfig = {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
      url: '/incidents',
    };

    const interceptor = axios.create.mock.results[0].value.interceptors.request
      .use.mock.calls[0][0];

    const result = interceptor(mockConfig);

    expect(result.method).toBe('GET');
    expect(result.url).toBe('/incidents');
    expect(result.headers['Content-Type']).toBe('application/json');
  });

  it('should handle error in request interceptor', () => {
    const mockError = new Error('Request error');
    const interceptor = axios.create.mock.results[0].value.interceptors.request
      .use.mock.calls[0][1];

    expect(() => interceptor(mockError)).toThrow('Request error');
  });

  it('should export the configured api instance', () => {
    expect(api).toBeDefined();
  });
});
