import { jest } from '@jest/globals';

// Mock modules before importing them
const mockSave = jest.fn();
const mockFindOne = jest.fn();
const mockFind = jest.fn();
const mockCompare = jest.fn();
const mockSign = jest.fn();
const mockSendMail = jest.fn();

// Mock User model - KEY FIX: Export both the constructor and static methods
jest.unstable_mockModule('../../src/models/user.js', () => ({
  default: Object.assign(
    jest.fn().mockImplementation(() => ({
      save: mockSave
    })),
    {
      findOne: mockFindOne,
      find: mockFind
    }
  )
}));

// Mock bcrypt
jest.unstable_mockModule('bcrypt', () => ({
  default: {
    compare: mockCompare
  },
  compare: mockCompare
}));

// Mock jsonwebtoken
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: mockSign
  },
  sign: mockSign
}));

// Mock nodemailer
jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn(() => ({
      sendMail: mockSendMail
    }))
  }
}));

// Import after mocking
const { createNewUser, handleUserLogin, handleForgotPassword } = await import('../../src/controllers/authController.js');
const User = (await import('../../src/models/user.js')).default;
const bcrypt = await import('bcrypt');
const jwt = await import('jsonwebtoken');

describe('AuthController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    mockSave.mockReset();
    mockFindOne.mockReset();
    mockFind.mockReset();
    mockCompare.mockReset();
    mockSign.mockReset();
    mockSendMail.mockReset();
    
    // Setup request and response objects
    req = {
      body: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    // Mock environment variables
    process.env.JWT_SECRET_KEY = 'test-secret-key';
    process.env.JWT_TOKEN_TTL = '1h';
    process.env.MAILTRAP_USER = 'test-user';
    process.env.MAILTRAP_PASSWORD = 'test-password';
  });

  describe('createNewUser', () => {
    it('should create a new user successfully', async () => {
      req.body = {
        userId: 'user123',
        username: 'testuser',
        password: 'password123',
        role: 'user',
        email: 'test@example.com'
      };

      mockSave.mockResolvedValue();

      await createNewUser(req, res);

      expect(User).toHaveBeenCalledWith({
        userId: 'user123',
        username: 'testuser',
        password: 'password123',
        role: 'user',
        email: 'test@example.com'
      });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "new User created" });
    });

    it('should create an admin user successfully', async () => {
      req.body = {
        userId: 'admin123',
        username: 'adminuser',
        password: 'adminpass123',
        role: 'admin',
        email: 'admin@example.com'
      };

      mockSave.mockResolvedValue();

      await createNewUser(req, res);

      expect(User).toHaveBeenCalledWith({
        userId: 'admin123',
        username: 'adminuser',
        password: 'adminpass123',
        role: 'admin',
        email: 'admin@example.com'
      });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "new User created" });
    });

    it('should create an operator user successfully', async () => {
      req.body = {
        userId: 'operator123',
        username: 'operatoruser',
        password: 'operatorpass123',
        role: 'operator',
        email: 'operator@example.com'
      };

      mockSave.mockResolvedValue();

      await createNewUser(req, res);

      expect(User).toHaveBeenCalledWith({
        userId: 'operator123',
        username: 'operatoruser',
        password: 'operatorpass123',
        role: 'operator',
        email: 'operator@example.com'
      });
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "new User created" });
    });

    it('should return 409 when user already exists (duplicate key error)', async () => {
      req.body = {
        userId: 'user123',
        username: 'testuser',
        password: 'password123',
        role: 'user',
        email: 'test@example.com'
      };

      mockSave.mockRejectedValue({ code: 11000 });

      await createNewUser(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: "user already exists" });
    });

    it('should return 400 for other errors', async () => {
      req.body = {
        userId: 'user123',
        username: 'testuser',
        password: 'password123',
        role: 'user',
        email: 'test@example.com'
      };

      mockSave.mockRejectedValue(new Error('Database error'));

      await createNewUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: "user was NOT created" });
    });
  });

  describe('handleUserLogin', () => {
    const mockRegularUser = {
      _id: 'mockId123',
      userId: 'user123',
      username: 'testuser',
      password: '$2b$10$hashedpassword',
      role: 'user',
      email: 'test@example.com'
    };

    const mockAdminUser = {
      _id: 'mockId456',
      userId: 'admin123',
      username: 'adminuser',
      password: '$2b$10$hashedadminpassword',
      role: 'admin',
      email: 'admin@example.com'
    };

    const mockOperatorUser = {
      _id: 'mockId789',
      userId: 'operator123',
      username: 'operatoruser',
      password: '$2b$10$hashedoperatorpassword',
      role: 'operator',
      email: 'operator@example.com'
    };

    it('should login user successfully with valid credentials', async () => {
      req.body = {
        userId: 'user123',
        password: 'password123'
      };

      mockFindOne.mockResolvedValue(mockRegularUser);
      mockCompare.mockResolvedValue(true);
      mockSign.mockReturnValue('mock-jwt-token');

      await handleUserLogin(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockCompare).toHaveBeenCalledWith('password123', mockRegularUser.password);
      expect(mockSign).toHaveBeenCalledWith(
        {
          _id: mockRegularUser._id,
          userId: mockRegularUser.userId,
          username: mockRegularUser.username,
          role: mockRegularUser.role,
          email: mockRegularUser.email
        },
        'test-secret-key',
        { expiresIn: '1h' }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock-jwt-token',
        user: {
          _id: mockRegularUser._id,
          userId: mockRegularUser.userId,
          username: mockRegularUser.username,
          role: mockRegularUser.role,
          email: mockRegularUser.email
        }
      });
    });

    it('should login admin successfully with valid credentials', async () => {
      req.body = {
        userId: 'admin123',
        password: 'adminpass123'
      };

      mockFindOne.mockResolvedValue(mockAdminUser);
      mockCompare.mockResolvedValue(true);
      mockSign.mockReturnValue('mock-admin-jwt-token');

      await handleUserLogin(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'admin123' });
      expect(mockCompare).toHaveBeenCalledWith('adminpass123', mockAdminUser.password);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock-admin-jwt-token',
        user: {
          _id: mockAdminUser._id,
          userId: mockAdminUser.userId,
          username: mockAdminUser.username,
          role: 'admin',
          email: mockAdminUser.email
        }
      });
    });

    it('should login operator successfully with valid credentials', async () => {
      req.body = {
        userId: 'operator123',
        password: 'operatorpass123'
      };

      mockFindOne.mockResolvedValue(mockOperatorUser);
      mockCompare.mockResolvedValue(true);
      mockSign.mockReturnValue('mock-operator-jwt-token');

      await handleUserLogin(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'operator123' });
      expect(mockCompare).toHaveBeenCalledWith('operatorpass123', mockOperatorUser.password);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        token: 'mock-operator-jwt-token',
        user: {
          _id: mockOperatorUser._id,
          userId: mockOperatorUser.userId,
          username: mockOperatorUser.username,
          role: 'operator',
          email: mockOperatorUser.email
        }
      });
    });

    it('should return 404 when user is not found', async () => {
      req.body = {
        userId: 'nonexistent',
        password: 'password123'
      };

      mockFindOne.mockResolvedValue(null);

      await handleUserLogin(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'nonexistent' });
      expect(mockCompare).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "user NOT found" });
    });

    it('should return 401 when password is incorrect', async () => {
      req.body = {
        userId: 'user123',
        password: 'wrongpassword'
      };

      mockFindOne.mockResolvedValue(mockRegularUser);
      mockCompare.mockResolvedValue(false);

      await handleUserLogin(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockCompare).toHaveBeenCalledWith('wrongpassword', mockRegularUser.password);
      expect(mockSign).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "username or password is wrong" });
    });

    it('should return 500 when database error occurs', async () => {
      req.body = {
        userId: 'user123',
        password: 'password123'
      };

      mockFindOne.mockRejectedValue(new Error('Database error'));

      await handleUserLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "error finding the user" });
    });

    it('should handle bcrypt comparison errors', async () => {
      req.body = {
        userId: 'user123',
        password: 'password123'
      };

      mockFindOne.mockResolvedValue(mockRegularUser);
      mockCompare.mockRejectedValue(new Error('Bcrypt error'));

      await handleUserLogin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "error finding the user" });
    });
  });

  describe('handleForgotPassword', () => {
    const mockUser = {
      _id: 'mockId123',
      userId: 'user123',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };

    const mockAdmins = [
      {
        _id: 'adminId1',
        userId: 'admin1',
        username: 'admin1',
        email: 'admin1@example.com',
        role: 'admin'
      },
      {
        _id: 'adminId2',
        userId: 'admin2',
        username: 'admin2',
        email: 'admin2@example.com',
        role: 'admin'
      }
    ];

    it('should send password reset email to admins successfully', async () => {
      req.body = {
        userId: 'user123',
        email: 'test@example.com'
      };

      mockFindOne.mockResolvedValue(mockUser);
      mockFind.mockResolvedValue(mockAdmins);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await handleForgotPassword(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({ 
        userId: 'user123', 
        email: 'test@example.com' 
      });
      expect(mockFind).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@oblivion-itim.com',
        to: 'admin1@example.com,admin2@example.com',
        subject: 'Password Reset Request',
        text: expect.stringContaining('User ID: user123')
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset request has been sent to administrators'
      });
    });

    it('should send email to single admin when only one exists', async () => {
      req.body = {
        userId: 'user123',
        email: 'test@example.com'
      };

      mockFindOne.mockResolvedValue(mockUser);
      mockFind.mockResolvedValue([mockAdmins[0]]);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await handleForgotPassword(req, res);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin1@example.com'
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when user is not found', async () => {
      req.body = {
        userId: 'nonexistent',
        email: 'test@example.com'
      };

      mockFindOne.mockResolvedValue(null);

      await handleForgotPassword(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({ 
        userId: 'nonexistent', 
        email: 'test@example.com' 
      });
      expect(mockFind).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "User not found or email doesn't match"
      });
    });

    it('should return 404 when email does not match user', async () => {
      req.body = {
        userId: 'user123',
        email: 'wrong@example.com'
      };

      mockFindOne.mockResolvedValue(null);

      await handleForgotPassword(req, res);

      expect(mockFindOne).toHaveBeenCalledWith({ 
        userId: 'user123', 
        email: 'wrong@example.com' 
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: "User not found or email doesn't match"
      });
    });

    it('should return 500 when no admin users exist', async () => {
      req.body = {
        userId: 'user123',
        email: 'test@example.com'
      };

      mockFindOne.mockResolvedValue(mockUser);
      mockFind.mockResolvedValue([]);

      await handleForgotPassword(req, res);

      expect(mockFindOne).toHaveBeenCalled();
      expect(mockFind).toHaveBeenCalledWith({ role: 'admin' });
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No admin users found in the system'
      });
    });

    it('should return 500 when admin query returns null', async () => {
      req.body = {
        userId: 'user123',
        email: 'test@example.com'
      };

      mockFindOne.mockResolvedValue(mockUser);
      mockFind.mockResolvedValue(null);

      await handleForgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'No admin users found in the system'
      });
    });

    it('should return 500 when email sending fails', async () => {
      req.body = {
        userId: 'user123',
        email: 'test@example.com'
      };

      mockFindOne.mockResolvedValue(mockUser);
      mockFind.mockResolvedValue(mockAdmins);
      mockSendMail.mockRejectedValue(new Error('Email service error'));

      await handleForgotPassword(req, res);

      expect(mockSendMail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error processing forgot password request'
      });
    });

    it('should return 500 when database error occurs while finding user', async () => {
      req.body = {
        userId: 'user123',
        email: 'test@example.com'
      };

      mockFindOne.mockRejectedValue(new Error('Database error'));

      await handleForgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error processing forgot password request'
      });
    });

    it('should return 500 when database error occurs while finding admins', async () => {
      req.body = {
        userId: 'user123',
        email: 'test@example.com'
      };

      mockFindOne.mockResolvedValue(mockUser);
      mockFind.mockRejectedValue(new Error('Database error'));

      await handleForgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error processing forgot password request'
      });
    });

    it('should include correct user details in email content', async () => {
      req.body = {
        userId: 'user123',
        email: 'test@example.com'
      };

      mockFindOne.mockResolvedValue(mockUser);
      mockFind.mockResolvedValue(mockAdmins);
      mockSendMail.mockResolvedValue({ messageId: 'test-message-id' });

      await handleForgotPassword(req, res);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'noreply@oblivion-itim.com',
        to: 'admin1@example.com,admin2@example.com',
        subject: 'Password Reset Request',
        text: expect.stringMatching(/User ID: user123/)
      });
      
      const emailCall = mockSendMail.mock.calls[0][0];
      expect(emailCall.text).toContain('User ID: user123');
      expect(emailCall.text).toContain('Username: testuser');
      expect(emailCall.text).toContain('Email: test@example.com');
    });
  });
});