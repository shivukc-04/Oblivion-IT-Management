import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock modules before importing them
const mockCreate = jest.fn();
const mockFind = jest.fn();
const mockFindById = jest.fn();
const mockSave = jest.fn();
const mockDeleteOne = jest.fn();
const mockPopulate = jest.fn();
const mockSort = jest.fn();
const mockUserFindById = jest.fn();

// Mock Incident model
jest.unstable_mockModule('../../src/models/incident.js', () => ({
  default: {
    create: mockCreate,
    find: mockFind,
    findById: mockFindById
  }
}));

// Mock User model
jest.unstable_mockModule('../../src/models/user.js', () => ({
  default: {
    findById: mockUserFindById
  }
}));

// Import after mocking
const {
  createIncident,
  getAllIncidents,
  getIncidentById,
  updateIncident,
  deleteIncident
} = await import('../../src/controllers/incidentController.js');

describe('IncidentController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockCreate.mockReset();
    mockFind.mockReset();
    mockFindById.mockReset();
    mockSave.mockReset();
    mockDeleteOne.mockReset();
    mockPopulate.mockReset();
    mockSort.mockReset();
    mockUserFindById.mockReset();

    // Setup request and response objects
    req = {
      body: {},
      params: {},
      user: {
        _id: 'mockUserId123',
        userId: 'admin001',
        username: 'adminuser',
        role: 'admin',
        email: 'admin@example.com'
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock environment
    process.env.NODE_ENV = 'test';
  });

  describe('createIncident', () => {
    it('should create a new incident successfully', async () => {
      const mockAssignedUser = {
        _id: 'assignedUserId123',
        username: 'operatoruser',
        email: 'operator@example.com',
        role: 'operator'
      };

      const mockCreatedIncident = {
        _id: 'incidentId123',
        ticketId: 'IT-123456-7890',
        title: 'Server Down',
        description: 'Production server is not responding',
        priority: 'high',
        status: 'open',
        assignedTo: 'assignedUserId123',
        createdBy: 'mockUserId123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockPopulatedIncident = {
        ...mockCreatedIncident,
        assignedTo: mockAssignedUser,
        createdBy: {
          username: 'adminuser',
          email: 'admin@example.com',
          role: 'admin'
        }
      };

      req.body = {
        title: 'Server Down',
        description: 'Production server is not responding',
        priority: 'high',
        assignedTo: 'assignedUserId123'
      };

      mockUserFindById.mockResolvedValue(mockAssignedUser);
      mockCreate.mockResolvedValue(mockCreatedIncident);
      mockFindById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockPopulatedIncident)
        })
      });

      await createIncident(req, res);

      expect(mockUserFindById).toHaveBeenCalledWith('assignedUserId123');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Server Down',
          description: 'Production server is not responding',
          priority: 'high',
          assignedTo: 'assignedUserId123',
          createdBy: 'mockUserId123',
          status: 'open'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockPopulatedIncident);
    });

    it('should create incident with default medium priority when not specified', async () => {
      const mockAssignedUser = {
        _id: 'assignedUserId123',
        username: 'operatoruser',
        email: 'operator@example.com',
        role: 'operator'
      };

      const mockCreatedIncident = {
        _id: 'incidentId123',
        ticketId: 'IT-123456-7890',
        title: 'Minor Issue',
        description: 'Small bug found',
        priority: 'medium',
        status: 'open',
        assignedTo: 'assignedUserId123',
        createdBy: 'mockUserId123'
      };

      req.body = {
        title: 'Minor Issue',
        description: 'Small bug found',
        assignedTo: 'assignedUserId123'
      };

      mockUserFindById.mockResolvedValue(mockAssignedUser);
      mockCreate.mockResolvedValue(mockCreatedIncident);
      mockFindById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockCreatedIncident)
        })
      });

      await createIncident(req, res);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'medium'
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when title is missing', async () => {
      req.body = {
        description: 'Server issue',
        assignedTo: 'assignedUserId123'
      };

      await createIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide title, description, and assignedTo fields'
      });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should return 400 when description is missing', async () => {
      req.body = {
        title: 'Server Down',
        assignedTo: 'assignedUserId123'
      };

      await createIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide title, description, and assignedTo fields'
      });
    });

    it('should return 400 when assignedTo is missing', async () => {
      req.body = {
        title: 'Server Down',
        description: 'Production server is not responding'
      };

      await createIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Please provide title, description, and assignedTo fields'
      });
    });

    it('should return 404 when assigned user does not exist', async () => {
      req.body = {
        title: 'Server Down',
        description: 'Production server is not responding',
        assignedTo: 'nonexistentUserId'
      };

      mockUserFindById.mockResolvedValue(null);

      await createIncident(req, res);

      expect(mockUserFindById).toHaveBeenCalledWith('nonexistentUserId');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Assigned user not found' });
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should return 401 when user is not authenticated', async () => {
      req.user = null;
      req.body = {
        title: 'Server Down',
        description: 'Production server is not responding',
        assignedTo: 'assignedUserId123'
      };

      mockUserFindById.mockResolvedValue({ _id: 'assignedUserId123' });

      await createIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User not authenticated or invalid token'
      });
    });

    it('should return 500 when database error occurs', async () => {
      req.body = {
        title: 'Server Down',
        description: 'Production server is not responding',
        assignedTo: 'assignedUserId123'
      };

      mockUserFindById.mockRejectedValue(new Error('Database error'));

      await createIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while creating incident'
      });
    });
  });

  describe('getAllIncidents', () => {
    it('should get all incidents successfully', async () => {
      const mockIncidents = [
        {
          _id: 'incident1',
          ticketId: 'IT-123456-7890',
          title: 'Server Down',
          description: 'Production server issue',
          status: 'open',
          priority: 'high',
          assignedTo: {
            username: 'operator1',
            email: 'op1@example.com',
            role: 'operator'
          },
          createdBy: {
            username: 'admin1',
            email: 'admin@example.com',
            role: 'admin'
          },
          createdAt: new Date()
        },
        {
          _id: 'incident2',
          ticketId: 'IT-123456-7891',
          title: 'Network Issue',
          description: 'Slow network',
          status: 'inProgress',
          priority: 'medium',
          assignedTo: {
            username: 'operator2',
            email: 'op2@example.com',
            role: 'operator'
          },
          createdBy: {
            username: 'admin1',
            email: 'admin@example.com',
            role: 'admin'
          },
          createdAt: new Date()
        }
      ];

      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockIncidents)
      };

      mockFind.mockReturnValue(mockChain);

      await getAllIncidents(req, res);

      expect(mockFind).toHaveBeenCalledWith({});
      expect(mockChain.populate).toHaveBeenCalledWith('assignedTo', 'username email role');
      expect(mockChain.populate).toHaveBeenCalledWith('createdBy', 'username email role');
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockIncidents);
    });

    it('should return empty array when no incidents exist', async () => {
      const mockChain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);

      await getAllIncidents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 when database error occurs', async () => {
      mockFind.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await getAllIncidents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching incidents'
      });
    });
  });

  describe('getIncidentById', () => {
    it('should get incident by valid ID successfully', async () => {
      const mockIncident = {
        _id: 'validObjectId123',
        ticketId: 'IT-123456-7890',
        title: 'Server Down',
        description: 'Production server issue',
        status: 'open',
        priority: 'high',
        assignedTo: {
          username: 'operator1',
          email: 'op1@example.com',
          role: 'operator'
        },
        createdBy: {
          username: 'admin1',
          email: 'admin@example.com',
          role: 'admin'
        }
      };

      req.params.id = new mongoose.Types.ObjectId().toString();

      mockFindById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockIncident)
        })
      });

      await getIncidentById(req, res);

      expect(mockFindById).toHaveBeenCalledWith(req.params.id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockIncident);
    });

    it('should return 400 when incident ID format is invalid', async () => {
      req.params.id = 'invalidObjectId';

      await getIncidentById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid incident ID format'
      });
      expect(mockFindById).not.toHaveBeenCalled();
    });

    it('should return 404 when incident is not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();

      mockFindById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      await getIncidentById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incident not found' });
    });

    it('should return 500 when database error occurs', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();

      mockFindById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      await getIncidentById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while fetching incident'
      });
    });
  });

  describe('updateIncident', () => {
    it('should update incident successfully', async () => {
      const mockIncident = {
        _id: 'incidentId123',
        ticketId: 'IT-123456-7890',
        title: 'Server Down',
        description: 'Production server issue',
        status: 'open',
        priority: 'high',
        assignedTo: 'userId123',
        save: mockSave
      };

      const mockUpdatedIncident = {
        ...mockIncident,
        title: 'Server Down - Updated',
        description: 'Production server issue - Fixed',
        status: 'resolved',
        resolvedAt: new Date()
      };

      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = {
        title: 'Server Down - Updated',
        description: 'Production server issue - Fixed',
        status: 'resolved'
      };

      mockFindById
        .mockResolvedValueOnce(mockIncident)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockUpdatedIncident)
          })
        });

      mockSave.mockResolvedValue(mockIncident);

      await updateIncident(req, res);

      expect(mockFindById).toHaveBeenCalledWith(req.params.id);
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedIncident);
    });

    it('should set resolvedAt when status changes to resolved', async () => {
      const mockIncident = {
        _id: 'incidentId123',
        title: 'Server Down',
        description: 'Production server issue',
        status: 'inProgress',
        priority: 'high',
        assignedTo: 'userId123',
        resolvedAt: null,
        save: mockSave
      };

      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = {
        status: 'resolved'
      };

      mockFindById
        .mockResolvedValueOnce(mockIncident)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({ ...mockIncident, status: 'resolved' })
          })
        });

      mockSave.mockResolvedValue(mockIncident);

      await updateIncident(req, res);

      expect(mockIncident.status).toBe('resolved');
      expect(mockIncident.resolvedAt).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should clear resolvedAt when status changes from resolved to another status', async () => {
      const mockIncident = {
        _id: 'incidentId123',
        title: 'Server Down',
        description: 'Production server issue',
        status: 'resolved',
        priority: 'high',
        assignedTo: 'userId123',
        resolvedAt: new Date(),
        save: mockSave
      };

      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = {
        status: 'open'
      };

      mockFindById
        .mockResolvedValueOnce(mockIncident)
        .mockReturnValueOnce({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue({ ...mockIncident, status: 'open' })
          })
        });

      mockSave.mockResolvedValue(mockIncident);

      await updateIncident(req, res);

      expect(mockIncident.status).toBe('open');
      expect(mockIncident.resolvedAt).toBeNull();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should return 400 when incident ID format is invalid', async () => {
      req.params.id = 'invalidObjectId';
      req.body = { title: 'Updated Title' };

      await updateIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid incident ID format'
      });
      expect(mockFindById).not.toHaveBeenCalled();
    });

    it('should return 400 when assignedTo user ID format is invalid', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = {
        assignedTo: 'invalidUserId'
      };

      await updateIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid user ID format'
      });
    });

    it('should return 404 when assigned user does not exist', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = {
        assignedTo: new mongoose.Types.ObjectId().toString()
      };

      mockUserFindById.mockResolvedValue(null);

      await updateIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Assigned user not found'
      });
    });

    it('should return 404 when incident is not found', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = { title: 'Updated Title' };

      mockFindById.mockResolvedValue(null);

      await updateIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incident not found' });
    });

    it('should return 500 when database error occurs', async () => {
      req.params.id = new mongoose.Types.ObjectId().toString();
      req.body = { title: 'Updated Title' };

      mockFindById.mockRejectedValue(new Error('Database error'));

      await updateIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while updating incident'
      });
    });
  });

  describe('deleteIncident', () => {
    it('should delete incident successfully', async () => {
      const mockIncident = {
        _id: 'incidentId123',
        ticketId: 'IT-123456-7890',
        title: 'Server Down',
        deleteOne: mockDeleteOne
      };

      req.params.id = 'incidentId123';

      mockFindById.mockResolvedValue(mockIncident);
      mockDeleteOne.mockResolvedValue();

      await deleteIncident(req, res);

      expect(mockFindById).toHaveBeenCalledWith('incidentId123');
      expect(mockDeleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incident removed' });
    });

    it('should return 404 when incident is not found', async () => {
      req.params.id = 'nonexistentId';

      mockFindById.mockResolvedValue(null);

      await deleteIncident(req, res);

      expect(mockFindById).toHaveBeenCalledWith('nonexistentId');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Incident not found' });
      expect(mockDeleteOne).not.toHaveBeenCalled();
    });

    it('should return 500 when database error occurs', async () => {
      req.params.id = 'incidentId123';

      mockFindById.mockRejectedValue(new Error('Database error'));

      await deleteIncident(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server error while deleting incident'
      });
    });
  });
});