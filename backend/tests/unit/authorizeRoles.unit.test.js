import { jest } from '@jest/globals';
import { authorizeRoles } from '../../src/middlewares/authorizeRoles.js';

describe('AuthorizeRoles Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    next = jest.fn();
  });

  describe('Single role authorization', () => {
    it('should allow access when user has the required role (admin)', () => {
      req.user = {
        _id: 'user123',
        userId: 'admin1',
        username: 'adminuser',
        role: 'admin',
        email: 'admin@example.com'
      };

      const middleware = authorizeRoles('admin');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should allow access when user has the required role (operator)', () => {
      req.user = {
        _id: 'user456',
        userId: 'operator1',
        username: 'operatoruser',
        role: 'operator',
        email: 'operator@example.com'
      };

      const middleware = authorizeRoles('operator');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has the required role (user)', () => {
      req.user = {
        _id: 'user789',
        userId: 'user1',
        username: 'regularuser',
        role: 'user',
        email: 'user@example.com'
      };

      const middleware = authorizeRoles('user');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have the required role', () => {
      req.user = {
        _id: 'user123',
        userId: 'user1',
        username: 'regularuser',
        role: 'user',
        email: 'user@example.com'
      };

      const middleware = authorizeRoles('admin');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Access Denied: Insufficient Role" 
      });
    });
  });

  describe('Multiple roles authorization', () => {
    it('should allow access when user has one of the allowed roles (admin)', () => {
      req.user = {
        _id: 'admin123',
        userId: 'admin1',
        username: 'adminuser',
        role: 'admin',
        email: 'admin@example.com'
      };

      const middleware = authorizeRoles('admin', 'operator');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of the allowed roles (operator)', () => {
      req.user = {
        _id: 'operator123',
        userId: 'operator1',
        username: 'operatoruser',
        role: 'operator',
        email: 'operator@example.com'
      };

      const middleware = authorizeRoles('admin', 'operator');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access when user role is not in allowed roles', () => {
      req.user = {
        _id: 'user123',
        userId: 'user1',
        username: 'regularuser',
        role: 'user',
        email: 'user@example.com'
      };

      const middleware = authorizeRoles('admin', 'operator');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Access Denied: Insufficient Role" 
      });
    });

    it('should allow access with three allowed roles', () => {
      req.user = {
        _id: 'user123',
        userId: 'user1',
        username: 'regularuser',
        role: 'user',
        email: 'user@example.com'
      };

      const middleware = authorizeRoles('admin', 'operator', 'user');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should return 401 when req.user is not present', () => {
      req.user = null;

      const middleware = authorizeRoles('admin');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "User not authenticated" 
      });
    });

    it('should return 401 when req.user is undefined', () => {
      req.user = undefined;

      const middleware = authorizeRoles('admin', 'operator');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "User not authenticated" 
      });
    });

    it('should deny access when user.role is missing', () => {
      req.user = {
        _id: 'user123',
        userId: 'user1',
        username: 'regularuser',
        email: 'user@example.com'
        // role is missing
      };

      const middleware = authorizeRoles('admin');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        message: "Access Denied: Insufficient Role" 
      });
    });

    it('should handle empty role string', () => {
      req.user = {
        _id: 'user123',
        userId: 'user1',
        username: 'regularuser',
        role: '',
        email: 'user@example.com'
      };

      const middleware = authorizeRoles('admin');
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should be case-sensitive with role matching', () => {
      req.user = {
        _id: 'user123',
        userId: 'admin1',
        username: 'adminuser',
        role: 'Admin', // Capital A
        email: 'admin@example.com'
      };

      const middleware = authorizeRoles('admin'); // lowercase
      middleware(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('Middleware chaining', () => {
    it('should work correctly when called multiple times', () => {
      req.user = {
        _id: 'admin123',
        userId: 'admin1',
        username: 'adminuser',
        role: 'admin',
        email: 'admin@example.com'
      };

      const middleware1 = authorizeRoles('admin', 'operator');
      const middleware2 = authorizeRoles('admin');

      middleware1(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Reset next
      next.mockClear();

      middleware2(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});