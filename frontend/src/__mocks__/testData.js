// Test utilities and mocks
export const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkyMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

export const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImFkbWluLWlkIiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTUxNjIzOTIyMn0.2xxKUlOF_QAmY8j5DyGHkqZNnVdEH1eFqM3-1234567';

export const mockOperatorToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Im9wZXJhdG9yLWlkIiwiZW1haWwiOiJvcGVyYXRvckBleGFtcGxlLmNvbSIsInJvbGUiOiJvcGVyYXRvciIsImlhdCI6MTUxNjIzOTIyMn0.3yyLUlOF_QAmY8j5DyGHkqZNnVdEH1eFqM3-1234567';

export const mockUser = {
  id: '1234567890',
  email: 'test@example.com',
  role: 'admin',
};

export const mockAdminUser = {
  id: 'admin-id',
  email: 'admin@example.com',
  role: 'admin',
};

export const mockOperatorUser = {
  id: 'operator-id',
  email: 'operator@example.com',
  role: 'operator',
};

export const mockServer = {
  _id: '507f1f77bcf86cd799439011',
  serverId: '111',
  ip: '192.168.1.100',
  status: 'active',
  addedBy: 'admin',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

export const mockServers = [
  mockServer,
  {
    _id: '507f1f77bcf86cd799439012',
    serverId: '222',
    ip: '192.168.1.101',
    status: 'inactive',
    addedBy: 'admin',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

export const mockMetric = {
  _id: '507f1f77bcf86cd799439013',
  serverId: '111',
  cpu: 45,
  memory: 72,
  disk: 81,
  createdAt: '2025-01-01T00:00:00Z',
};

export const mockMetricHistory = [
  mockMetric,
  {
    _id: '507f1f77bcf86cd799439014',
    serverId: '111',
    cpu: 48,
    memory: 75,
    disk: 85,
    createdAt: '2025-01-01T01:00:00Z',
  },
  {
    _id: '507f1f77bcf86cd799439015',
    serverId: '111',
    cpu: 52,
    memory: 78,
    disk: 87,
    createdAt: '2025-01-01T02:00:00Z',
  },
];

export const mockIncident = {
  _id: '507f1f77bcf86cd799439020',
  title: 'Test Incident',
  description: 'This is a test incident',
  severity: 'high',
  status: 'open',
  assignedTo: 'admin-id',
  createdBy: 'operator-id',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

export const mockIncidents = [
  mockIncident,
  {
    _id: '507f1f77bcf86cd799439021',
    title: 'Critical Incident',
    description: 'System failure',
    severity: 'critical',
    status: 'in-progress',
    assignedTo: 'admin-id',
    createdBy: 'operator-id',
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
];

export const mockAuditLog = {
  _id: '507f1f77bcf86cd799439030',
  userId: 'admin-id',
  action: 'CREATE',
  resource: 'incident',
  resourceId: '507f1f77bcf86cd799439020',
  changes: { title: 'Test Incident' },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  createdAt: '2025-01-01T00:00:00Z',
};

export const mockAuditLogs = [mockAuditLog];

export const createMockResponse = (data, status = 200) => ({
  status,
  data,
  headers: {},
  statusText: 'OK',
  config: {},
});

export const createMockError = (message, status = 400) => ({
  response: {
    status,
    data: { message },
    headers: {},
    statusText: 'Error',
    config: {},
  },
  message,
});
