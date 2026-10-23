import { describe, it, expect, beforeEach } from 'vitest';
import api from './axiosConfig';

describe('axiosConfig Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create axios instance with correct baseURL', () => {
    expect(api.defaults.baseURL).toBe('http://localhost:5000/api');
  });

  it('should add authorization token to requests when token exists', async () => {
    localStorage.setItem('authToken', 'test-token-123');

    const response = await api.get('/test', {
      adapter: (config) =>
        Promise.resolve({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
    });

    expect(response.config.headers.Authorization).toBe('Bearer test-token-123');
  });

  it('should not add authorization header when no token exists', async () => {
    const response = await api.get('/test', {
      adapter: (config) =>
        Promise.resolve({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
    });

    expect(response.config.headers.Authorization).toBeUndefined();
  });

  it('should pass through request config unchanged when token exists', async () => {
    localStorage.setItem('authToken', 'my-token');

    const response = await api.get('/incidents', {
      headers: { 'Content-Type': 'application/json' },
      adapter: (config) =>
        Promise.resolve({
          data: null,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
    });

    expect(response.config.method).toBe('get');
    expect(response.config.url).toBe('/incidents');
    expect(response.config.headers['Content-Type']).toBe('application/json');
  });

  it('should reject errors in the request interceptor', async () => {
    const mockError = new Error('Request error');
    const interceptor = api.interceptors.request.handlers.find(
      ({ fulfilled, rejected }) => fulfilled && rejected
    );

    await expect(interceptor.rejected(mockError)).rejects.toBe(mockError);
  });

  it('should export the configured api instance', () => {
    expect(api).toBeDefined();
  });
});
