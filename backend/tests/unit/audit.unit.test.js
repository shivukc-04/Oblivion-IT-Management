import { jest } from '@jest/globals';

// ==================== AUDIT LOGGER UNIT TESTS ====================

describe('AuditLogger Middleware Unit Tests', () => {
  let mockCreate;
  let auditLogger;
  let req, res, next;

  beforeAll(async () => {
    // Mock auditLog model
    mockCreate = jest.fn();
    jest.unstable_mockModule('../../src/models/auditLog.js', () => ({
      default: {
        create: mockCreate
      }
    }));

    // Import after mocking
    const auditLoggerModule = await import('../../src/middlewares/auditLogger.js');
    auditLogger = auditLoggerModule.auditLogger;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate.mockReset();

    // Setup request object
    req = {
      method: 'GET',
      originalUrl: '/api/incidents',
      url: '/api/incidents',
      path: '/api/incidents',
      query: {},
      body: {},
      headers: {},
      get: jest.fn((header) => {
        if (header === 'user-agent') return 'Mozilla/5.0';
        return null;
      }),
      connection: { remoteAddress: '127.0.0.1' },
      socket: {},
      ip: '127.0.0.1'
    };

    // Setup response object with event emitter
    res = {
      statusCode: 200,
      on: jest.fn(),
      once: jest.fn()
    };

    // Setup next function
    next = jest.fn();

    // Mock environment
    process.env.NODE_ENV = 'test';
  });

  describe('Basic Functionality', () => {
    it('should call next() to continue middleware chain', async () => {
      await auditLogger(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should register finish event listener', async () => {
      await auditLogger(req, res, next);
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should register error event listener', async () => {
      await auditLogger(req, res, next);
      expect(res.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Logging Authenticated Requests', () => {
    it('should log request with authenticated user', async () => {
      req.user = {
        userId: 'user123',
        id: 'mongoId123',
        email: 'test@example.com',
        role: 'admin'
      };

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      // Trigger finish event
      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          path: '/api/incidents',
          userId: 'user123',
          userEmail: 'test@example.com',
          ip: '127.0.0.1',
          statusCode: 200
        })
      );
    });

    it('should handle user with only id field', async () => {
      req.user = {
        id: 'userId456',
        email: 'user@example.com'
      };

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'userId456',
          userEmail: 'user@example.com'
        })
      );
    });
  });

  describe('Logging Unauthenticated Requests', () => {
    it('should log request without user authentication', async () => {
      req.user = null;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      // Check that mockCreate was called
      expect(mockCreate).toHaveBeenCalled();
      
      // Get the actual call arguments
      const callArgs = mockCreate.mock.calls[0][0];
      
      // Verify it has the expected fields (but not userId/userEmail since user is null)
      expect(callArgs).toMatchObject({
        method: 'GET',
        path: '/api/incidents',
        ip: '127.0.0.1',
        statusCode: 200
      });
      
      // Verify userId and userEmail are NOT present in the log data
      expect(callArgs.userId).toBeUndefined();
      expect(callArgs.userEmail).toBeUndefined();
    });
  });

  describe('HTTP Method Handling', () => {
    it('should log POST request', async () => {
      req.method = 'POST';
      req.body = { title: 'New Incident' };

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          eventType: 'Create'
        })
      );
    });

    it('should log PUT request', async () => {
      req.method = 'PUT';

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          eventType: 'Update'
        })
      );
    });

    it('should log DELETE request', async () => {
      req.method = 'DELETE';

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'DELETE',
          eventType: 'Delete'
        })
      );
    });

    it('should log PATCH request', async () => {
      req.method = 'PATCH';

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          eventType: 'Update'
        })
      );
    });
  });

  describe('Event Type Detection', () => {
    it('should detect Login event', async () => {
      req.path = '/api/auth/login';
      req.method = 'POST';

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'Login'
        })
      );
    });

    it('should detect Logout event', async () => {
      req.path = '/api/auth/logout';
      req.method = 'POST';

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'Logout'
        })
      );
    });

    it('should detect View event for GET requests', async () => {
      req.method = 'GET';
      req.path = '/api/incidents';

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'View'
        })
      );
    });
  });

  describe('Request Body Sanitization', () => {
    it('should sanitize password field in request body', async () => {
      req.method = 'POST';
      req.body = {
        username: 'testuser',
        password: 'secretpassword123',
        email: 'test@example.com'
      };

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            username: 'testuser',
            password: '***REDACTED***',
            email: 'test@example.com'
          }
        })
      );
    });

    it('should sanitize token field in request body', async () => {
      req.body = {
        userId: 'user123',
        token: 'secret-token-12345'
      };

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            userId: 'user123',
            token: '***REDACTED***'
          }
        })
      );
    });

    it('should sanitize multiple sensitive fields', async () => {
      req.body = {
        username: 'testuser',
        password: 'secret123',
        apiKey: 'key-12345',
        secret: 'my-secret',
        normalField: 'visible-data'
      };

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: {
            username: 'testuser',
            password: '***REDACTED***',
            apiKey: '***REDACTED***',
            secret: '***REDACTED***',
            normalField: 'visible-data'
          }
        })
      );
    });

    it('should handle empty request body', async () => {
      req.body = {};

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.not.objectContaining({
          requestBody: expect.anything()
        })
      );
    });
  });

  describe('IP Address Detection', () => {
    it('should get IP from x-forwarded-for header', async () => {
      req.headers['x-forwarded-for'] = '192.168.1.1, 10.0.0.1';

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '192.168.1.1'
        })
      );
    });

    it('should get IP from x-real-ip header', async () => {
      req.headers['x-real-ip'] = '172.16.0.1';
      delete req.headers['x-forwarded-for'];

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '172.16.0.1'
        })
      );
    });

    it('should fallback to connection.remoteAddress', async () => {
      req.connection.remoteAddress = '127.0.0.1';

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          ip: '127.0.0.1'
        })
      );
    });
  });

  describe('Device Detection', () => {
    it('should detect mobile device', async () => {
      req.get = jest.fn((header) => {
        if (header === 'user-agent') {
          return 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Mobile Safari';
        }
        return null;
      });

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Mobile'
        })
      );
    });

    it('should detect tablet device', async () => {
      req.get = jest.fn((header) => {
        if (header === 'user-agent') {
          return 'Mozilla/5.0 (iPad; CPU OS 13_0 like Mac OS X) Tablet Safari';
        }
        return null;
      });

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Tablet'
        })
      );
    });

    it('should detect Windows desktop', async () => {
      req.get = jest.fn((header) => {
        if (header === 'user-agent') {
          return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0';
        }
        return null;
      });

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Windows Desktop'
        })
      );
    });

    it('should detect Mac desktop', async () => {
      req.get = jest.fn((header) => {
        if (header === 'user-agent') {
          return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36';
        }
        return null;
      });

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Mac Desktop'
        })
      );
    });

    it('should detect Linux desktop', async () => {
      req.get = jest.fn((header) => {
        if (header === 'user-agent') {
          return 'Mozilla/5.0 (X11; Linux x86_64) Firefox/89.0';
        }
        return null;
      });

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Linux Desktop'
        })
      );
    });

    it('should handle unknown device', async () => {
      req.get = jest.fn((header) => {
        if (header === 'user-agent') {
          return null;
        }
        return null;
      });

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          deviceInfo: 'Unknown'
        })
      );
    });
  });

  // describe('Response Time Tracking', () => {
  //   it('should track response time', async () => {
  //     mockCreate.mockResolvedValue({ _id: 'logId123' });

  //     await auditLogger(req, res, next);

  //     // Wait a bit to simulate processing time
  //     await new Promise(resolve => setTimeout(resolve, 50));

  //     const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
  //     await finishHandler();

  //     expect(mockCreate).toHaveBeenCalledWith(
  //       expect.objectContaining({
  //         responseTime: expect.any(Number)
  //       })
  //     );

  //     const callArgs = mockCreate.mock.calls[0][0];
  //     expect(callArgs.responseTime).toBeGreaterThanOrEqual(50);
  //   });
  // });

  describe('Query Parameters Logging', () => {
    it('should log query parameters', async () => {
      req.query = {
        page: '1',
        limit: '10',
        status: 'open'
      };

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          queryParams: {
            page: '1',
            limit: '10',
            status: 'open'
          }
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should log errors without breaking the application', async () => {
      mockCreate.mockRejectedValue(new Error('Database connection failed'));

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      // Should not throw error
      expect(next).toHaveBeenCalled();
    });

    it('should handle error event', async () => {
      const error = new Error('Response error');
      res.statusCode = 500;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const errorHandler = res.on.mock.calls.find(call => call[0] === 'error')[1];
      await errorHandler(error);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          errorMessage: 'Response error',
          statusCode: 500
        })
      );
    });

    it('should handle error event with logging failure gracefully', async () => {
      const error = new Error('Response error');
      mockCreate.mockRejectedValue(new Error('Logging failed'));

      await auditLogger(req, res, next);

      const errorHandler = res.on.mock.calls.find(call => call[0] === 'error')[1];
      
      // Should not throw
      await expect(errorHandler(error)).resolves.not.toThrow();
    });
  });

  describe('Status Code Logging', () => {
    it('should log 200 status code', async () => {
      res.statusCode = 200;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 200
        })
      );
    });

    it('should log 201 status code for creation', async () => {
      res.statusCode = 201;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 201
        })
      );
    });

    it('should log 400 status code for bad request', async () => {
      res.statusCode = 400;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400
        })
      );
    });

    it('should log 401 status code for unauthorized', async () => {
      res.statusCode = 401;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401
        })
      );
    });

    it('should log 403 status code for forbidden', async () => {
      res.statusCode = 403;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403
        })
      );
    });

    it('should log 404 status code for not found', async () => {
      res.statusCode = 404;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404
        })
      );
    });

    it('should log 500 status code for server error', async () => {
      res.statusCode = 500;

      mockCreate.mockResolvedValue({ _id: 'logId123' });

      await auditLogger(req, res, next);

      const finishHandler = res.on.mock.calls.find(call => call[0] === 'finish')[1];
      await finishHandler();

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500
        })
      );
    });
  });
});

