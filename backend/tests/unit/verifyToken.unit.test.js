import { jest } from '@jest/globals';

// Mock jwt
const mockVerify = jest.fn();

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    verify: mockVerify
  },
  verify: mockVerify
}));

// Import after mocking
const { verifyToken } = await import('../../src/middlewares/verifyToken.js');

describe('VerifyToken Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify.mockReset();
    
    req = {
      headers: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();

    // Mock environment variable
    process.env.JWT_SECRET_KEY = 'test-secret-key';
  });

  describe('Valid token scenarios', () => {
    it('should successfully verify valid token and call next()', () => {
      const mockDecoded = {
        _id: 'user123',
        userId: 'testuser',
        username: 'Test User',
        role: 'user',
        email: 'test@example.com'
      };

      req.headers['authorization'] = 'Bearer valid-token-12345';
      mockVerify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith('valid-token-12345', 'test-secret-key');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should verify token for admin user', () => {
      const mockDecoded = {
        _id: 'admin123',
        userId: 'adminuser',
        username: 'Admin User',
        role: 'admin',
        email: 'admin@example.com'
      };

      req.headers['authorization'] = 'Bearer admin-token-67890';
      mockVerify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(req.user).toEqual(mockDecoded);
      expect(req.user.role).toBe('admin');
      expect(next).toHaveBeenCalled();
    });

    it('should verify token for operator user', () => {
      const mockDecoded = {
        _id: 'operator123',
        userId: 'operatoruser',
        username: 'Operator User',
        role: 'operator',
        email: 'operator@example.com'
      };

      req.headers['authorization'] = 'Bearer operator-token-abcde';
      mockVerify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(req.user).toEqual(mockDecoded);
      expect(req.user.role).toBe('operator');
      expect(next).toHaveBeenCalled();
    });

    // it('should handle token with extra whitespace', () => {
    //   const mockDecoded = {
    //     _id: 'user123',
    //     userId: 'testuser',
    //     username: 'Test User',
    //     role: 'user',
    //     email: 'test@example.com'
    //   };

    //   req.headers['authorization'] = 'Bearer   token-with-spaces';
    //   mockVerify.mockReturnValue(mockDecoded);

    //   verifyToken(req, res, next);

    //   expect(mockVerify).toHaveBeenCalledWith('  token-with-spaces', 'test-secret-key');
    //   expect(req.user).toEqual(mockDecoded);
    //   expect(next).toHaveBeenCalled();
    // });
  });

  describe('Missing token scenarios', () => {
    it('should return 401 when authorization header is missing', () => {
      // No authorization header set
      verifyToken(req, res, next);

      expect(mockVerify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "no token found" });
    });

    it('should return 401 when authorization header is empty string', () => {
      req.headers['authorization'] = '';

      verifyToken(req, res, next);

      expect(mockVerify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "no token found" });
    });

    it('should return 401 when authorization header has no token part', () => {
      req.headers['authorization'] = 'Bearer';

      verifyToken(req, res, next);

      expect(mockVerify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "no token found" });
    });

    it('should return 401 when authorization header has only Bearer with space', () => {
      req.headers['authorization'] = 'Bearer ';

      verifyToken(req, res, next);

      expect(mockVerify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "no token found" });
    });

    it('should return 401 when token is null', () => {
      req.headers['authorization'] = null;

      verifyToken(req, res, next);

      expect(mockVerify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "no token found" });
    });

    it('should return 401 when token is undefined', () => {
      req.headers['authorization'] = undefined;

      verifyToken(req, res, next);

      expect(mockVerify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "no token found" });
    });
  });

  describe('Invalid token scenarios', () => {
    it('should return 403 when token is invalid', () => {
      req.headers['authorization'] = 'Bearer invalid-token';
      mockVerify.mockImplementation(() => {
        throw new Error('invalid token');
      });

      verifyToken(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith('invalid-token', 'test-secret-key');
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });

    it('should return 403 when token is expired', () => {
      req.headers['authorization'] = 'Bearer expired-token';
      mockVerify.mockImplementation(() => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      verifyToken(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith('expired-token', 'test-secret-key');
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });

    it('should return 403 when token signature is invalid', () => {
      req.headers['authorization'] = 'Bearer tampered-token';
      mockVerify.mockImplementation(() => {
        const error = new Error('invalid signature');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      verifyToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });

    it('should return 403 when token is malformed', () => {
      req.headers['authorization'] = 'Bearer malformed.token';
      mockVerify.mockImplementation(() => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      verifyToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });

    it('should handle unexpected errors during verification', () => {
      req.headers['authorization'] = 'Bearer some-token';
      mockVerify.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      verifyToken(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: "Invalid or expired token" });
    });
  });

  describe('Authorization header format variations', () => {
    it('should handle lowercase "bearer"', () => {
      const mockDecoded = {
        _id: 'user123',
        userId: 'testuser',
        username: 'Test User',
        role: 'user',
        email: 'test@example.com'
      };

      req.headers['authorization'] = 'bearer valid-token';
      mockVerify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith('valid-token', 'test-secret-key');
      expect(req.user).toEqual(mockDecoded);
      expect(next).toHaveBeenCalled();
    });

    // it('should handle authorization header with different casing', () => {
    //   const mockDecoded = {
    //     _id: 'user123',
    //     userId: 'testuser',
    //     username: 'Test User',
    //     role: 'user',
    //     email: 'test@example.com'
    //   };

    //   req.headers['Authorization'] = 'Bearer valid-token';
    //   mockVerify.mockReturnValue(mockDecoded);

    //   verifyToken(req, res, next);

    //   // This test might fail depending on how Express handles header casing
    //   // Express normalizes headers to lowercase
    //   expect(next).toHaveBeenCalled();
    // });

    it('should extract token from complex authorization string', () => {
      const mockDecoded = {
        _id: 'user123',
        userId: 'testuser',
        username: 'Test User',
        role: 'user',
        email: 'test@example.com'
      };

      req.headers['authorization'] = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123';
      mockVerify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(mockVerify).toHaveBeenCalledWith(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123', 
        'test-secret-key'
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Request object mutation', () => {
    it('should add user property to request object', () => {
      const mockDecoded = {
        _id: 'user123',
        userId: 'testuser',
        username: 'Test User',
        role: 'user',
        email: 'test@example.com'
      };

      req.headers['authorization'] = 'Bearer valid-token';
      mockVerify.mockReturnValue(mockDecoded);

      expect(req.user).toBeUndefined();

      verifyToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user).toEqual(mockDecoded);
    });

    it('should preserve all decoded token properties', () => {
      const mockDecoded = {
        _id: 'user123',
        userId: 'testuser',
        username: 'Test User',
        role: 'admin',
        email: 'test@example.com',
        iat: 1234567890,
        exp: 1234567900
      };

      req.headers['authorization'] = 'Bearer valid-token';
      mockVerify.mockReturnValue(mockDecoded);

      verifyToken(req, res, next);

      expect(req.user).toEqual(mockDecoded);
      expect(req.user.iat).toBe(1234567890);
      expect(req.user.exp).toBe(1234567900);
    });
  });
});