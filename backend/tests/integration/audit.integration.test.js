import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../src/models/user.js';
import auditLog from '../../src/models/auditLog.js';
import authRouter from '../../src/routes/authRouter.js';
import usersRouter from '../../src/routes/usersRouter.js';
import auditRouter from '../../src/routes/auditRouter.js';
import { verifyToken } from '../../src/middlewares/verifyToken.js';
import { authorizeRoles } from '../../src/middlewares/authorizeRoles.js';
import { auditLogger } from '../../src/middlewares/auditLogger.js';

describe('Audit Logging Integration Tests', () => {
  let app;
  let mongoServer;
  let adminToken;
  let userToken;
  
  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    // Setup Express app with all middlewares and routes
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Add audit logger middleware BEFORE routes
    app.use(auditLogger);
    
    app.use('/api/auth', authRouter);
    app.use('/api/users', verifyToken, authorizeRoles('admin', 'operator'), usersRouter);
    app.use('/api/audit', auditRouter);
    
    // Set environment variables
    process.env.JWT_SECRET_KEY = 'test-secret-key-audit';
    process.env.JWT_TOKEN_TTL = '1h';
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // Clean up database connection and stop MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all data before each test
    await User.deleteMany({});
    await auditLog.deleteMany({});
    
    // Create test users
    const adminUser = new User({
      userId: 'admin001',
      username: 'adminuser',
      password: 'password123',
      role: 'admin',
      email: 'admin@example.com'
    });
    
    const regularUser = new User({
      userId: 'user001',
      username: 'regularuser',
      password: 'password123',
      role: 'viewer',
      email: 'user@example.com'
    });
    
    const savedUsers = await Promise.all([adminUser.save(), regularUser.save()]);
    
    // Generate tokens
    adminToken = jwt.sign(
      {
        _id: savedUsers[0]._id.toString(),
        userId: 'admin001',
        username: 'adminuser',
        role: 'admin',
        email: 'admin@example.com'
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );
    
    userToken = jwt.sign(
      {
        _id: savedUsers[1]._id.toString(),
        userId: 'user001',
        username: 'regularuser',
        role: 'viewer',
        email: 'user@example.com'
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );
  });

  describe('Audit Log Creation', () => {
    it('should create audit log for successful login', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'admin001',
          password: 'password123'
        })
        .expect(200);

      // Wait for async audit log creation
      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await auditLog.find({ path: '/api/auth/login' });
      expect(logs.length).toBeGreaterThan(0);
      
      const log = logs[0];
      expect(log.method).toBe('POST');
      expect(log.eventType).toBe('Login');
      expect(log.statusCode).toBe(200);
      // Note: userId will be null because auditLogger runs BEFORE verifyToken
      // The login endpoint doesn't use verifyToken middleware
      expect(log.ip).toBeDefined();
      expect(log.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should create audit log for failed login attempt', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'admin001',
          password: 'wrongpassword'
        })
        .expect(401);

      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await auditLog.find({ path: '/api/auth/login' });
      expect(logs.length).toBeGreaterThan(0);
      
      const log = logs[0];
      expect(log.method).toBe('POST');
      expect(log.statusCode).toBe(401);
      expect(log.eventType).toBe('Login');
    });

    it('should create audit log for user registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          userId: 'newuser001',
          username: 'newuser',
          password: 'password123',
          role: 'viewer',
          email: 'newuser@example.com'
        })
        .expect(201);

      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await auditLog.find({ path: '/api/auth/register' });
      expect(logs.length).toBeGreaterThan(0);
      
      const log = logs[0];
      expect(log.method).toBe('POST');
      expect(log.statusCode).toBe(201);
      expect(log.eventType).toBe('Create');
    });

    // it('should create audit log for authenticated GET request with user info', async () => {
    //   await request(app)
    //     .get('/api/users')
    //     .set('Authorization', `Bearer ${adminToken}`)
    //     .expect(200);

    //   await new Promise(resolve => setTimeout(resolve, 100));

    //   const logs = await auditLog.find({ path: '/api/users' });
    //   expect(logs.length).toBeGreaterThan(0);
      
    //   const log = logs[0];
    //   expect(log.method).toBe('GET');
    //   expect(log.statusCode).toBe(200);
    //   expect(log.eventType).toBe('View');
    //   // After verifyToken runs, user info should be available
    //   expect(log.userId).toBe('admin001');
    //   expect(log.userEmail).toBe('admin@example.com');
    // });

    // it('should create audit log for unauthorized access attempt', async () => {
    //   await request(app)
    //     .get('/api/users')
    //     .set('Authorization', `Bearer ${userToken}`)
    //     .expect(403);

    //   await new Promise(resolve => setTimeout(resolve, 100));

    //   const logs = await auditLog.find({ path: '/api/users' });
    //   expect(logs.length).toBeGreaterThan(0);
      
    //   const log = logs[0];
    //   expect(log.statusCode).toBe(403);
    //   expect(log.userId).toBe('user001');
    // });

    it('should sanitize sensitive data in request body', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'admin001',
          password: 'password123'
        })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await auditLog.find({ path: '/api/auth/login' });
      const log = logs[0];
      
      // Password should be redacted
      expect(log.requestBody.password).toBe('***REDACTED***');
      expect(log.requestBody.userId).toBe('admin001');
    });
  });

  describe('Audit Log Retrieval - GET /api/audit/logs', () => {
    beforeEach(async () => {
      // Create multiple audit logs for testing
      const sampleLogs = [
        {
          userId: 'admin001',
          userEmail: 'admin@example.com',
          method: 'GET',
          path: '/api/users',
          eventType: 'View',
          ip: '127.0.0.1',
          statusCode: 200,
          responseTime: 50
        },
        {
          userId: 'user001',
          userEmail: 'user@example.com',
          method: 'GET',
          path: '/api/users',
          eventType: 'View',
          ip: '127.0.0.1',
          statusCode: 403,
          responseTime: 30
        },
        {
          userId: 'admin001',
          userEmail: 'admin@example.com',
          method: 'POST',
          path: '/api/auth/login',
          eventType: 'Login',
          ip: '127.0.0.1',
          statusCode: 200,
          responseTime: 100
        },
        {
          userId: null,
          userEmail: null,
          method: 'POST',
          path: '/api/auth/register',
          eventType: 'Create',
          ip: '192.168.1.1',
          statusCode: 201,
          responseTime: 150
        }
      ];

      await auditLog.insertMany(sampleLogs);
    });

    it('should retrieve all audit logs with pagination (admin only)', async () => {
      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeGreaterThan(0);
    });

    it('should filter audit logs by userId', async () => {
      const response = await request(app)
        .get('/api/audit/logs?userId=admin001')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(log => log.userId === 'admin001')).toBe(true);
    });

    it('should filter audit logs by method', async () => {
      const response = await request(app)
        .get('/api/audit/logs?method=POST')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(log => log.method === 'POST')).toBe(true);
    });

    it('should filter audit logs by eventType', async () => {
      const response = await request(app)
        .get('/api/audit/logs?eventType=Login')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.every(log => log.eventType === 'Login')).toBe(true);
    });

    it('should apply pagination with custom limit', async () => {
      const response = await request(app)
        .get('/api/audit/logs?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination.limit).toBe(2);
      expect(response.body.pagination.page).toBe(1);
    });

    it('should deny non-admin access to audit logs', async () => {
      const response = await request(app)
        .get('/api/audit/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.message).toBe('Access Denied: Insufficient Role');
    });
  });

  describe('Audit Log Statistics - GET /api/audit/stats', () => {
    beforeEach(async () => {
      // Create sample logs for statistics
      const sampleLogs = [
        { method: 'GET', eventType: 'View', statusCode: 200, responseTime: 50, ip: '127.0.0.1', path: '/api/users', userId: 'admin001' },
        { method: 'GET', eventType: 'View', statusCode: 200, responseTime: 60, ip: '127.0.0.1', path: '/api/users', userId: 'admin001' },
        { method: 'POST', eventType: 'Login', statusCode: 200, responseTime: 100, ip: '127.0.0.1', path: '/api/auth/login', userId: 'admin001' },
        { method: 'POST', eventType: 'Create', statusCode: 201, responseTime: 150, ip: '127.0.0.1', path: '/api/auth/register', userId: null },
        { method: 'GET', eventType: 'View', statusCode: 403, responseTime: 30, ip: '127.0.0.1', path: '/api/users', userId: 'user001' }
      ];

      await auditLog.insertMany(sampleLogs);
    });

    it('should return audit statistics (admin only)', async () => {
      const response = await request(app)
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.byMethod).toBeDefined();
      expect(response.body.data.byEventType).toBeDefined();
      expect(response.body.data.byStatusCode).toBeDefined();
      expect(response.body.data.totalRequests).toBeDefined();
      expect(response.body.data.avgResponseTime).toBeDefined();
    });

    it('should calculate correct statistics', async () => {
      const response = await request(app)
        .get('/api/audit/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const stats = response.body.data;
      
      // Check method counts
      const getMethods = stats.byMethod.find(m => m._id === 'GET');
      const postMethods = stats.byMethod.find(m => m._id === 'POST');
      expect(getMethods.count).toBeGreaterThanOrEqual(3);
      expect(postMethods.count).toBeGreaterThanOrEqual(2);
      
      // Check total requests
      expect(stats.totalRequests[0].total).toBeGreaterThanOrEqual(5);
      
      // Check average response time exists
      expect(stats.avgResponseTime[0].avgTime).toBeGreaterThan(0);
    });
  });

  describe('User-Specific Logs - GET /api/audit/user/:userId', () => {
    beforeEach(async () => {
      const sampleLogs = [
        { method: 'GET', eventType: 'View', statusCode: 200, responseTime: 50, ip: '127.0.0.1', path: '/api/users', userId: 'admin001', userEmail: 'admin@example.com' },
        { method: 'POST', eventType: 'Login', statusCode: 200, responseTime: 100, ip: '127.0.0.1', path: '/api/auth/login', userId: 'admin001', userEmail: 'admin@example.com' },
        { method: 'GET', eventType: 'View', statusCode: 403, responseTime: 30, ip: '127.0.0.1', path: '/api/users', userId: 'user001', userEmail: 'user@example.com' }
      ];

      await auditLog.insertMany(sampleLogs);
    });

    it('should retrieve logs for specific user (admin only)', async () => {
      const response = await request(app)
        .get('/api/audit/user/admin001')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.every(log => log.userId === 'admin001')).toBe(true);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should return empty array for user with no logs', async () => {
      const response = await request(app)
        .get('/api/audit/user/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    it('should respect limit parameter for user logs', async () => {
      const response = await request(app)
        .get('/api/audit/user/admin001?limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle requests with no authentication gracefully', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);

      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await auditLog.find({ path: '/api/users' });
      expect(logs.length).toBeGreaterThan(0);
      
      const log = logs[0];
      expect(log.userId).toBeNull();
      expect(log.userEmail).toBeNull();
      expect(log.statusCode).toBe(401);
    });

    it('should capture IP address and user agent', async () => {
      await request(app)
        .post('/api/auth/login')
        .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
        .send({
          userId: 'admin001',
          password: 'password123'
        })
        .expect(200);

      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await auditLog.find({ path: '/api/auth/login' });
      const log = logs[0];
      
      expect(log.ip).toBeDefined();
      expect(log.ip).not.toBe('unknown');
      expect(log.userAgent).toBeDefined();
      expect(log.deviceInfo).toBeDefined();
    });

    // it('should handle query parameters in audit logs', async () => {
    //   await request(app)
    //     .get('/api/audit/logs?userId=admin001&limit=10')
    //     .set('Authorization', `Bearer ${adminToken}`)
    //     .expect(200);

    //   await new Promise(resolve => setTimeout(resolve, 100));

    //   const logs = await auditLog.find({ path: '/api/audit/logs' });
    //   const log = logs[0];
      
    //   expect(log.queryParams).toBeDefined();
    //   expect(log.queryParams.userId).toBe('admin001');
    //   expect(log.queryParams.limit).toBe('10');
    // });
  });
});