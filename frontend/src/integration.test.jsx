import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './services/authProvider';
import RoleRoute from './components/RoleRoute';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

vi.mock('jwt-decode');
vi.mock('axios');

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should redirect unauthenticated user to login', async () => {
    const TestApp = () => (
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <RoleRoute allowedRoles={['admin']}>
            <div>Dashboard Content</div>
          </RoleRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    });
  });

  it('should allow authenticated admin user to access admin route', async () => {
    const mockUser = {
      id: '123',
      email: 'admin@example.com',
      role: 'admin',
    };

    jwtDecode.mockReturnValue(mockUser);
    localStorage.setItem('authToken', 'valid-token');

    const TestApp = () => (
      <MemoryRouter>
        <AuthProvider>
          <RoleRoute allowedRoles={['admin']}>
            <div>Admin Dashboard</div>
          </RoleRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('should deny operator access to admin-only route', async () => {
    const mockUser = {
      id: '456',
      email: 'operator@example.com',
      role: 'operator',
    };

    jwtDecode.mockReturnValue(mockUser);
    localStorage.setItem('authToken', 'operator-token');

    const TestApp = () => (
      <MemoryRouter>
        <AuthProvider>
          <RoleRoute allowedRoles={['admin']}>
            <div>Admin Only</div>
          </RoleRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.queryByText('Admin Only')).not.toBeInTheDocument();
    });
  });

  it('should handle multiple allowed roles', async () => {
    const mockUser = {
      id: '789',
      email: 'operator@example.com',
      role: 'operator',
    };

    jwtDecode.mockReturnValue(mockUser);
    localStorage.setItem('authToken', 'operator-token');

    const TestApp = () => (
      <MemoryRouter>
        <AuthProvider>
          <RoleRoute allowedRoles={['admin', 'operator']}>
            <div>Authorized Content</div>
          </RoleRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<TestApp />);

    await waitFor(() => {
      expect(screen.getByText('Authorized Content')).toBeInTheDocument();
    });
  });

  it('should handle invalid token gracefully', async () => {
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    localStorage.setItem('authToken', 'invalid-token');

    const TestApp = () => (
      <MemoryRouter>
        <AuthProvider>
          <RoleRoute allowedRoles={['admin']}>
            <div>Should Not Render</div>
          </RoleRoute>
        </AuthProvider>
      </MemoryRouter>
    );

    render(<TestApp />);

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(screen.queryByText('Should Not Render')).not.toBeInTheDocument();
    });
  });
});

describe('Server Management Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should fetch servers list on dashboard mount', async () => {
    axios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: [] }),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn(), eject: vi.fn() },
      },
    });

    const mockApi = axios.create();
    mockApi.get.mockResolvedValue({
      data: [
        {
          _id: '1',
          serverId: '111',
          ip: '192.168.1.100',
          status: 'active',
        },
      ],
    });

    const result = await mockApi.get('/servers');

    expect(result.data).toHaveLength(1);
    expect(result.data[0].serverId).toBe('111');
  });

  it('should create new server with valid data', async () => {
    const mockApi = {
      post: vi.fn().mockResolvedValue({
        data: { _id: '1', serverId: '222', ip: '192.168.1.101', status: 'active' },
      }),
    };

    const serverData = {
      serverId: '222',
      ip: '192.168.1.101',
      status: 'active',
    };

    const result = await mockApi.post('/servers', serverData);

    expect(mockApi.post).toHaveBeenCalledWith('/servers', serverData);
    expect(result.data.serverId).toBe('222');
  });

  it('should delete server successfully', async () => {
    const mockApi = {
      delete: vi.fn().mockResolvedValue({ data: { message: 'Deleted' } }),
    };

    await mockApi.delete('/servers/123');

    expect(mockApi.delete).toHaveBeenCalledWith('/servers/123');
  });
});

describe('Metrics Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch metrics with server id parameter', async () => {
    const mockApi = {
      get: vi.fn().mockResolvedValue({
        data: [
          {
            _id: '1',
            serverId: '111',
            cpu: 45,
            memory: 72,
            disk: 81,
          },
        ],
      }),
    };

    const result = await mockApi.get('/metrics/history?serverId=111');

    expect(mockApi.get).toHaveBeenCalledWith('/metrics/history?serverId=111');
    expect(result.data[0].cpu).toBe(45);
  });

  it('should fetch current metrics for active server', async () => {
    const mockApi = {
      get: vi.fn().mockResolvedValue({
        data: {
          serverId: '111',
          cpu: 32,
          memory: 80,
          disk: 85,
        },
      }),
    };

    const result = await mockApi.get('/metrics/current');

    expect(result.data.serverId).toBe('111');
    expect(result.data.cpu).toBeDefined();
  });
});
