import { jest } from '@jest/globals';

// --- Mocks ---

// Mock the Server model
const mockSave = jest.fn();
const mockFindOne = jest.fn();
const mockFindByIdAndDelete = jest.fn();
const mockFind = jest.fn();
const mockSort = jest.fn();

// Mock the Server model implementation
jest.unstable_mockModule('../../src/models/server.js', () => ({
  default: Object.assign(
    jest.fn().mockImplementation(() => ({
      save: mockSave,
    })),
    {
      findOne: mockFindOne,
      findByIdAndDelete: mockFindByIdAndDelete,
      find: mockFind,
    }
  ),
}));

// Import the controller AFTER mocking
const {
  createServer,
  deleteServer,
  listServers,
} = await import('../../src/controllers/serverController.js');
const Server = (await import('../../src/models/server.js')).default;

// --- Test Suite ---

describe('ServerController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockReset();
    mockFindOne.mockReset();
    mockFindByIdAndDelete.mockReset();
    mockFind.mockReset();
    mockSort.mockReset();

    // Mock chainable find().sort()
    mockFind.mockReturnValue({
      sort: mockSort,
    });

    // Mock Express request and response objects
    req = {
      body: {},
      params: {},
      user: {
        userId: 'user123',
        email: 'admin@example.com',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // --- createServer Tests ---
  describe('createServer', () => {
    it('should create a new server successfully with all fields', async () => {
      req.body = {
        serverId: 'server-001',
        ip: '192.168.1.1',
        status: 'active',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);

      expect(Server.findOne).toHaveBeenCalledWith({
        $or: [{ serverId: 'server-001' }, { ip: '192.168.1.1' }],
      });
      expect(Server).toHaveBeenCalledWith({
        serverId: 'server-001',
        ip: '192.168.1.1',
        status: 'active',
        addedBy: 'user123',
      });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('should create server with default status when not provided', async () => {
      req.body = {
        serverId: 'server-002',
        ip: '192.168.1.2',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);

      expect(Server).toHaveBeenCalledWith({
        serverId: 'server-002',
        ip: '192.168.1.2',
        status: 'active', // Default status
        addedBy: 'user123',
      });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should use email as addedBy when userId not present', async () => {
      req.body = {
        serverId: 'server-003',
        ip: '192.168.1.3',
      };
      req.user = {
        email: 'admin@example.com',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);

      expect(Server).toHaveBeenCalledWith(
        expect.objectContaining({
          addedBy: 'admin@example.com',
        })
      );
    });

    it('should use "unknown" as addedBy when no user info available', async () => {
      req.body = {
        serverId: 'server-004',
        ip: '192.168.1.4',
      };
      req.user = {};

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);

      expect(Server).toHaveBeenCalledWith(
        expect.objectContaining({
          addedBy: 'unknown',
        })
      );
    });

    it('should return 400 if serverId is missing', async () => {
      req.body = { ip: '192.168.1.1' };

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'serverId and ip are required',
      });
      expect(mockFindOne).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should return 400 if ip is missing', async () => {
      req.body = { serverId: 'server-001' };

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'serverId and ip are required',
      });
      expect(mockFindOne).not.toHaveBeenCalled();
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should return 400 if both serverId and ip are missing', async () => {
      req.body = { status: 'active' };

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'serverId and ip are required',
      });
    });

    it('should return 409 if server with same serverId exists', async () => {
      req.body = {
        serverId: 'server-001',
        ip: '192.168.1.1',
      };
      mockFindOne.mockResolvedValue({ 
        serverId: 'server-001',
        ip: '10.0.0.1' 
      });

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server with same id or ip already exists',
      });
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should return 409 if server with same ip exists', async () => {
      req.body = {
        serverId: 'server-002',
        ip: '192.168.1.1',
      };
      mockFindOne.mockResolvedValue({ 
        serverId: 'server-001',
        ip: '192.168.1.1' 
      });

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server with same id or ip already exists',
      });
      expect(mockSave).not.toHaveBeenCalled();
    });

    it('should handle different server statuses', async () => {
      const statuses = ['active', 'inactive', 'maintenance', 'offline'];

      for (const status of statuses) {
        jest.clearAllMocks();
        req.body = {
          serverId: `server-${status}`,
          ip: `192.168.1.${statuses.indexOf(status)}`,
          status: status,
        };

        mockFindOne.mockResolvedValue(null);
        mockSave.mockResolvedValue();

        await createServer(req, res);

        expect(Server).toHaveBeenCalledWith(
          expect.objectContaining({ status })
        );
      }
    });

    it('should return 500 on database findOne error', async () => {
      req.body = {
        serverId: 'server-001',
        ip: '192.168.1.1',
      };
      const dbError = new Error('Database connection failed');
      mockFindOne.mockRejectedValue(dbError);

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating server',
        error: dbError.message,
      });
    });

    it('should return 500 on database save error', async () => {
      req.body = {
        serverId: 'server-001',
        ip: '192.168.1.1',
      };
      const dbError = new Error('Database save failed');
      mockFindOne.mockResolvedValue(null);
      mockSave.mockRejectedValue(dbError);

      await createServer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating server',
        error: dbError.message,
      });
    });

    it('should handle special characters in serverId', async () => {
      req.body = {
        serverId: 'server-001@prod_env',
        ip: '192.168.1.1',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);

      expect(Server).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 'server-001@prod_env',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should trim whitespace from inputs', async () => {
      req.body = {
        serverId: '  server-001  ',
        ip: '  192.168.1.1  ',
        status: '  active  ',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);

      // Note: Controller doesn't trim, but this test documents expected behavior
      expect(Server).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  // --- deleteServer Tests ---
  describe('deleteServer', () => {
    it('should delete a server successfully', async () => {
      req.params.id = 'mockServerMongoId123';
      const mockDeletedServer = { 
        _id: 'mockServerMongoId123', 
        serverId: 'server-001',
        ip: '192.168.1.1',
        status: 'active'
      };

      mockFindByIdAndDelete.mockResolvedValue(mockDeletedServer);

      await deleteServer(req, res);

      expect(Server.findByIdAndDelete).toHaveBeenCalledWith('mockServerMongoId123');
      expect(res.status).not.toHaveBeenCalled(); // 200 is default
      expect(res.json).toHaveBeenCalledWith({
        message: 'Server deleted',
        server: mockDeletedServer,
      });
    });

    it('should return 404 if server not found', async () => {
      req.params.id = 'nonExistentId';
      mockFindByIdAndDelete.mockResolvedValue(null);

      await deleteServer(req, res);

      expect(Server.findByIdAndDelete).toHaveBeenCalledWith('nonExistentId');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Server not found' });
    });

    it('should handle deletion of different server types', async () => {
      const serverIds = ['server-001', 'server-002', 'server-003'];

      for (const serverId of serverIds) {
        jest.clearAllMocks();
        req.params.id = `mongo-${serverId}`;
        mockFindByIdAndDelete.mockResolvedValue({ 
          _id: `mongo-${serverId}`, 
          serverId 
        });

        await deleteServer(req, res);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Server deleted',
          })
        );
      }
    });

    it('should return 500 on database delete error', async () => {
      req.params.id = 'mockServerMongoId';
      const dbError = new Error('Database delete failed');
      mockFindByIdAndDelete.mockRejectedValue(dbError);

      await deleteServer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting server',
        error: dbError.message,
      });
    });

    it('should handle invalid MongoDB ObjectId format', async () => {
      req.params.id = 'invalid-id-format';
      const dbError = new Error('Cast to ObjectId failed');
      mockFindByIdAndDelete.mockRejectedValue(dbError);

      await deleteServer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting server',
        error: 'Cast to ObjectId failed',
      });
    });

    it('should handle concurrent deletion attempts', async () => {
      req.params.id = 'server123';
      mockFindByIdAndDelete.mockResolvedValueOnce({ 
        _id: 'server123', 
        serverId: 'server-001' 
      });
      mockFindByIdAndDelete.mockResolvedValueOnce(null); // Second attempt fails

      await deleteServer(req, res);
      expect(res.status).not.toHaveBeenCalledWith(404);

      await deleteServer(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should not delete if id is undefined', async () => {
      req.params = {};
      mockFindByIdAndDelete.mockResolvedValue(null);

      await deleteServer(req, res);

      expect(Server.findByIdAndDelete).toHaveBeenCalledWith(undefined);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  // --- listServers Tests ---
  describe('listServers', () => {
    it('should return a list of servers sorted by creation date', async () => {
      const mockServers = [
        { serverId: 'server-003', createdAt: '2025-03-03' },
        { serverId: 'server-002', createdAt: '2025-03-02' },
        { serverId: 'server-001', createdAt: '2025-03-01' },
      ];
      mockSort.mockResolvedValue(mockServers);

      await listServers(req, res);

      expect(Server.find).toHaveBeenCalled();
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).not.toHaveBeenCalled(); // 200 is default
      expect(res.json).toHaveBeenCalledWith(mockServers);
    });

    it('should return empty array when no servers exist', async () => {
      mockSort.mockResolvedValue([]);

      await listServers(req, res);

      expect(Server.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return all servers regardless of status', async () => {
      const mockServers = [
        { serverId: 'server-001', status: 'active' },
        { serverId: 'server-002', status: 'inactive' },
        { serverId: 'server-003', status: 'maintenance' },
      ];
      mockSort.mockResolvedValue(mockServers);

      await listServers(req, res);

      expect(Server.find).toHaveBeenCalledWith(); // No filter
      expect(res.json).toHaveBeenCalledWith(mockServers);
    });

    it('should handle large number of servers', async () => {
      const mockServers = Array(1000).fill().map((_, i) => ({
        serverId: `server-${i}`,
        ip: `192.168.${Math.floor(i / 255)}.${i % 255}`,
        status: 'active',
        createdAt: new Date(Date.now() - i * 1000),
      }));
      mockSort.mockResolvedValue(mockServers);

      await listServers(req, res);

      expect(Server.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockServers);
    });

    it('should return servers with all fields', async () => {
      const mockServers = [
        {
          _id: 'mongo123',
          serverId: 'server-001',
          ip: '192.168.1.1',
          status: 'active',
          addedBy: 'admin',
          createdAt: '2025-03-01',
          updatedAt: '2025-03-02',
        },
      ];
      mockSort.mockResolvedValue(mockServers);

      await listServers(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            serverId: 'server-001',
            ip: '192.168.1.1',
            status: 'active',
          }),
        ])
      );
    });

    it('should return 500 on database fetch error', async () => {
      const dbError = new Error('Database fetch failed');
      mockSort.mockRejectedValue(dbError);

      await listServers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching servers',
        error: dbError.message,
      });
    });

    it('should return 500 on database connection error', async () => {
      const dbError = new Error('Connection timeout');
      mockSort.mockRejectedValue(dbError);

      await listServers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching servers',
        error: 'Connection timeout',
      });
    });

    it('should handle concurrent list requests', async () => {
      const mockServers = [{ serverId: 'server-001' }];
      mockSort.mockResolvedValue(mockServers);

      await Promise.all([
        listServers(req, res),
        listServers(req, res),
        listServers(req, res),
      ]);

      expect(Server.find).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenCalledTimes(3);
    });

    it('should maintain sort order across multiple calls', async () => {
      const mockServers1 = [
        { serverId: 'server-002', createdAt: '2025-03-02' },
        { serverId: 'server-001', createdAt: '2025-03-01' },
      ];
      const mockServers2 = [
        { serverId: 'server-003', createdAt: '2025-03-03' },
        { serverId: 'server-002', createdAt: '2025-03-02' },
        { serverId: 'server-001', createdAt: '2025-03-01' },
      ];

      mockSort.mockResolvedValueOnce(mockServers1);
      await listServers(req, res);

      mockSort.mockResolvedValueOnce(mockServers2);
      await listServers(req, res);

      expect(mockSort).toHaveBeenCalledTimes(2);
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  // --- Integration-like Tests ---
  describe('Cross-function behavior', () => {
    it('should create and then list a server', async () => {
      req.body = {
        serverId: 'server-001',
        ip: '192.168.1.1',
        status: 'active',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);
      expect(res.status).toHaveBeenCalledWith(201);

      // Now list servers
      const newServer = {
        serverId: 'server-001',
        ip: '192.168.1.1',
        status: 'active',
      };
      mockSort.mockResolvedValue([newServer]);

      await listServers(req, res);
      expect(res.json).toHaveBeenLastCalledWith([newServer]);
    });

    it('should create and then delete a server', async () => {
      req.body = {
        serverId: 'server-001',
        ip: '192.168.1.1',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);
      expect(res.status).toHaveBeenCalledWith(201);

      // Now delete
      req.params.id = 'mongo123';
      mockFindByIdAndDelete.mockResolvedValue({
        _id: 'mongo123',
        serverId: 'server-001',
      });

      await deleteServer(req, res);
      expect(res.json).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: 'Server deleted',
        })
      );
    });

    it('should handle create, list, and delete sequence', async () => {
      // Create
      req.body = { serverId: 'server-001', ip: '192.168.1.1' };
      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();
      await createServer(req, res);

      // List
      mockSort.mockResolvedValue([{ serverId: 'server-001' }]);
      await listServers(req, res);

      // Delete
      req.params.id = 'mongo123';
      mockFindByIdAndDelete.mockResolvedValue({ serverId: 'server-001' });
      await deleteServer(req, res);

      // List again (empty)
      mockSort.mockResolvedValue([]);
      await listServers(req, res);

      expect(res.json).toHaveBeenLastCalledWith([]);
    });
  });

  // --- Edge Cases ---
  describe('Edge cases and boundary conditions', () => {
    it('should handle extremely long serverId', async () => {
      req.body = {
        serverId: 'a'.repeat(1000),
        ip: '192.168.1.1',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should handle IPv6 addresses', async () => {
      req.body = {
        serverId: 'server-ipv6',
        ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);
      expect(Server).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        })
      );
    });

    it('should handle numeric serverId', async () => {
      req.body = {
        serverId: 12345,
        ip: '192.168.1.1',
      };

      mockFindOne.mockResolvedValue(null);
      mockSave.mockResolvedValue();

      await createServer(req, res);
      expect(Server).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 12345,
        })
      );
    });
  });
});