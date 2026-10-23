import { jest } from '@jest/globals';

// --- Mocks ---
const mockMetricSave = jest.fn();
const mockMetricFind = jest.fn();
const mockServerFind = jest.fn();
const mockSendAlertEmail = jest.fn();

const mockMetricSort = jest.fn();
const mockMetricLimit = jest.fn();
const mockServerLimit = jest.fn();

// Mock Metric Model
jest.unstable_mockModule('../../src/models/metric.js', () => ({
  default: Object.assign(
    jest.fn().mockImplementation(() => ({
      save: mockMetricSave,
    })),
    {
      find: mockMetricFind,
    }
  ),
}));

// Mock Server Model
jest.unstable_mockModule('../../src/models/server.js', () => ({
  default: {
    find: mockServerFind,
  },
}));

// Mock Email Utility
jest.unstable_mockModule('../../src/utils/sendAlertEmail.js', () => ({
  __esModule: true,
  sendAlertEmail: mockSendAlertEmail,
}));

// Import the controller AFTER mocking
const {
  getCurrentMetrics,
  getMetricHistory,
  getAllMetricHistory,
} = await import('../../src/controllers/metricController.js');
const Metric = (await import('../../src/models/metric.js')).default;
const Server = (await import('../../src/models/server.js')).default;

// --- Test Suite ---

