import { describe, it, expect, beforeEach, vi } from 'vitest';
import auditService from './AuditService';
import api from './axiosConfig';

vi.mock('./axiosConfig');

describe('AuditService', () => {
  const mockLog = {
    _id: '507f1f77bcf86cd799439030',
    userId: 'admin-id',
    action: 'CREATE',
    resource: 'incident',
    resourceId: '507f1f77bcf86cd799439020',
    changes: { title: 'Test Incident' },
    ipAddress: '192.168.1.1',
    createdAt: '2025-01-01T00:00:00Z',
  };

  const mockLogs = [mockLog];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllLogs', () => {
    it('should fetch all audit logs successfully', async () => {
      api.get.mockResolvedValue({ data: mockLogs });

      const result = await auditService.getAllLogs();

      expect(api.get).toHaveBeenCalledWith('/audit/logs', { params: {} });
      expect(result).toEqual(mockLogs);
    });

    it('should pass filter params to API', async () => {
      const params = { action: 'CREATE', resource: 'incident' };
      api.get.mockResolvedValue({ data: mockLogs });

      await auditService.getAllLogs(params);

      expect(api.get).toHaveBeenCalledWith('/audit/logs', { params });
    });

    it('should handle empty result', async () => {
      api.get.mockResolvedValue({ data: [] });

      const result = await auditService.getAllLogs();

      expect(result).toEqual([]);
    });

    it('should throw error on API failure', async () => {
      api.get.mockRejectedValue(new Error('API error'));

      await expect(auditService.getAllLogs()).rejects.toThrow('API error');
    });
  });

  describe('getUserLogs', () => {
    it('should fetch user logs successfully with default limit', async () => {
      api.get.mockResolvedValue({ data: mockLogs });

      const result = await auditService.getUserLogs('admin-id');

      expect(api.get).toHaveBeenCalledWith('/audit/user/admin-id', {
        params: { limit: 50 },
      });
      expect(result).toEqual(mockLogs);
    });

    it('should fetch user logs with custom limit', async () => {
      api.get.mockResolvedValue({ data: mockLogs });

      await auditService.getUserLogs('admin-id', 100);

      expect(api.get).toHaveBeenCalledWith('/audit/user/admin-id', {
        params: { limit: 100 },
      });
    });

    it('should throw error when user not found', async () => {
      api.get.mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'User not found' },
        },
      });

      await expect(auditService.getUserLogs('nonexistent')).rejects.toThrow();
    });
  });

  describe('getStats', () => {
    it('should fetch audit statistics successfully', async () => {
      const mockStats = {
        totalActions: 1234,
        actionsByType: { CREATE: 500, UPDATE: 400, DELETE: 334 },
        recentActionsCount: 45,
      };

      api.get.mockResolvedValue({ data: mockStats });

      const result = await auditService.getStats();

      expect(api.get).toHaveBeenCalledWith('/audit/stats');
      expect(result).toEqual(mockStats);
    });

    it('should throw error on stats retrieval failure', async () => {
      api.get.mockRejectedValue(new Error('Stats unavailable'));

      await expect(auditService.getStats()).rejects.toThrow(
        'Stats unavailable'
      );
    });
  });
});
