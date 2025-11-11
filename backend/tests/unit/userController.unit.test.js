import { jest } from '@jest/globals';

// Mock User model
const mockFind = jest.fn();

jest.unstable_mockModule('../../src/models/user.js', () => ({
  default: {
    find: mockFind
  }
}));

// Import after mocking
const { getAllUsers } = await import('../../src/controllers/usersController.js');

describe('UsersController Unit Tests', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFind.mockReset();
    
    req = {};
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      const mockUsers = [
        {
          _id: 'id1',
          userId: 'user1',
          username: 'testuser1',
          role: 'user',
          email: 'user1@example.com'
        },
        {
          _id: 'id2',
          userId: 'user2',
          username: 'testuser2',
          role: 'admin',
          email: 'user2@example.com'
        },
        {
          _id: 'id3',
          userId: 'user3',
          username: 'testuser3',
          role: 'operator',
          email: 'user3@example.com'
        }
      ];

      mockFind.mockResolvedValue(mockUsers);

      await getAllUsers(req, res);

      expect(mockFind).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      mockFind.mockResolvedValue([]);

      await getAllUsers(req, res);

      expect(mockFind).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith([]);
    });

    it('should return 404 when database error occurs', async () => {
      mockFind.mockRejectedValue(new Error('Database connection error'));

      await getAllUsers(req, res);

      expect(mockFind).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Unable to fetch users" });
    });

    it('should handle database timeout errors', async () => {
      mockFind.mockRejectedValue(new Error('Query timeout'));

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Unable to fetch users" });
    });

    it('should handle unexpected errors gracefully', async () => {
      mockFind.mockRejectedValue(new Error('Unexpected error'));

      await getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: "Unable to fetch users" });
    });
  });
});