describe('MetricController Unit Tests', () => {
  let req, res;
  let randomSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMetricSave.mockReset();
    mockMetricFind.mockReset();
    mockServerFind.mockReset();
    mockSendAlertEmail.mockReset();
    mockMetricSort.mockReset();
    mockMetricLimit.mockReset();
    mockServerLimit.mockReset();

    // Mock chainable Server.find().limit()
    mockServerFind.mockReturnValue({
      limit: mockServerLimit,
    });

    // Mock chainable Metric.find().sort().limit()
    mockMetricFind.mockReturnValue({
      sort: mockMetricSort,
    });
    mockMetricSort.mockReturnValue({
      limit: mockMetricLimit,
    });

    // Spy on Math.random to control generated values
    randomSpy = jest.spyOn(global.Math, 'random');

    req = {
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  // --- getCurrentMetrics Tests ---
  describe('getCurrentMetrics', () => {
    it('should generate metrics, save, and not send an alert for normal values', async () => {
      // Call 1 (Server select): 0
      // Call 2 (cpu): 30 + round(0.1 * 40) = 34
      // Call 3 (mem): 50 + round(0.1 * 30) = 53
      // Call 4 (dsk): 70 + round(0.1 * 20) = 72
      randomSpy
        .mockReturnValueOnce(0)
        .mockReturnValue(0.1);
      
      mockServerLimit.mockResolvedValue([{ serverId: 'server-001' }]);
      mockMetricSave.mockResolvedValue();

      await getCurrentMetrics(req, res);

      expect(mockServerFind).toHaveBeenCalledWith({ status: 'active' });
      expect(Metric).toHaveBeenCalledWith({
        serverId: 'server-001',
        cpu: 34,
        memory: 53,
        disk: 72,
      });
      expect(mockMetricSave).toHaveBeenCalled();
      expect(mockSendAlertEmail).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        serverId: 'server-001',
        cpu: 34,
        memory: 53,
        disk: 72,
      });
    });

    it('should use fallback serverId if no active servers found', async () => {
      randomSpy.mockReturnValue(0.1);
      mockServerLimit.mockResolvedValue([]);
      mockMetricSave.mockResolvedValue();

      await getCurrentMetrics(req, res);

      expect(Metric).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 'main-server',
        })
      );
      expect(mockMetricSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          serverId: 'main-server',
        })
      );
    });

    it('should trigger a "WARNING" alert when any metric is > 95 but < 100', async () => {
      // Call 1 (Server select): 0 -> index 0
      // Call 2 (cpu): 30 + round(0.1 * 40) = 34
      // Call 3 (mem): 50 + round(1.6 * 30) = 98 (triggers WARNING)
      // Call 4 (dsk): 70 + round(0.5 * 20) = 80
      randomSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(1.6)
        .mockReturnValueOnce(0.5);
      
      mockServerLimit.mockResolvedValue([{ serverId: 'server-001' }]);
      mockMetricSave.mockResolvedValue();
      mockSendAlertEmail.mockResolvedValue();

      await getCurrentMetrics(req, res);

      const expectedMetrics = {
        serverId: 'server-001',
        cpu: 34,
        memory: 98,
        disk: 80,
      };

      expect(Metric).toHaveBeenCalledWith(expectedMetrics);
      expect(mockMetricSave).toHaveBeenCalled();
      expect(mockSendAlertEmail).toHaveBeenCalledWith("WARNING", expectedMetrics);
      expect(mockSendAlertEmail).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expectedMetrics);
    });
    
    it('should trigger a "SERIOUS" alert when any metric >= 100', async () => {
      // Call 1 (Server select): 0 -> index 0
      // Calls 2-4: 2.0 -> cpu: 110, mem: 110, dsk: 110
      randomSpy
        .mockReturnValueOnce(0)
        .mockReturnValue(2.0); 
      
      mockServerLimit.mockResolvedValue([{ serverId: 'server-001' }]);
      mockMetricSave.mockResolvedValue();
      mockSendAlertEmail.mockResolvedValue();

      await getCurrentMetrics(req, res);

      const expectedMetrics = {
        serverId: 'server-001',
        cpu: 110,
        memory: 110,
        disk: 110,
      };

      expect(Metric).toHaveBeenCalledWith(expectedMetrics);
      expect(mockMetricSave).toHaveBeenCalled();
      expect(mockSendAlertEmail).toHaveBeenCalledWith("SERIOUS", expectedMetrics);
      expect(mockSendAlertEmail).toHaveBeenCalledTimes(1);
      expect(res.json).toHaveBeenCalledWith(expectedMetrics);
    });

    it('should prioritize SERIOUS alert over WARNING when metrics >= 100', async () => {
      // Call 1 (Server select): 0 -> index 0
      // Call 2 (cpu): 30 + round(2.0 * 40) = 110 (>= 100)
      // Call 3 (mem): 50 + round(1.6 * 30) = 98 (> 95)
      // Call 4 (dsk): 70 + round(1.0 * 20) = 90
      randomSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2.0)
        .mockReturnValueOnce(1.6)
        .mockReturnValueOnce(1.0);
      
      mockServerLimit.mockResolvedValue([{ serverId: 'server-002' }]);
      mockMetricSave.mockResolvedValue();
      mockSendAlertEmail.mockResolvedValue();

      await getCurrentMetrics(req, res);

      expect(mockSendAlertEmail).toHaveBeenCalledWith("SERIOUS", expect.any(Object));
      expect(mockSendAlertEmail).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple active servers and select one randomly', async () => {
      randomSpy.mockReturnValue(0.1);
      const multipleServers = [
        { serverId: 'server-001' },
        { serverId: 'server-002' },
        { serverId: 'server-003' }
      ];
      mockServerLimit.mockResolvedValue(multipleServers);
      mockMetricSave.mockResolvedValue();

      await getCurrentMetrics(req, res);

      expect(mockServerLimit).toHaveBeenCalledWith(50);
      expect(mockMetricSave).toHaveBeenCalled();
      // Should use one of the returned servers
      const calledServerId = Metric.mock.calls[0][0].serverId;
      expect(['server-001', 'server-002', 'server-003']).toContain(calledServerId);
    });

    it('should return 500 if Server.find fails', async () => {
      const dbError = new Error('Server find failed');
      mockServerLimit.mockRejectedValue(dbError);
      
      await getCurrentMetrics(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching metrics',
        error: dbError.message
      });
      expect(mockMetricSave).not.toHaveBeenCalled();
    });

    it('should return 500 if Metric.save fails', async () => {
      randomSpy.mockReturnValue(0.1);
      const dbError = new Error('Metric save failed');
      mockServerLimit.mockResolvedValue([{ serverId: 'server-001' }]);
      mockMetricSave.mockRejectedValue(dbError);

      await getCurrentMetrics(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching metrics',
        error: dbError.message
      });
    });

    it('should continue even if sendAlertEmail fails', async () => {
      // Call 1 (Server select): 0 -> index 0
      // Calls 2-4: 2.0 -> triggers SERIOUS alert
      randomSpy
        .mockReturnValueOnce(0)
        .mockReturnValue(2.0);

      mockServerLimit.mockResolvedValue([{ serverId: 'server-001' }]);
      mockMetricSave.mockResolvedValue();
      mockSendAlertEmail.mockRejectedValue(new Error('Email service down'));

      await getCurrentMetrics(req, res);

      // Should still save metric and respond even if email fails
      expect(mockMetricSave).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalled();
    });
  });

  // --- getMetricHistory Tests ---
  describe('getMetricHistory', () => {
    it('should get history for default server (main-server) when no serverId provided', async () => {
      req.query = {};
      const mockHistory = [{ metric: 3 }, { metric: 2 }, { metric: 1 }];
      mockMetricLimit.mockResolvedValue(mockHistory);
      
      await getMetricHistory(req, res);
      
      expect(mockMetricFind).toHaveBeenCalledWith({ serverId: 'main-server' });
      expect(mockMetricSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockMetricLimit).toHaveBeenCalledWith(20);
      expect(res.json).toHaveBeenCalledWith([{ metric: 1 }, { metric: 2 }, { metric: 3 }]);
    });

    it('should get history for a specific server via query param', async () => {
      req.query = { serverId: 'server-002' };
      const mockHistory = [{ metric: 5 }, { metric: 4 }];
      mockMetricLimit.mockResolvedValue(mockHistory);

      await getMetricHistory(req, res);

      expect(mockMetricFind).toHaveBeenCalledWith({ serverId: 'server-002' });
      expect(mockMetricSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockMetricLimit).toHaveBeenCalledWith(20);
      expect(res.json).toHaveBeenCalledWith([{ metric: 4 }, { metric: 5 }]);
    });

    it('should handle empty history results', async () => {
      req.query = { serverId: 'new-server' };
      mockMetricLimit.mockResolvedValue([]);

      await getMetricHistory(req, res);

      expect(mockMetricFind).toHaveBeenCalledWith({ serverId: 'new-server' });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should limit results to exactly 20 records', async () => {
      req.query = { serverId: 'server-001' };
      const mockHistory = Array(20).fill().map((_, i) => ({ metric: i }));
      mockMetricLimit.mockResolvedValue(mockHistory);

      await getMetricHistory(req, res);

      expect(mockMetricLimit).toHaveBeenCalledWith(20);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([expect.any(Object)]));
    });
    
    it('should return 500 if Metric.find fails', async () => {
      req.query = {};
      const dbError = new Error('History fetch failed');
      mockMetricLimit.mockRejectedValue(dbError);
      
      await getMetricHistory(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching metric history',
        error: dbError.message
      });
    });

    it('should handle special characters in serverId', async () => {
      req.query = { serverId: 'server-001@special_name' };
      mockMetricLimit.mockResolvedValue([]);

      await getMetricHistory(req, res);

      expect(mockMetricFind).toHaveBeenCalledWith({ serverId: 'server-001@special_name' });
      expect(res.json).toHaveBeenCalled();
    });
  });

  // --- getAllMetricHistory Tests ---
  describe('getAllMetricHistory', () => {
    it('should get all history for default server (main-server)', async () => {
      req.query = {};
      const mockHistory = Array(160).fill().map((_, i) => ({ metric: i }));
      mockMetricLimit.mockResolvedValue(mockHistory);
      
      await getAllMetricHistory(req, res);
      
      expect(mockMetricFind).toHaveBeenCalledWith({ serverId: 'main-server' });
      expect(mockMetricSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockMetricLimit).toHaveBeenCalledWith(160);
      expect(res.json).toHaveBeenCalled();
    });

    it('should get all history for a specific server via query param', async () => {
      req.query = { serverId: 'server-003' };
      const mockHistory = Array(100).fill().map((_, i) => ({ 
        serverId: 'server-003',
        cpu: 50 + i,
        memory: 60 + i,
        disk: 70 + i,
        createdAt: new Date(Date.now() - i * 1000)
      }));
      mockMetricLimit.mockResolvedValue(mockHistory);

      await getAllMetricHistory(req, res);

      expect(mockMetricFind).toHaveBeenCalledWith({ serverId: 'server-003' });
      expect(mockMetricSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockMetricLimit).toHaveBeenCalledWith(160);
      // Results should be reversed
      const responseData = res.json.mock.calls[0][0];
      expect(Array.isArray(responseData)).toBe(true);
    });

    it('should handle empty results for new server', async () => {
      req.query = { serverId: 'brand-new-server' };
      mockMetricLimit.mockResolvedValue([]);

      await getAllMetricHistory(req, res);

      expect(mockMetricFind).toHaveBeenCalledWith({ serverId: 'brand-new-server' });
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should limit results to exactly 160 records', async () => {
      req.query = { serverId: 'server-001' };
      const mockHistory = Array(160).fill().map((_, i) => ({ metric: i }));
      mockMetricLimit.mockResolvedValue(mockHistory);

      await getAllMetricHistory(req, res);

      expect(mockMetricLimit).toHaveBeenCalledWith(160);
    });

    it('should reverse the results to chronological order', async () => {
      req.query = { serverId: 'server-001' };
      const mockHistory = [
        { id: 3, createdAt: '2025-03-03' },
        { id: 2, createdAt: '2025-03-02' },
        { id: 1, createdAt: '2025-03-01' }
      ];
      mockMetricLimit.mockResolvedValue(mockHistory);

      await getAllMetricHistory(req, res);

      const responseData = res.json.mock.calls[0][0];
      expect(responseData[0].id).toBe(1);
      expect(responseData[2].id).toBe(3);
    });

    it('should return 500 if database query fails', async () => {
      req.query = { serverId: 'server-001' };
      const dbError = new Error('Database connection lost');
      mockMetricLimit.mockRejectedValue(dbError);

      await getAllMetricHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching metric history',
        error: dbError.message
      });
    });

    it('should handle concurrent requests', async () => {
      req.query = { serverId: 'server-001' };
      const mockHistory = [{ metric: 1 }];
      mockMetricLimit.mockResolvedValue(mockHistory);

      // Simulate concurrent calls
      await Promise.all([
        getAllMetricHistory(req, res),
        getAllMetricHistory(req, res),
        getAllMetricHistory(req, res)
      ]);

      expect(mockMetricFind).toHaveBeenCalledTimes(3);
      expect(res.json).toHaveBeenCalledTimes(3);
    });
  });

  // --- Integration-like Tests ---
  describe('Cross-function behavior', () => {
    it('should create metrics that can be retrieved by getMetricHistory', async () => {
      randomSpy.mockReturnValue(0.5);
      mockServerLimit.mockResolvedValue([{ serverId: 'server-001' }]);
      mockMetricSave.mockResolvedValue();

      // Create a metric
      await getCurrentMetrics(req, res);

      const createdMetric = Metric.mock.calls[0][0];

      // Now mock finding it
      req.query = { serverId: 'server-001' };
      mockMetricLimit.mockResolvedValue([createdMetric]);

      await getMetricHistory(req, res);

      expect(res.json).toHaveBeenLastCalledWith(expect.arrayContaining([
        expect.objectContaining({ serverId: 'server-001' })
      ]));
    });
  });
});