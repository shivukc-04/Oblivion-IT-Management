import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import RoleRoute from './RoleRoute';
import { AuthContext } from '../services/authContext';
import * as toast from 'react-hot-toast';

vi.mock('react-hot-toast');

describe('RoleRoute Component', () => {
  const mockContextValue = (user = null, loading = false) => ({
    user,
    loading,
  });

  const renderWithAuth = (component, contextValue) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={contextValue}>
          {component}
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  it('should show loading state when loading is true', () => {
    const contextValue = mockContextValue(null, true);
    renderWithAuth(
      <RoleRoute allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleRoute>,
      contextValue
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    const contextValue = mockContextValue(null, false);
    renderWithAuth(
      <RoleRoute allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleRoute>,
      contextValue
    );

    expect(toast.error).toHaveBeenCalledWith('Please login first');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should redirect to home when user role is not allowed', () => {
    const contextValue = mockContextValue(
      { role: 'user', email: 'user@example.com', id: '123' },
      false
    );
    renderWithAuth(
      <RoleRoute allowedRoles={['admin', 'operator']}>
        <div>Protected Content</div>
      </RoleRoute>,
      contextValue
    );

    expect(toast.error).toHaveBeenCalledWith('Access denied: insufficient role');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render children when user has allowed role', () => {
    const contextValue = mockContextValue(
      { role: 'admin', email: 'admin@example.com', id: '123' },
      false
    );
    renderWithAuth(
      <RoleRoute allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleRoute>,
      contextValue
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render children with multiple allowed roles', () => {
    const contextValue = mockContextValue(
      { role: 'operator', email: 'op@example.com', id: '456' },
      false
    );
    renderWithAuth(
      <RoleRoute allowedRoles={['admin', 'operator']}>
        <div>Protected Content</div>
      </RoleRoute>,
      contextValue
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should use empty allowedRoles array as default', () => {
    const contextValue = mockContextValue(
      { role: 'user', email: 'user@example.com', id: '789' },
      false
    );
    renderWithAuth(
      <RoleRoute>
        <div>Protected Content</div>
      </RoleRoute>,
      contextValue
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should perform case-sensitive role matching', () => {
    const contextValue = mockContextValue(
      { role: 'Admin', email: 'admin@example.com', id: '123' },
      false
    );
    renderWithAuth(
      <RoleRoute allowedRoles={['admin']}>
        <div>Protected Content</div>
      </RoleRoute>,
      contextValue
    );

    expect(toast.error).toHaveBeenCalled();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
