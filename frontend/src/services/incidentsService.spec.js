import { describe, it, expect, beforeEach, vi } from 'vitest';
import incidentsService from './incidentsService';
import api from './axiosConfig';

vi.mock('./axiosConfig');

describe('incidentsService', () => {
  const mockIncident = {
    _id: '123',
    title: 'Test Incident',
    description: 'Test Description',
    severity: 'high',
    status: 'open',
  };

  const mockIncidents = [mockIncident];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllIncidents', () => {
    it('should fetch all incidents successfully', async () => {
      api.get.mockResolvedValue({ data: mockIncidents });

      const result = await incidentsService.getAllIncidents();

      expect(api.get).toHaveBeenCalledWith('/incidents');
      expect(result).toEqual(mockIncidents);
    });

    it('should throw error with custom message on failure', async () => {
      api.get.mockRejectedValue({
        response: {
          data: { message: 'Failed to fetch' },
        },
      });

      await expect(incidentsService.getAllIncidents()).rejects.toThrow(
        'Failed to fetch'
      );
    });

    it('should throw error with default message on failure without custom message', async () => {
      api.get.mockRejectedValue({
        response: {
          data: {},
        },
      });

      await expect(incidentsService.getAllIncidents()).rejects.toThrow(
        'Failed to fetch incidents'
      );
    });

    it('should throw error when response is missing', async () => {
      api.get.mockRejectedValue(new Error('Network error'));

      await expect(incidentsService.getAllIncidents()).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getIncidentById', () => {
    it('should fetch incident by id successfully', async () => {
      api.get.mockResolvedValue({ data: mockIncident });

      const result = await incidentsService.getIncidentById('123');

      expect(api.get).toHaveBeenCalledWith('/incidents/123');
      expect(result).toEqual(mockIncident);
    });

    it('should throw error on failure', async () => {
      api.get.mockRejectedValue({
        response: {
          data: { message: 'Incident not found' },
        },
      });

      await expect(incidentsService.getIncidentById('999')).rejects.toThrow(
        'Incident not found'
      );
    });
  });

  describe('createIncident', () => {
    it('should create incident successfully', async () => {
      const payload = {
        title: 'New Incident',
        description: 'Description',
        severity: 'medium',
      };

      api.post.mockResolvedValue({ data: mockIncident });

      const result = await incidentsService.createIncident(payload);

      expect(api.post).toHaveBeenCalledWith('/incidents', payload);
      expect(result).toEqual(mockIncident);
    });

    it('should pass payload correctly to api.post', async () => {
      const payload = { title: 'Test', severity: 'low' };
      api.post.mockResolvedValue({ data: mockIncident });

      await incidentsService.createIncident(payload);

      expect(api.post).toHaveBeenCalledWith('/incidents', payload);
    });
  });

  describe('updateIncident', () => {
    it('should update incident successfully', async () => {
      const payload = { status: 'closed' };
      const updatedIncident = { ...mockIncident, ...payload };

      api.put.mockResolvedValue({ data: updatedIncident });

      const result = await incidentsService.updateIncident('123', payload);

      expect(api.put).toHaveBeenCalledWith('/incidents/123', payload);
      expect(result).toEqual(updatedIncident);
    });

    it('should throw error on update failure', async () => {
      api.put.mockRejectedValue({
        response: {
          data: { message: 'Cannot update incident' },
        },
      });

      await expect(
        incidentsService.updateIncident('123', {})
      ).rejects.toThrow('Cannot update incident');
    });
  });

  describe('deleteIncident', () => {
    it('should delete incident successfully', async () => {
      const response = { message: 'Deleted successfully' };
      api.delete.mockResolvedValue({ data: response });

      const result = await incidentsService.deleteIncident('123');

      expect(api.delete).toHaveBeenCalledWith('/incidents/123');
      expect(result).toEqual(response);
    });

    it('should throw error on delete failure', async () => {
      api.delete.mockRejectedValue({
        response: {
          data: { message: 'Cannot delete incident' },
        },
      });

      await expect(incidentsService.deleteIncident('123')).rejects.toThrow(
        'Cannot delete incident'
      );
    });
  });
});