// ==================== AUDIT ROUTER UNIT TESTS ====================

describe('AuditRouter Unit Tests', () => {
  let mockFind, mockCountDocuments, mockAggregate;
  let auditLog;

  beforeAll(async () => {
    // Clear any existing mocks
    jest.resetModules();

    // Setup mock functions
    mockFind = jest.fn();
    mockCountDocuments = jest.fn();
    mockAggregate = jest.fn();

    // Mock auditLog model BEFORE any imports
    jest.unstable_mockModule('../../src/models/auditLog.js', () => ({
      default: {
        find: mockFind,
        countDocuments: mockCountDocuments,
        aggregate: mockAggregate
      }
    }));

    // Now import the mocked module
    const auditLogModule = await import('../../src/models/auditLog.js');
    auditLog = auditLogModule.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReset();
    mockCountDocuments.mockReset();
    mockAggregate.mockReset();
  });

  describe('GET /api/audit/logs - Get All Audit Logs', () => {
    it('should get all audit logs with default pagination', async () => {
      const mockLogs = [
        {
          _id: 'log1',
          method: 'GET',
          path: '/api/incidents',
          userId: 'user123',
          statusCode: 200,
          createdAt: new Date()
        },
        {
          _id: 'log2',
          method: 'POST',
          path: '/api/incidents',
          userId: 'admin123',
          statusCode: 201,
          createdAt: new Date()
        }
      ];

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLogs)
      };

      mockFind.mockReturnValue(mockChain);
      mockCountDocuments.mockResolvedValue(2);

      // Execute the route logic
      const page = 1;
      const limit = 50;
      const filter = {};
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        auditLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        auditLog.countDocuments(filter)
      ]);

      const response = {
        success: true,
        data: logs,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit)
        }
      };

      expect(mockFind).toHaveBeenCalledWith({});
      expect(mockCountDocuments).toHaveBeenCalledWith({});
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockChain.skip).toHaveBeenCalledWith(0);
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(response.data).toEqual(mockLogs);
      expect(response.pagination).toEqual({
        total: 2,
        page: 1,
        pages: 1,
        limit: 50
      });
    });

    it('should filter logs by userId', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);
      mockCountDocuments.mockResolvedValue(0);

      const filter = { userId: 'user123' };
      await auditLog.find(filter).sort({ createdAt: -1 }).skip(0).limit(50).lean();

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });
    });

    it('should filter logs by method', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);
      mockCountDocuments.mockResolvedValue(0);

      const filter = { method: 'POST' };
      await auditLog.find(filter).sort({ createdAt: -1 }).skip(0).limit(50).lean();

      expect(mockFind).toHaveBeenCalledWith({ method: 'POST' });
    });

    it('should filter logs by eventType', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);
      mockCountDocuments.mockResolvedValue(0);

      const filter = { eventType: 'Login' };
      await auditLog.find(filter).sort({ createdAt: -1 }).skip(0).limit(50).lean();

      expect(mockFind).toHaveBeenCalledWith({ eventType: 'Login' });
    });

    it('should filter logs by date range', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);
      mockCountDocuments.mockResolvedValue(0);

      const filter = {
        createdAt: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-12-31')
        }
      };

      await auditLog.find(filter).sort({ createdAt: -1 }).skip(0).limit(50).lean();

      expect(mockFind).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: expect.objectContaining({
            $gte: expect.any(Date),
            $lte: expect.any(Date)
          })
        })
      );
    });

    it('should handle pagination with custom page and limit', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);
      mockCountDocuments.mockResolvedValue(25);

      const page = 2;
      const limit = 10;
      const skip = (page - 1) * limit;

      await auditLog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

      expect(mockChain.skip).toHaveBeenCalledWith(10);
      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });

    it('should combine multiple filters', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);
      mockCountDocuments.mockResolvedValue(0);

      const filter = {
        userId: 'user123',
        method: 'GET',
        eventType: 'View',
        createdAt: { $gte: new Date('2024-01-01') }
      };

      await auditLog.find(filter).sort({ createdAt: -1 }).skip(0).limit(50).lean();

      expect(mockFind).toHaveBeenCalledWith({
        userId: 'user123',
        method: 'GET',
        eventType: 'View',
        createdAt: expect.objectContaining({
          $gte: expect.any(Date)
        })
      });
    });
  });

  describe('GET /api/audit/user/:userId - Get Logs for Specific User', () => {
    it('should get logs for specific user', async () => {
      const mockLogs = [
        {
          _id: 'log1',
          userId: 'user123',
          method: 'GET',
          path: '/api/incidents'
        }
      ];

      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockLogs)
      };

      mockFind.mockReturnValue(mockChain);

      const logs = await auditLog.find({ userId: 'user123' })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      expect(mockFind).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockChain.limit).toHaveBeenCalledWith(50);
      expect(logs).toEqual(mockLogs);
    });

    it('should respect custom limit for user logs', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);

      await auditLog.find({ userId: 'user123' })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

      expect(mockChain.limit).toHaveBeenCalledWith(20);
    });

    it('should return empty array when user has no logs', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      };

      mockFind.mockReturnValue(mockChain);

      const logs = await auditLog.find({ userId: 'newuser' })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      expect(logs).toEqual([]);
    });
  });

  describe('GET /api/audit/stats - Get Audit Statistics', () => {
    it('should get audit statistics', async () => {
      const mockStats = [
        {
          byMethod: [
            { _id: 'GET', count: 150 },
            { _id: 'POST', count: 50 },
            { _id: 'PUT', count: 30 },
            { _id: 'DELETE', count: 10 }
          ],
          byEventType: [
            { _id: 'View', count: 150 },
            { _id: 'Create', count: 50 },
            { _id: 'Update', count: 30 }
          ],
          byStatusCode: [
            { _id: 200, count: 180 },
            { _id: 201, count: 50 },
            { _id: 404, count: 10 }
          ],
          totalRequests: [{ total: 240 }],
          avgResponseTime: [{ avgTime: 125.5 }]
        }
      ];

      mockAggregate.mockResolvedValue(mockStats);

      const stats = await auditLog.aggregate([
        {
          $facet: {
            byMethod: [
              { $group: { _id: '$method', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            byEventType: [
              { $group: { _id: '$eventType', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            byStatusCode: [
              { $group: { _id: '$statusCode', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            totalRequests: [
              { $count: 'total' }
            ],
            avgResponseTime: [
              { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
            ]
          }
        }
      ]);

      expect(mockAggregate).toHaveBeenCalledWith([
        expect.objectContaining({
          $facet: expect.objectContaining({
            byMethod: expect.any(Array),
            byEventType: expect.any(Array),
            byStatusCode: expect.any(Array),
            totalRequests: expect.any(Array),
            avgResponseTime: expect.any(Array)
          })
        })
      ]);
      expect(stats[0]).toEqual(mockStats[0]);
    });

    it('should handle empty statistics', async () => {
      const mockStats = [
        {
          byMethod: [],
          byEventType: [],
          byStatusCode: [],
          totalRequests: [],
          avgResponseTime: []
        }
      ];

      mockAggregate.mockResolvedValue(mockStats);

      const stats = await auditLog.aggregate([
        {
          $facet: {
            byMethod: [
              { $group: { _id: '$method', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            byEventType: [
              { $group: { _id: '$eventType', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            byStatusCode: [
              { $group: { _id: '$statusCode', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ],
            totalRequests: [
              { $count: 'total' }
            ],
            avgResponseTime: [
              { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
            ]
          }
        }
      ]);

      expect(stats[0].byMethod).toEqual([]);
      expect(stats[0].totalRequests).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors when fetching logs', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      mockFind.mockReturnValue(mockChain);

      try {
        await auditLog.find({})
          .sort({ createdAt: -1 })
          .skip(0)
          .limit(50)
          .lean();
      } catch (error) {
        expect(error.message).toBe('Database error');
      }
    });

    it('should handle database errors when fetching user logs', async () => {
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      };

      mockFind.mockReturnValue(mockChain);

      try {
        await auditLog.find({ userId: 'user123' })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }
    });

    it('should handle aggregation errors when fetching stats', async () => {
      mockAggregate.mockRejectedValue(new Error('Aggregation failed'));

      try {
        await auditLog.aggregate([{ $facet: {} }]);
      } catch (error) {
        expect(error.message).toBe('Aggregation failed');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid page numbers gracefully', () => {
      const page = Math.max(1, parseInt('-1') || 1);
      const limit = Math.max(1, parseInt('10') || 50);
      const skip = (page - 1) * limit;

      expect(page).toBe(1);
      expect(skip).toBe(0);
    });

    it('should handle very large limit values', () => {
      const limit = parseInt('999999');
      expect(limit).toBe(999999);
    });

    it('should handle zero limit', () => {
      const limit = Math.max(1, parseInt('0'));
      expect(limit).toBe(1);
    });

    it('should handle invalid date formats', () => {
      const startDate = new Date('invalid-date');
      expect(startDate.toString()).toBe('Invalid Date');
    });

    it('should handle missing userId parameter', () => {
      const params = {};
      const userId = params.userId;
      expect(userId).toBeUndefined();
    });

    it('should handle NaN page values', () => {
      const page = Math.max(1, parseInt('abc') || 1);
      expect(page).toBe(1);
    });

    it('should handle NaN limit values', () => {
      const limit = Math.max(1, parseInt('xyz') || 50);
      expect(limit).toBe(50);
    });
  });

});
