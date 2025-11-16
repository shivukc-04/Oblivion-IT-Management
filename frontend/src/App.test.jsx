import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from './App';
import { jwtDecode } from 'jwt-decode';

vi.mock('jwt-decode');

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render main landing page', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText(/IT Infrastructure/)).toBeInTheDocument();
    expect(screen.getByText(/Management System/)).toBeInTheDocument();
  });

  it('should display features section', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Powerful Features')).toBeInTheDocument();
    expect(screen.getByText('Incident Management')).toBeInTheDocument();
    expect(screen.getByText('Server Management')).toBeInTheDocument();
  });

  it('should display CTA section with Start Now button', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start now/i })).toBeInTheDocument();
  });

  it('should show login button when user not logged in', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    const dashboardButtons = screen.getAllByRole('button', {
      name: /dashboard/i,
    });
    expect(dashboardButtons.length).toBeGreaterThan(0);
  });

  it('should show user info and logout when logged in', async () => {
    const mockUser = {
      id: 'abc123',
      email: 'test@example.com',
      role: 'admin',
    };

    jwtDecode.mockReturnValue(mockUser);
    localStorage.setItem('authToken', 'test-token');

    const { rerender } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should display quick links section', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('View All Incidents')).toBeInTheDocument();
    expect(screen.getByText('Create Incident')).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText('OBLIVION')).toBeInTheDocument();
  });

  it('should display footer', () => {
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    expect(screen.getByText(/© 2025 Oblivion/)).toBeInTheDocument();
  });

  it('should handle scroll state changes', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    // Simulate scroll
    window.scrollY = 100;
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => {
      expect(screen.getByText(/IT Infrastructure/)).toBeInTheDocument();
    });
  });

  it('should have logout button that clears localStorage', async () => {
    const mockUser = {
      id: 'abc123',
      email: 'test@example.com',
      role: 'admin',
    };

    jwtDecode.mockReturnValue(mockUser);
    localStorage.setItem('authToken', 'test-token');

    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    await user.click(logoutButton);

    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('should remove invalid token from localStorage on mount', async () => {
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    localStorage.setItem('authToken', 'invalid-token');

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  it('should show user role in navigation', async () => {
    const mockUser = {
      id: 'abc123',
      email: 'admin@example.com',
      role: 'admin',
    };

    jwtDecode.mockReturnValue(mockUser);
    localStorage.setItem('authToken', 'test-token');

    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText(/admin/i)).toBeInTheDocument();
    });
  });
});
