import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import axios from 'axios';
import { toast } from 'react-hot-toast';

vi.mock('axios', () => import('../__mocks__/axios.js'));
vi.mock('react-hot-toast', () => import('../__mocks__/react-hot-toast.js'));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render login form', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your user ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your password')).toBeInTheDocument();
  });

  it('should update user ID input field', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const userIdInput = screen.getByPlaceholderText('Type your user ID');
    await user.type(userIdInput, 'testuser');

    expect(userIdInput.value).toBe('testuser');
  });

  it('should update password input field', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText('Type your password');
    await user.type(passwordInput, 'password123');

    expect(passwordInput.value).toBe('password123');
  });

  it('should show error when fields are empty', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const loginButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(loginButton);

    expect(toast.error).toHaveBeenCalledWith('Required fields are empty');
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      data: {
        token: 'test-token',
        user: { id: '123', role: 'admin', email: 'test@example.com' },
      },
    };

    axios.post.mockResolvedValue(mockResponse);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(
      screen.getByPlaceholderText('Type your user ID'),
      'testuser'
    );
    await user.type(
      screen.getByPlaceholderText('Type your password'),
      'password123'
    );

    const loginButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(loginButton);

    await waitFor(() => {
      expect(localStorage.getItem('authToken')).toBe('test-token');
      expect(toast.success).toHaveBeenCalledWith('You are logged in');
    });
  });

  it('should handle 401 error', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(
      screen.getByPlaceholderText('Type your user ID'),
      'wronguser'
    );
    await user.type(
      screen.getByPlaceholderText('Type your password'),
      'wrongpass'
    );

    const loginButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(loginButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'User ID or password is incorrect'
      );
    });
  });

  it('should handle 404 error', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue({
      response: {
        status: 404,
      },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(
      screen.getByPlaceholderText('Type your user ID'),
      'testuser'
    );
    await user.type(
      screen.getByPlaceholderText('Type your password'),
      'password123'
    );

    const loginButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(loginButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Unable to login. Please try again later.'
      );
    });
  });

  it('should handle generic error', async () => {
    const user = userEvent.setup();
    axios.post.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(
      screen.getByPlaceholderText('Type your user ID'),
      'testuser'
    );
    await user.type(
      screen.getByPlaceholderText('Type your password'),
      'password123'
    );

    const loginButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(loginButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Something went wrong');
    });
  });

  it('should trim whitespace from inputs', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const userIdInput = screen.getByPlaceholderText('Type your user ID');
    await user.type(userIdInput, '   ');

    const loginButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(loginButton);

    expect(toast.error).toHaveBeenCalledWith('Required fields are empty');
  });

  it('should show back link to home', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const backLink = screen.getByText('Back to Home');
    expect(backLink).toBeInTheDocument();
  });
});