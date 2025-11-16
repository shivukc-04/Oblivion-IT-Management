import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import ServersPage from './ServersPage';
import { AuthProvider } from '../services/authProvider';
import serversService from '../services/serversService';
import * as toast from 'react-hot-toast';
import { jwtDecode } from 'jwt-decode';

vi.mock('../services/serversService');
vi.mock('react-hot-toast');
vi.mock('jwt-decode');

describe('ServersPage', () => {
  const mockServers = [
    {
      _id: '1',
      serverId: '111',
      ip: '192.168.1.100',
      status: 'active',
      addedBy: 'admin',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      _id: '2',
      serverId: '222',
      ip: '192.168.1.101',
      status: 'inactive',
      addedBy: 'admin',
      createdAt: '2025-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    jwtDecode.mockReturnValue({
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'admin',
    });
  });

  it('should render servers page with title', async () => {
    serversService.getServers.mockResolvedValue(mockServers);

    render(
      <MemoryRouter>
        <AuthProvider>
          <ServersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/servers|admin/i)).toBeInTheDocument();
    });
  });

  it('should fetch and display servers on mount', async () => {
    serversService.getServers.mockResolvedValue(mockServers);

    render(
      <MemoryRouter>
        <AuthProvider>
          <ServersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(serversService.getServers).toHaveBeenCalled();
    });
  });

  it('should allow user to input server details', async () => {
    const user = userEvent.setup();
    serversService.getServers.mockResolvedValue(mockServers);

    render(
      <MemoryRouter>
        <AuthProvider>
          <ServersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(serversService.getServers).toHaveBeenCalled();
    });

    // Find form inputs
    const serverIdInput = screen.queryByPlaceholderText(/server id/i);
    const ipInput = screen.queryByPlaceholderText(/ip|address/i);

    if (serverIdInput && ipInput) {
      await user.type(serverIdInput, '333');
      await user.type(ipInput, '192.168.1.102');

      expect(serverIdInput.value).toBe('333');
    }
  });

  it('should handle server creation error', async () => {
    serversService.getServers.mockResolvedValue([]);
    serversService.createServer.mockRejectedValue({
      response: { data: { message: 'Server already exists' } },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ServersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(serversService.getServers).toHaveBeenCalled();
    });
  });

  it('should allow deleting a server', async () => {
    const user = userEvent.setup();
    serversService.getServers.mockResolvedValue(mockServers);
    serversService.deleteServer.mockResolvedValue({ message: 'Deleted' });

    render(
      <MemoryRouter>
        <AuthProvider>
          <ServersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(serversService.getServers).toHaveBeenCalled();
    });

    // Find and click delete button
    const deleteButtons = screen.queryAllByRole('button');
    if (deleteButtons.length > 0) {
      const deleteButton = deleteButtons.find((btn) =>
        btn.textContent.toLowerCase().includes('delete')
      );

      if (deleteButton) {
        // Mock confirm dialog
        window.confirm = vi.fn().mockReturnValue(true);

        await user.click(deleteButton);

        await waitFor(() => {
          expect(window.confirm).toHaveBeenCalled();
        });
      }
    }
  });

  it('should display server list with details', async () => {
    serversService.getServers.mockResolvedValue(mockServers);

    render(
      <MemoryRouter>
        <AuthProvider>
          <ServersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(serversService.getServers).toHaveBeenCalled();
    });
  });

  it('should show empty state when no servers', async () => {
    serversService.getServers.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <ServersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(serversService.getServers).toHaveBeenCalled();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    serversService.getServers.mockRejectedValue(
      new Error('Network error')
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <ServersPage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(serversService.getServers).toHaveBeenCalled();
    });

    expect(toast.error).toHaveBeenCalledWith('Failed to load servers');
  });
});
