import { userService } from '../../services/userService';
import { auth, db } from '../../services/firebase';
import { User } from '../../types/User';

jest.mock('../../services/firebase');

describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockFirebaseUser = {
        uid: '123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      const mockUserData = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      };

      // Mock Firebase auth
      (auth.signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ 
        user: mockFirebaseUser 
      });

      // Mock Firestore
      (db.doc as jest.Mock).mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: () => true,
          data: () => mockUserData
        })
      });

      const result = await userService.login('test@example.com', 'password123');

      expect(result).toEqual(mockUserData);
      expect(auth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });

    it('should handle login errors', async () => {
      (auth.signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const result = await userService.login('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockFirebaseUser = {
        uid: '123',
        email: 'test@example.com'
      };

      const expectedUser: User = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
        createdAt: expect.any(String),
        lastLogin: expect.any(String)
      };

      // Mock Firebase auth
      (auth.createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockFirebaseUser
      });

      // Mock Firestore
      (db.doc as jest.Mock).mockReturnValue({
        set: jest.fn().mockResolvedValue(undefined)
      });

      const result = await userService.register(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(result).toMatchObject(expectedUser);
      expect(auth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });

    it('should handle registration errors', async () => {
      (auth.createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('Email already in use')
      );

      const result = await userService.register(
        'existing@example.com',
        'password123',
        'Test User'
      );

      expect(result).toBeNull();
    });
  });
}); 