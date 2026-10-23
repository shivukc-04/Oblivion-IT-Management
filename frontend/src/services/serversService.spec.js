import { describe, it, expect, beforeEach, vi } from 'vitest';
import serversService from './serversService';
import api from './axiosConfig';

vi.mock('./axiosConfig');

describe('serversService', () => {
  const mockServer = {
    _id: '507f1f77bcf86cd799439011',
    serverId: '111',
    ip: '192.168.1.100',
    status: 'active',
    addedBy: 'admin',
  };

  const mockServers = [mockServer];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getServers', () => {
    it('should fetch all servers successfully', async () => {
      api.get.mockResolvedValue({ data: mockServers });

      const result = await serversService.getServers();

      expect(api.get).toHaveBeenCalledWith('/servers');
      expect(result).toEqual(mockServers);
    });

    it('should return empty array when no servers exist', async () => {
      api.get.mockResolvedValue({ data: [] });

      const result = await serversService.getServers();

      expect(result).toEqual([]);
    });

    it('should throw error on network failure', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(serversService.getServers()).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('createServer', () => {
    it('should create server successfully', async () => {
      const payload = {
        serverId: '111',
        ip: '192.168.1.100',
        status: 'active',
      };

      api.post.mockResolvedValue({ data: mockServer });

      const result = await serversService.createServer(payload);

      expect(api.post).toHaveBeenCalledWith('/servers', payload);
      expect(result).toEqual(mockServer);
    });

    it('should pass all server fields', async () => {
      const payload = {
        serverId: 'server-123',
        ip: '10.0.0.1',
        status: 'inactive',
      };

      api.post.mockResolvedValue({ data: { ...mockServer, ...payload } });

      await serversService.createServer(payload);

      expect(api.post).toHaveBeenCalledWith('/servers', payload);
    });

    it('should throw error on creation failure', async () => {
      api.post.mockRejectedValue(new Error('Server creation failed'));

      await expect(
        serversService.createServer({ serverId: '999', ip: '1.1.1.1' })
      ).rejects.toThrow('Server creation failed');
    });
  });

  describe('deleteServer', () => {
    it('should delete server successfully', async () => {
      const response = { message: 'Server deleted' };
      api.delete.mockResolvedValue({ data: response });

      const result = await serversService.deleteServer('507f1f77bcf86cd799439011');

      expect(api.delete).toHaveBeenCalledWith(
        '/servers/507f1f77bcf86cd799439011'
      );
      expect(result).toEqual(response);
    });

    it('should throw error on deletion failure', async () => {
      api.delete.mockRejectedValue(new Error('Cannot delete server'));

      await expect(serversService.deleteServer('999')).rejects.toThrow(
        'Cannot delete server'
      );
    });

    it('should handle server not found error', async () => {
      api.delete.mockRejectedValue(new Error('Server not found'));

      await expect(serversService.deleteServer('nonexistent')).rejects.toThrow(
        'Server not found'
      );
    });
  });
});
