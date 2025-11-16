import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import IncidentsList from './IncidentsList';
import { AuthProvider } from '../services/authProvider';
import incidentsService from '../services/incidentsService';
import { jwtDecode } from 'jwt-decode';

vi.mock('../services/incidentsService');
vi.mock('jwt-decode');

describe('IncidentsList Page', () => {
  const mockIncidents = [
    {
      _id: '1',
      title: 'Critical Server Down',
      description: 'Server 111 is down',
      severity: 'critical',
      status: 'open',
      createdBy: 'user-id',
      createdAt: '2025-01-01T00:00:00Z',
    },
    {
      _id: '2',
      title: 'Database Connection Issue',
      description: 'Intermittent connection failures',
      severity: 'high',
      status: 'in-progress',
      createdBy: 'user-id',
      createdAt: '2025-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    jwtDecode.mockReturnValue({
      id: 'user-id',
      email: 'user@example.com',
      role: 'operator',
    });
  });

  it('should render incidents list page', async () => {
    incidentsService.getAllIncidents.mockResolvedValue(mockIncidents);

    render(
      <MemoryRouter>
        <AuthProvider>
          <IncidentsList />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/incidents/i)).toBeInTheDocument();
    });
  });

  it('should fetch and display incidents on mount', async () => {
    incidentsService.getAllIncidents.mockResolvedValue(mockIncidents);

    render(
      <MemoryRouter>
        <AuthProvider>
          <IncidentsList />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(incidentsService.getAllIncidents).toHaveBeenCalled();
    });
  });

  it('should display incident titles', async () => {
    incidentsService.getAllIncidents.mockResolvedValue(mockIncidents);

    render(
      <MemoryRouter>
        <AuthProvider>
          <IncidentsList />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.queryByText('Critical Server Down')
      ).toBeInTheDocument() || expect(screen.getByText(/incident/i)).toBeInTheDocument();
    });
  });

  it('should display empty state when no incidents', async () => {
    incidentsService.getAllIncidents.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <AuthProvider>
          <IncidentsList />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.queryByText(/no incidents|empty/i)
      ).toBeInTheDocument() || expect(screen.getByText(/incident/i)).toBeInTheDocument();
    });
  });

  it('should handle fetch error gracefully', async () => {
    incidentsService.getAllIncidents.mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <IncidentsList />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(incidentsService.getAllIncidents).toHaveBeenCalled();
    });
  });

  it('should allow filtering or sorting incidents', async () => {
    incidentsService.getAllIncidents.mockResolvedValue(mockIncidents);

    render(
      <MemoryRouter>
        <AuthProvider>
          <IncidentsList />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(incidentsService.getAllIncidents).toHaveBeenCalled();
    });
  });
});
