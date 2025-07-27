import { userService } from '../../services/userService';
import { auth, db } from '../../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from '../../types/User';

jest.mock('../../services/firebase');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

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
        role: 'user' as const,
        isActive: true,
        createdAt: '2023-01-01T00:00:00Z',
        lastLogin: '2023-01-01T00:00:00Z'
      };

      // Mock Firebase auth
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({ 
        user: mockFirebaseUser 
      });

      // Mock Firestore
      (doc as jest.Mock).mockReturnValue({});
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      });

      const result = await userService.login('test@example.com', 'password123');

      expect(result).toEqual(mockUserData);
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });

    it('should handle login errors', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      const result = await userService.login('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockFirebaseUser = {
        uid: '456',
        email: 'new@example.com',
        displayName: 'New User'
      };

      const expectedUser = {
        id: '456',
        email: 'new@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
        createdAt: expect.any(String),
        lastLogin: expect.any(String)
      };

      // Mock Firebase auth
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockFirebaseUser
      });

      // Mock Firestore
      (doc as jest.Mock).mockReturnValue({});
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await userService.register(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(result).toMatchObject(expectedUser);
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });

    it('should handle registration errors', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(
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