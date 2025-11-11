import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../../src/models/user.js';
import authRouter from '../../src/routes/authRouter.js';
import usersRouter from '../../src/routes/usersRouter.js';
import { verifyToken } from '../../src/middlewares/verifyToken.js';
import { authorizeRoles } from '../../src/middlewares/authorizeRoles.js';

describe('Authentication and Authorization Integration Tests', () => {
  let app;
  let mongoServer;
  
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
    app.use('/api/auth', authRouter);
    app.use('/api/users', verifyToken, authorizeRoles('admin', 'operator'), usersRouter);
    
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
    // Clear all users before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register - User Registration', () => {
    it('should register a new regular user successfully', async () => {
      const userData = {
        userId: 'user001',
        username: 'testuser',
        password: 'password123',
        role: 'viewer',
        email: 'testuser@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual({ message: 'new User created' });

      // Verify user was created in database
      const user = await User.findOne({ userId: 'user001' });
      expect(user).toBeTruthy();
      expect(user.username).toBe('testuser');
      expect(user.role).toBe('viewer');
      expect(user.email).toBe('testuser@example.com');
      
      // Verify password is hashed
      expect(user.password).not.toBe('password123');
      const isPasswordHashed = await bcrypt.compare('password123', user.password);
      expect(isPasswordHashed).toBe(true);
    });

    it('should register a new admin user successfully', async () => {
      const adminData = {
        userId: 'admin001',
        username: 'adminuser',
        password: 'adminpass123',
        role: 'admin',
        email: 'admin@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      expect(response.body).toEqual({ message: 'new User created' });

      const admin = await User.findOne({ userId: 'admin001' });
      expect(admin).toBeTruthy();
      expect(admin.role).toBe('admin');
    });

    it('should register a new operator user successfully', async () => {
      const operatorData = {
        userId: 'operator001',
        username: 'operatoruser',
        password: 'operatorpass123',
        role: 'operator',
        email: 'operator@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(operatorData)
        .expect(201);

      const operator = await User.findOne({ userId: 'operator001' });
      expect(operator).toBeTruthy();
      expect(operator.role).toBe('operator');
    });

    it('should return 409 when trying to register with duplicate userId', async () => {
      const userData = {
        userId: 'user001',
        username: 'testuser',
        password: 'password123',
        role: 'viewer',
        email: 'testuser@example.com'
      };

      // Create first user
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body).toEqual({ message: 'user already exists' });
    });

    it('should return 409 when trying to register with duplicate email', async () => {
      const user1 = {
        userId: 'user001',
        username: 'testuserone',
        password: 'password123',
        role: 'viewer',
        email: 'test@example.com'
      };

      const user2 = {
        userId: 'user002',
        username: 'testusertwo',
        password: 'password456',
        role: 'viewer',
        email: 'test@example.com' // Same email
      };

      await request(app)
        .post('/api/auth/register')
        .send(user1)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/register')
        .send(user2)
        .expect(409);

      expect(response.body).toEqual({ message: 'user already exists' });
    });

    it('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        userId: 'user001',
        username: 'testuser'
        // Missing password, role, email
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body).toEqual({ message: 'user was NOT created' });
    });
  });

  describe('POST /api/auth/login - User Login', () => {
    beforeEach(async () => {
      // Create test users with different roles using the model to trigger pre-save hook
      const users = [
        new User({
          userId: 'user001',
          username: 'regularuser',
          password: 'password123',
          role: 'viewer',
          email: 'user@example.com'
        }),
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
        })
      ];

      // Save all users to trigger password hashing
      await Promise.all(users.map(user => user.save()));
    });

    it('should login regular user successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'user001',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        userId: 'user001',
        username: 'regularuser',
        role: 'viewer',
        email: 'user@example.com'
      });

      // Verify token is valid
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET_KEY);
      expect(decoded.userId).toBe('user001');
      expect(decoded.role).toBe('viewer');
    });

    it('should login admin successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'admin001',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.user.role).toBe('admin');
      
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET_KEY);
      expect(decoded.role).toBe('admin');
    });

    it('should login operator successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'operator001',
          password: 'password123'
        })
        .expect(200);

      expect(response.body.user.role).toBe('operator');
      
      const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET_KEY);
      expect(decoded.role).toBe('operator');
    });

    it('should return 404 when user does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'nonexistent',
          password: 'password123'
        })
        .expect(404);

      expect(response.body).toEqual({ message: 'user NOT found' });
    });

    it('should return 401 when password is incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'user001',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toEqual({ message: 'username or password is wrong' });
    });

    it('should return 404 when userId is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        })
        .expect(404);

      expect(response.body).toEqual({ message: 'user NOT found' });
    });

    it('should return 500 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'user001'
        })
        .expect(500);

      expect(response.body).toEqual({ message: 'error finding the user' });
    });
  });

  describe('GET /api/users - Protected Route with Role Authorization', () => {
    let adminToken, operatorToken, userToken;

    beforeEach(async () => {
      // Create test users using the model to trigger pre-save hook
      const users = [
        new User({
          userId: 'user001',
          username: 'regularuser',
          password: 'password123',
          role: 'viewer',
          email: 'user@example.com'
        }),
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
        })
      ];

      // Save all users
      const savedUsers = await Promise.all(users.map(user => user.save()));

      // Generate tokens for each user
      adminToken = jwt.sign(
        {
          _id: savedUsers[1]._id.toString(),
          userId: 'admin001',
          username: 'adminuser',
          role: 'admin',
          email: 'admin@example.com'
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
      );

      operatorToken = jwt.sign(
        {
          _id: savedUsers[2]._id.toString(),
          userId: 'operator001',
          username: 'operatoruser',
          role: 'operator',
          email: 'operator@example.com'
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
      );

      userToken = jwt.sign(
        {
          _id: savedUsers[0]._id.toString(),
          userId: 'user001',
          username: 'regularuser',
          role: 'viewer',
          email: 'user@example.com'
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' }
      );
    });

    it('should allow admin to access users list', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      expect(response.body.some(u => u.role === 'admin')).toBe(true);
      expect(response.body.some(u => u.role === 'operator')).toBe(true);
      expect(response.body.some(u => u.role === 'viewer')).toBe(true);
    });

    it('should allow operator to access users list', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('should deny regular user access to users list (403)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body).toEqual({ message: 'Access Denied: Insufficient Role' });
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toEqual({ message: 'no token found' });
    });

    it('should return 401 when Authorization header is malformed', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'InvalidFormat')
        .expect(401);

      expect(response.body).toEqual({ message: 'no token found' });
    });

    it('should return 403 when token is invalid', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(403);

      expect(response.body).toEqual({ message: 'Invalid or expired token' });
    });

    it('should return 403 when token is expired', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        {
          _id: 'someId',
          userId: 'admin001',
          username: 'adminuser',
          role: 'admin',
          email: 'admin@example.com'
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '0s' } // Expired immediately
      );

      // Wait a moment to ensure token is expired
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(403);

      expect(response.body).toEqual({ message: 'Invalid or expired token' });
    });

    it('should return 403 when token is signed with wrong secret', async () => {
      const wrongSecretToken = jwt.sign(
        {
          _id: 'someId',
          userId: 'admin001',
          username: 'adminuser',
          role: 'admin',
          email: 'admin@example.com'
        },
        'wrong-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .expect(403);

      expect(response.body).toEqual({ message: 'Invalid or expired token' });
    });
  });

  describe('Complete Authentication Flow', () => {
    it('should complete full registration -> login -> access protected resource flow', async () => {
      // Step 1: Register a new admin user
      const adminData = {
        userId: 'admin999',
        username: 'newadmin',
        password: 'securepass123',
        role: 'admin',
        email: 'newadmin@example.com'
      };

      await request(app)
        .post('/api/auth/register')
        .send(adminData)
        .expect(201);

      // Step 2: Login with the new admin
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          userId: 'admin999',
          password: 'securepass123'
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('token');
      const token = loginResponse.body.token;

      // Step 3: Access protected resource with the token
      const usersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(usersResponse.body)).toBe(true);
      expect(usersResponse.body.some(u => u.userId === 'admin999')).toBe(true);
    });

    it('should handle multiple users with different roles accessing resources', async () => {
      // Create multiple users
      const users = [
        {
          userId: 'user101',
          username: 'vieweruser',
          password: 'pass123',
          role: 'viewer',
          email: 'user1@example.com'
        },
        {
          userId: 'operator101',
          username: 'operatoruser',
          password: 'pass123',
          role: 'operator',
          email: 'operator1@example.com'
        },
        {
          userId: 'admin101',
          username: 'adminuser',
          password: 'pass123',
          role: 'admin',
          email: 'admin1@example.com'
        }
      ];

      // Register all users
      for (const user of users) {
        await request(app)
          .post('/api/auth/register')
          .send(user)
          .expect(201);
      }

      // Login all users and get tokens
      const tokens = {};
      for (const user of users) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({ userId: user.userId, password: user.password });
        tokens[user.role] = response.body.token;
      }

      // Test access with admin token - should succeed
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokens.admin}`)
        .expect(200);

      // Test access with operator token - should succeed
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokens.operator}`)
        .expect(200);

      // Test access with user token - should fail
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${tokens.viewer}`)
        .expect(403);
    });

    it('should prevent access after token expiration', async () => {
      // Create user with very short token TTL
      const originalTTL = process.env.JWT_TOKEN_TTL;
      process.env.JWT_TOKEN_TTL = '1s';

      const userData = {
        userId: 'tempuser',
        username: 'tempuser',
        password: 'password123',
        role: 'admin',
        email: 'temp@example.com'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ userId: 'tempuser', password: 'password123' })
        .expect(200);

      const token = loginResponse.body.token;

      // Wait for token to expire
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Try to access protected route with expired token
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      // Restore original TTL
      process.env.JWT_TOKEN_TTL = originalTTL;
    });
  });

  describe('Edge Cases and Security', () => {
    it('should not expose password in user response', async () => {
      const user = new User({
        userId: 'user999',
        username: 'testuser',
        password: 'password123',
        role: 'viewer',
        email: 'test@example.com'
      });
      await user.save();

      const response = await request(app)
        .post('/api/auth/login')
        .send({ userId: 'user999', password: 'password123' })
        .expect(200);

      expect(response.body.user.password).toBeUndefined();
    });

    it('should handle special characters in passwords', async () => {
      const userData = {
        userId: 'user888',
        username: 'testuser',
        password: 'p@$w0rd!#%^&*()',
        role: 'viewer',
        email: 'test@example.com'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ userId: 'user888', password: 'p@$w0rd!#%^&*()' })
        .expect(200);

      expect(response.body).toHaveProperty('token');
    });

    it('should be case-sensitive for passwords', async () => {
      const userData = {
        userId: 'user777',
        username: 'testuser',
        password: 'Password123',
        role: 'viewer',
        email: 'test@example.com'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Try with lowercase
      await request(app)
        .post('/api/auth/login')
        .send({ userId: 'user777', password: 'password123' })
        .expect(401);

      // Try with correct case
      await request(app)
        .post('/api/auth/login')
        .send({ userId: 'user777', password: 'Password123' })
        .expect(200);
    });

    it('should handle concurrent login attempts', async () => {
      const user = new User({
        userId: 'user666',
        username: 'testuser',
        password: 'password123',
        role: 'viewer',
        email: 'test@example.com'
      });
      await user.save();

      // Simulate concurrent login requests
      const loginPromises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({ userId: 'user666', password: 'password123' })
      );

      const responses = await Promise.all(loginPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
      });
    });
  });
});