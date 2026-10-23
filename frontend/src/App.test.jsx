import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, useLocation } from 'react-router-dom';
import App from './App';
import api from './services/axiosConfig';
import { toast } from 'react-hot-toast';

vi.mock('./services/axiosConfig', () => ({
  default: { get: vi.fn() },
}));
vi.mock('react-hot-toast', () => import('./__mocks__/react-hot-toast.js'));

function LocationDisplay() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderApp() {
  return render(
    <MemoryRouter>
      <App />
      <LocationDisplay />
    </MemoryRouter>
  );
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the user-list action', () => {
    renderApp();

    expect(
      screen.getByRole('button', { name: /show all users/i })
    ).toBeInTheDocument();
  });

  it('fetches and displays users when requested', async () => {
    const user = userEvent.setup();
    api.get.mockResolvedValue({
      data: [{ userId: 'alice' }, { userId: 'bob' }],
    });
    renderApp();

    await user.click(screen.getByRole('button', { name: /show all users/i }));

    expect(api.get).toHaveBeenCalledWith('/users');
    expect(await screen.findByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('notifies and navigates to login when the request is unauthorized', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValue({ response: { status: 401 } });
    renderApp();

    await user.click(screen.getByRole('button', { name: /show all users/i }));

    expect(toast.error).toHaveBeenCalledWith('You are not logged in');
    expect(await screen.findByTestId('location')).toHaveTextContent('/login');
  });

  it('notifies and navigates to login when the token is forbidden', async () => {
    const user = userEvent.setup();
    api.get.mockRejectedValue({ response: { status: 403 } });
    renderApp();

    await user.click(screen.getByRole('button', { name: /show all users/i }));

    expect(toast.error).toHaveBeenCalledWith('Token Expired. Login Again');
    expect(await screen.findByTestId('location')).toHaveTextContent('/login');
  });

  it('logs other request errors without navigating', async () => {
    const user = userEvent.setup();
    const error = { response: { status: 500 } };
    api.get.mockRejectedValue(error);
    renderApp();

    await user.click(screen.getByRole('button', { name: /show all users/i }));

    expect(console.error).toHaveBeenCalledWith('Error:', error);
    expect(screen.getByTestId('location')).toHaveTextContent('/');
  });
});
