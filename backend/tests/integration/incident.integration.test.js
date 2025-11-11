import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../src/models/user.js';
import Incident from '../../src/models/incident.js';
import incidentRouter from '../../src/routes/incidentRouter.js';
import { verifyToken } from '../../src/middlewares/verifyToken.js';
import { authorizeRoles } from '../../src/middlewares/authorizeRoles.js';

describe('Incident Management Integration Tests', () => {
  let app;
  let mongoServer;
  let adminToken, operatorToken, viewerToken;
  let adminUser, operatorUser, viewerUser;

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
    app.use('/api/incidents', incidentRouter);

    // Set environment variables
    process.env.JWT_SECRET_KEY = 'test-secret-key-integration';
    process.env.JWT_TOKEN_TTL = '1h';
    process.env.NODE_ENV = 'test';
  });

  afterAll(async () => {
    // Clean up database connection and stop MongoDB server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await User.deleteMany({});
    await Incident.deleteMany({});

    // Create test users with different roles
    const users = [
      new User({
        userId: 'admin001',
        username: 'adminuser',
        password: 'password123',
        role: 'admin',
        email: 'admin@example.com'
      }),
      new User({
        userId: 'operator001',
        username: 'operatoruser',
        password: 'password123',
        role: 'operator',
        email: 'operator@example.com'
      }),
      new User({
        userId: 'viewer001',
        username: 'vieweruser',
        password: 'password123',
        role: 'viewer',
        email: 'viewer@example.com'
      })
    ];

    const savedUsers = await Promise.all(users.map(user => user.save()));
    [adminUser, operatorUser, viewerUser] = savedUsers;

    // Generate tokens for each user
    adminToken = jwt.sign(
      {
        _id: adminUser._id.toString(),
        userId: adminUser.userId,
        username: adminUser.username,
        role: adminUser.role,
        email: adminUser.email
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    operatorToken = jwt.sign(
      {
        _id: operatorUser._id.toString(),
        userId: operatorUser.userId,
        username: operatorUser.username,
        role: operatorUser.role,
        email: operatorUser.email
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      {
        _id: viewerUser._id.toString(),
        userId: viewerUser.userId,
        username: viewerUser.username,
        role: viewerUser.role,
        email: viewerUser.email
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/incidents - Create Incident', () => {
    it('should create a new incident as admin successfully', async () => {
      const incidentData = {
        title: 'Server Down',
        description: 'Production server is not responding',
        priority: 'high',
        assignedTo: operatorUser._id.toString()
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'Server Down',
        description: 'Production server is not responding',
        priority: 'high',
        status: 'open'
      });
      expect(response.body).toHaveProperty('ticketId');
      expect(response.body.ticketId).toMatch(/^IT-\d{6}-\d{4}$/);
      expect(response.body.assignedTo).toMatchObject({
        username: 'operatoruser',
        email: 'operator@example.com',
        role: 'operator'
      });
      expect(response.body.createdBy).toMatchObject({
        username: 'adminuser',
        email: 'admin@example.com',
        role: 'admin'
      });

      // Verify incident was created in database
      const incident = await Incident.findById(response.body._id);
      expect(incident).toBeTruthy();
      expect(incident.title).toBe('Server Down');
    });

    it('should create a new incident as operator successfully', async () => {
      const incidentData = {
        title: 'Network Issue',
        description: 'Slow network connectivity',
        priority: 'medium',
        assignedTo: operatorUser._id.toString()
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body.createdBy).toMatchObject({
        username: 'operatoruser',
        role: 'operator'
      });
    });

    it('should create incident with default medium priority when not specified', async () => {
      const incidentData = {
        title: 'Minor Bug',
        description: 'UI alignment issue',
        assignedTo: operatorUser._id.toString()
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incidentData)
        .expect(201);

      expect(response.body.priority).toBe('medium');
    });

    it('should return 403 when viewer tries to create incident', async () => {
      const incidentData = {
        title: 'Server Down',
        description: 'Production server issue',
        priority: 'high',
        assignedTo: operatorUser._id.toString()
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(incidentData)
        .expect(403);

      expect(response.body).toEqual({ message: 'Access Denied: Insufficient Role' });
    });

    it('should return 400 when required fields are missing', async () => {
      const incidentData = {
        description: 'Missing title and assignedTo'
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incidentData)
        .expect(400);

      expect(response.body).toEqual({
        message: 'Please provide title, description, and assignedTo fields'
      });
    });

    it('should return 404 when assigned user does not exist', async () => {
      const incidentData = {
        title: 'Server Down',
        description: 'Production server issue',
        assignedTo: new mongoose.Types.ObjectId().toString()
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(incidentData)
        .expect(404);

      expect(response.body).toEqual({ message: 'Assigned user not found' });
    });

    it('should return 401 when no token is provided', async () => {
      const incidentData = {
        title: 'Server Down',
        description: 'Production server issue',
        assignedTo: operatorUser._id.toString()
      };

      const response = await request(app)
        .post('/api/incidents')
        .send(incidentData)
        .expect(401);

      expect(response.body).toEqual({ message: 'no token found' });
    });

    it('should handle all priority levels correctly', async () => {
      const priorities = ['lowest', 'low', 'medium', 'high', 'highest'];

      for (const priority of priorities) {
        const incidentData = {
          title: `Incident ${priority}`,
          description: `Testing ${priority} priority`,
          priority,
          assignedTo: operatorUser._id.toString()
        };

        const response = await request(app)
          .post('/api/incidents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(incidentData)
          .expect(201);

        expect(response.body.priority).toBe(priority);
      }
    });
  });

  describe('GET /api/incidents - Get All Incidents', () => {
    beforeEach(async () => {
      // Create multiple test incidents
      const incidents = [
        {
          ticketId: 'IT-123456-1001',
          title: 'Server Down',
          description: 'Production server issue',
          status: 'open',
          priority: 'high',
          assignedTo: operatorUser._id,
          createdBy: adminUser._id
        },
        {
          ticketId: 'IT-123456-1002',
          title: 'Network Issue',
          description: 'Slow network',
          status: 'inProgress',
          priority: 'medium',
          assignedTo: operatorUser._id,
          createdBy: adminUser._id
        },
        {
          ticketId: 'IT-123456-1003',
          title: 'Database Error',
          description: 'Connection timeout',
          status: 'resolved',
          priority: 'highest',
          assignedTo: operatorUser._id,
          createdBy: operatorUser._id,
          resolvedAt: new Date()
        }
      ];

      await Incident.insertMany(incidents);
    });

    it('should get all incidents as admin', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      
      // Verify populated fields
      response.body.forEach(incident => {
        expect(incident.assignedTo).toHaveProperty('username');
        expect(incident.assignedTo).toHaveProperty('email');
        expect(incident.createdBy).toHaveProperty('username');
        expect(incident.createdBy).toHaveProperty('email');
      });
    });

    it('should get all incidents as operator', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.length).toBe(3);
    });

    it('should get all incidents as viewer', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.length).toBe(3);
    });

    it('should return incidents sorted by newest first', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify descending order
      for (let i = 0; i < response.body.length - 1; i++) {
        const current = new Date(response.body[i].createdAt);
        const next = new Date(response.body[i + 1].createdAt);
        expect(current >= next).toBe(true);
      }
    });

    it('should return empty array when no incidents exist', async () => {
      await Incident.deleteMany({});

      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/incidents')
        .expect(401);

      expect(response.body).toEqual({ message: 'no token found' });
    });
  });

  describe('GET /api/incidents/:id - Get Incident By ID', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await Incident.create({
        ticketId: 'IT-123456-9999',
        title: 'Test Incident',
        description: 'Test description',
        status: 'open',
        priority: 'high',
        assignedTo: operatorUser._id,
        createdBy: adminUser._id
      });
    });

    it('should get incident by ID as admin', async () => {
      const response = await request(app)
        .get(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Test Incident',
        description: 'Test description',
        status: 'open',
        priority: 'high'
      });
      expect(response.body.assignedTo.username).toBe('operatoruser');
      expect(response.body.createdBy.username).toBe('adminuser');
    });

    it('should get incident by ID as operator', async () => {
      const response = await request(app)
        .get(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.title).toBe('Test Incident');
    });

    it('should get incident by ID as viewer', async () => {
      const response = await request(app)
        .get(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.title).toBe('Test Incident');
    });

    it('should return 400 when incident ID format is invalid', async () => {
      const response = await request(app)
        .get('/api/incidents/invalidid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toEqual({ message: 'Invalid incident ID format' });
    });

    it('should return 404 when incident does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/incidents/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toEqual({ message: 'Incident not found' });
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get(`/api/incidents/${testIncident._id}`)
        .expect(401);

      expect(response.body).toEqual({ message: 'no token found' });
    });
  });

  describe('PUT /api/incidents/:id - Update Incident', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await Incident.create({
        ticketId: 'IT-123456-8888',
        title: 'Original Title',
        description: 'Original description',
        status: 'open',
        priority: 'medium',
        assignedTo: operatorUser._id,
        createdBy: adminUser._id
      });
    });

    it('should update incident as admin', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'high'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        title: 'Updated Title',
        description: 'Updated description',
        priority: 'high'
      });

      // Verify in database
      const updated = await Incident.findById(testIncident._id);
      expect(updated.title).toBe('Updated Title');
    });

    it('should update incident as operator', async () => {
      const updateData = {
        status: 'inProgress'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('inProgress');
    });

    it('should set resolvedAt timestamp when status changes to resolved', async () => {
      const updateData = {
        status: 'resolved'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('resolved');
      expect(response.body.resolvedAt).toBeTruthy();
      expect(new Date(response.body.resolvedAt)).toBeInstanceOf(Date);
    });

    it('should clear resolvedAt when status changes from resolved to another status', async () => {
      // First, set to resolved
      await Incident.findByIdAndUpdate(testIncident._id, {
        status: 'resolved',
        resolvedAt: new Date()
      });

      // Then change to open
      const updateData = {
        status: 'open'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('open');
      expect(response.body.resolvedAt).toBeNull();
    });

    it('should update assignedTo field', async () => {
      const updateData = {
        assignedTo: viewerUser._id.toString()
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.assignedTo._id).toBe(viewerUser._id.toString());
      expect(response.body.assignedTo.username).toBe('vieweruser');
    });

    it('should return 403 when viewer tries to update incident', async () => {
      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toEqual({ message: 'Access Denied: Insufficient Role' });
    });

    it('should return 400 when incident ID format is invalid', async () => {
      const response = await request(app)
        .put('/api/incidents/invalidid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Title' })
        .expect(400);

      expect(response.body).toEqual({ message: 'Invalid incident ID format' });
    });

    it('should return 400 when assignedTo user ID format is invalid', async () => {
      const updateData = {
        assignedTo: 'invaliduserid'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toEqual({ message: 'Invalid user ID format' });
    });

    it('should return 404 when assigned user does not exist', async () => {
      const updateData = {
        assignedTo: new mongoose.Types.ObjectId().toString()
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({ message: 'Assigned user not found' });
    });

    it('should return 404 when incident does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .put(`/api/incidents/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(response.body).toEqual({ message: 'Incident not found' });
    });

    it('should handle partial updates', async () => {
      const updateData = {
        priority: 'highest'
      };

      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.priority).toBe('highest');
      expect(response.body.title).toBe('Original Title'); // Should remain unchanged
      expect(response.body.description).toBe('Original description'); // Should remain unchanged
    });
  });

  describe('DELETE /api/incidents/:id - Delete Incident', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await Incident.create({
        ticketId: 'IT-123456-7777',
        title: 'To Be Deleted',
        description: 'This incident will be deleted',
        status: 'open',
        priority: 'low',
        assignedTo: operatorUser._id,
        createdBy: adminUser._id
      });
    });

    it('should delete incident as admin', async () => {
      const response = await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toEqual({ message: 'Incident removed' });

      // Verify incident was deleted from database
      const deleted = await Incident.findById(testIncident._id);
      expect(deleted).toBeNull();
    });

    it('should return 403 when operator tries to delete incident', async () => {
      const response = await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);

      expect(response.body).toEqual({ message: 'Access Denied: Insufficient Role' });

      // Verify incident still exists
      const incident = await Incident.findById(testIncident._id);
      expect(incident).toBeTruthy();
    });

    it('should return 403 when viewer tries to delete incident', async () => {
      const response = await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body).toEqual({ message: 'Access Denied: Insufficient Role' });
    });

    it('should return 404 when incident does not exist', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .delete(`/api/incidents/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toEqual({ message: 'Incident not found' });
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .expect(401);

      expect(response.body).toEqual({ message: 'no token found' });
    });
  });

  describe('Complete Incident Workflow', () => {
    it('should complete full create -> get -> update -> delete workflow', async () => {
      // Step 1: Create incident
      const createResponse = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Workflow Test',
          description: 'Testing complete workflow',
          priority: 'medium',
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      const incidentId = createResponse.body._id;

      // Step 2: Get incident by ID
      const getResponse = await request(app)
        .get(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(getResponse.body.title).toBe('Workflow Test');

      // Step 3: Update incident
      const updateResponse = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          status: 'inProgress',
          description: 'Working on it'
        })
        .expect(200);

      expect(updateResponse.body.status).toBe('inProgress');

      // Step 4: Mark as resolved
      await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'resolved' })
        .expect(200);

      // Step 5: Delete incident
      await request(app)
        .delete(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deletion
      const deleted = await Incident.findById(incidentId);
      expect(deleted).toBeNull();
    });

    it('should handle multiple incidents created by different users', async () => {
      // Admin creates incident
      const incident1 = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Incident',
          description: 'Created by admin',
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      // Operator creates incident
      const incident2 = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          title: 'Operator Incident',
          description: 'Created by operator',
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      // Get all incidents
      const allIncidents = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(allIncidents.body.length).toBe(2);
      expect(allIncidents.body.some(i => i.createdBy.role === 'admin')).toBe(true);
      expect(allIncidents.body.some(i => i.createdBy.role === 'operator')).toBe(true);
    });

    it('should track incident lifecycle with timestamps', async () => {
      // Create incident
      const createResponse = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Lifecycle Test',
          description: 'Testing timestamps',
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      const incidentId = createResponse.body._id;
      const createdAt = new Date(createResponse.body.createdAt);

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update to resolved
      const resolvedResponse = await request(app)
        .put(`/api/incidents/${incidentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' })
        .expect(200);

      const resolvedAt = new Date(resolvedResponse.body.resolvedAt);

      expect(resolvedAt > createdAt).toBe(true);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should not allow SQL injection in incident fields', async () => {
      const maliciousData = {
        title: "'; DROP TABLE incidents; --",
        description: 'Malicious description',
        assignedTo: operatorUser._id.toString()
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(maliciousData)
        .expect(201);

      // MongoDB should handle this safely
      expect(response.body.title).toBe("'; DROP TABLE incidents; --");
      
      // Verify all incidents still exist
      const incidents = await Incident.find({});
      expect(incidents.length).toBe(1);
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'A'.repeat(120); // Max length is 120

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Long Description Test',
          description: longDescription,
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      expect(response.body.description).toBe(longDescription);
    });

    it('should handle concurrent updates to same incident', async () => {
      const incident = await Incident.create({
        ticketId: 'IT-123456-6666',
        title: 'Concurrent Test',
        description: 'Testing concurrent updates',
        status: 'open',
        priority: 'medium',
        assignedTo: operatorUser._id,
        createdBy: adminUser._id
      });

      // Simulate concurrent update requests
      const updatePromises = [
        request(app)
          .put(`/api/incidents/${incident._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ priority: 'high' }),
        request(app)
          .put(`/api/incidents/${incident._id}`)
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({ status: 'inProgress' })
      ];

      const responses = await Promise.all(updatePromises);

      // Both should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify final state
      const updated = await Incident.findById(incident._id);
      expect(updated).toBeTruthy();
    });

    it('should handle special characters in incident fields', async () => {
      const specialCharsData = {
        title: 'Test !@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Special chars: émojis 🚀 and symbols ™️©️®️',
        assignedTo: operatorUser._id.toString()
      };

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specialCharsData)
        .expect(201);

      expect(response.body.title).toBe(specialCharsData.title);
      expect(response.body.description).toBe(specialCharsData.description);
    });

    it('should generate unique ticket IDs for multiple incidents', async () => {
      const incidents = [];

      // Create 10 incidents rapidly
      for (let i = 0; i < 10; i++) {
        const response = await request(app)
          .post('/api/incidents')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: `Incident ${i}`,
            description: `Description ${i}`,
            assignedTo: operatorUser._id.toString()
          })
          .expect(201);

        incidents.push(response.body.ticketId);
      }

      // Verify all ticket IDs are unique
      const uniqueIds = new Set(incidents);
      expect(uniqueIds.size).toBe(10);

      // Verify format
      incidents.forEach(ticketId => {
        expect(ticketId).toMatch(/^IT-\d{6}-\d{4}$/);
      });
    });

    it('should maintain data integrity when updating non-existent fields', async () => {
      const incident = await Incident.create({
        ticketId: 'IT-123456-5555',
        title: 'Integrity Test',
        description: 'Testing data integrity',
        status: 'open',
        priority: 'medium',
        assignedTo: operatorUser._id,
        createdBy: adminUser._id
      });

      const response = await request(app)
        .put(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title',
          nonExistentField: 'Should be ignored'
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Title');
      expect(response.body.nonExistentField).toBeUndefined();
    });

    it('should handle incident with maximum length title', async () => {
      const maxTitle = 'A'.repeat(40); // Max length is 40

      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: maxTitle,
          description: 'Testing max title length',
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      expect(response.body.title).toBe(maxTitle);
      expect(response.body.title.length).toBe(40);
    });

    it('should not expose sensitive user data in populated fields', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Security Test',
          description: 'Testing data exposure',
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      // Verify password is not exposed
      expect(response.body.assignedTo.password).toBeUndefined();
      expect(response.body.createdBy.password).toBeUndefined();

      // Verify only allowed fields are present
      expect(response.body.assignedTo).toHaveProperty('username');
      expect(response.body.assignedTo).toHaveProperty('email');
      expect(response.body.assignedTo).toHaveProperty('role');
      expect(response.body.assignedTo).not.toHaveProperty('userId');
    });
  });

  describe('Role-Based Access Control', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await Incident.create({
        ticketId: 'IT-123456-4444',
        title: 'RBAC Test',
        description: 'Testing role-based access',
        status: 'open',
        priority: 'medium',
        assignedTo: operatorUser._id,
        createdBy: adminUser._id
      });
    });

    it('should allow admin full access to all operations', async () => {
      // Create
      await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Create',
          description: 'Testing admin create',
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      // Read
      await request(app)
        .get(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Update
      await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Update' })
        .expect(200);

      // Delete
      await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should allow operator create, read, and update but not delete', async () => {
      // Create
      await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          title: 'Operator Create',
          description: 'Testing operator create',
          assignedTo: operatorUser._id.toString()
        })
        .expect(201);

      // Read
      await request(app)
        .get(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      // Update
      await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ title: 'Operator Update' })
        .expect(200);

      // Delete - should fail
      await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(403);
    });

    it('should allow viewer only read access', async () => {
      // Read all - should succeed
      await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      // Read single - should succeed
      await request(app)
        .get(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      // Create - should fail
      await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          title: 'Viewer Create',
          description: 'Should fail',
          assignedTo: operatorUser._id.toString()
        })
        .expect(403);

      // Update - should fail
      await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ title: 'Viewer Update' })
        .expect(403);

      // Delete - should fail
      await request(app)
        .delete(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);
    });
  });

  describe('Incident Status Transitions', () => {
    let testIncident;

    beforeEach(async () => {
      testIncident = await Incident.create({
        ticketId: 'IT-123456-3333',
        title: 'Status Test',
        description: 'Testing status transitions',
        status: 'open',
        priority: 'medium',
        assignedTo: operatorUser._id,
        createdBy: adminUser._id
      });
    });

    it('should transition from open to inProgress', async () => {
      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'inProgress' })
        .expect(200);

      expect(response.body.status).toBe('inProgress');
      expect(response.body.resolvedAt).toBeNull();
    });

    it('should transition from inProgress to resolved with timestamp', async () => {
      // First set to inProgress
      await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'inProgress' })
        .expect(200);

      // Then set to resolved
      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'resolved' })
        .expect(200);

      expect(response.body.status).toBe('resolved');
      expect(response.body.resolvedAt).toBeTruthy();
    });

    it('should reopen resolved incident and clear timestamp', async () => {
      // Set to resolved
      await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'resolved' })
        .expect(200);

      // Reopen
      const response = await request(app)
        .put(`/api/incidents/${testIncident._id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'open' })
        .expect(200);

      expect(response.body.status).toBe('open');
      expect(response.body.resolvedAt).toBeNull();
    });

    it('should handle all valid status values', async () => {
      const statuses = ['open', 'inProgress', 'resolved'];

      for (const status of statuses) {
        const response = await request(app)
          .put(`/api/incidents/${testIncident._id}`)
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({ status })
          .expect(200);

        expect(response.body.status).toBe(status);
      }
    });
  });

  describe('Performance and Load', () => {
    it('should handle creating multiple incidents efficiently', async () => {
      const startTime = Date.now();
      const createPromises = [];

      for (let i = 0; i < 20; i++) {
        createPromises.push(
          request(app)
            .post('/api/incidents')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              title: `Bulk Incident ${i}`,
              description: `Bulk description ${i}`,
              assignedTo: operatorUser._id.toString()
            })
        );
      }

      const responses = await Promise.all(createPromises);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
      });

      // Verify all created
      const allIncidents = await Incident.find({});
      expect(allIncidents.length).toBe(20);

      // Should complete reasonably fast
      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });

    it('should efficiently retrieve large number of incidents', async () => {
      // Create 50 incidents
      const incidents = [];
      for (let i = 0; i < 50; i++) {
        incidents.push({
          ticketId: `IT-123456-${1000 + i}`,
          title: `Performance Test ${i}`,
          description: `Description ${i}`,
          status: 'open',
          priority: 'medium',
          assignedTo: operatorUser._id,
          createdBy: adminUser._id
        });
      }
      await Incident.insertMany(incidents);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const endTime = Date.now();

      expect(response.body.length).toBe(50);
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });
  });
});