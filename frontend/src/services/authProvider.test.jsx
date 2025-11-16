import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from './authProvider';
import { AuthContext } from './authContext';
import { jwtDecode } from 'jwt-decode';

vi.mock('jwt-decode');

describe('AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should provide user and loading context', () => {
    let contextValue = null;

    const TestComponent = () => {
      contextValue = React.useContext(AuthContext);
      return <div>Test</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(contextValue).toHaveProperty('user');
    expect(contextValue).toHaveProperty('loading');
  });

  it('should set loading to false after mount', async () => {
    let contextValue = null;

    const TestComponent = () => {
      contextValue = React.useContext(AuthContext);
      return <div>{contextValue.loading ? 'Loading' : 'Loaded'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.loading).toBe(false);
    });
  });

  it('should decode and set user from localStorage token', async () => {
    const mockDecodedUser = {
      id: '123',
      email: 'test@example.com',
      role: 'admin',
    };

    jwtDecode.mockReturnValue(mockDecodedUser);

    localStorage.setItem('authToken', 'valid-token');

    let contextValue = null;

    const TestComponent = () => {
      contextValue = React.useContext(AuthContext);
      return <div>{contextValue.user?.email}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.user).toEqual(mockDecodedUser);
    });
  });

  it('should set user to null when no token exists', async () => {
    localStorage.removeItem('authToken');

    let contextValue = null;

    const TestComponent = () => {
      contextValue = React.useContext(AuthContext);
      return <div>{contextValue.user === null ? 'No User' : 'Has User'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.user).toBeNull();
    });
  });

  it('should remove invalid token from localStorage', async () => {
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    localStorage.setItem('authToken', 'invalid-token');

    render(
      <AuthProvider>
        <div>Test</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  it('should render children', () => {
    render(
      <AuthProvider>
        <div>Child Content</div>
      </AuthProvider>
    );

    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should handle decode error gracefully', async () => {
    jwtDecode.mockImplementation(() => {
      throw new Error('Decode error');
    });

    localStorage.setItem('authToken', 'bad-token');

    let contextValue = null;

    const TestComponent = () => {
      contextValue = React.useContext(AuthContext);
      return <div>Ready</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(contextValue.user).toBeNull();
    });
  });
});
