import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import api from '../../services/axiosConfig'
import serversApi from '../../services/serversService'

vi.mock('../../services/axiosConfig', () => ({
  default: { get: vi.fn() },
}))
vi.mock('../../services/serversService', () => ({
  default: { getServers: vi.fn() },
}))

describe('Dashboard fallback server', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((path) => {
      if (path === '/metrics/current') {
        return Promise.resolve({
          data: [{ serverId: 'main-server', cpu: 42, memory: 64, disk: 81 }],
        })
      }
      if (path === '/metrics/history?serverId=main-server') {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: [] })
    })
  })

  it.each([
    ['an empty server list', () => Promise.resolve([])],
    ['a server-list error', () => Promise.reject(new Error('Forbidden'))],
  ])('uses telemetry for main-server when server list returns %s', async (_case, getServers) => {
    serversApi.getServers.mockImplementation(getServers)

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    expect(await screen.findByText('Server ID:')).toBeInTheDocument()
    expect(screen.getByText('main-server')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getAllByText(/main-server - (CPU|Memory|Disk)/)).toHaveLength(3)
      expect(screen.queryAllByText('No data')).toHaveLength(0)
    })
    expect(api.get).toHaveBeenCalledWith('/metrics/history?serverId=main-server')
  })
})
