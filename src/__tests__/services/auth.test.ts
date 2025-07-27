import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { userService } from '../../services/userService';
import { User } from '../../types/User';

// Mock Firebase modules
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../../services/firebase', () => ({
  auth: {},
  db: {}
}));

describe('User Authentication', () => {
  const mockUser: User = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should login user successfully', async () => {
    const mockAuthResult = {
      user: { uid: mockUser.id, email: mockUser.email }
    };

    const mockUserDoc = {
      exists: () => true,
      data: () => mockUser
    };

    (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockAuthResult);
    (doc as jest.Mock).mockReturnValue({});
    (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

    const result = await userService.login('test@example.com', 'password');

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
    expect(doc).toHaveBeenCalledWith(db, 'users', mockUser.id);
    expect(getDoc).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it('should register new user successfully', async () => {
    const mockAuthResult = {
      user: { uid: mockUser.id, email: mockUser.email }
    };

    (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockAuthResult);
    (updateProfile as jest.Mock).mockResolvedValue(undefined);
    (doc as jest.Mock).mockReturnValue({});
    (setDoc as jest.Mock).mockResolvedValue(undefined);

    const result = await userService.register('test@example.com', 'password', 'Test User');

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password');
    expect(updateProfile).toHaveBeenCalledWith(mockAuthResult.user, { displayName: 'Test User' });
    expect(doc).toHaveBeenCalledWith(db, 'users', mockUser.id);
    expect(setDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      id: mockUser.id,
      email: mockUser.email,
      name: 'Test User',
      role: 'user',
      isActive: true
    }));
    expect(result).toBeTruthy();
  });

  it('should update user profile successfully', async () => {
    const updatedData: Partial<User> = {
      name: 'Updated Name',
      role: 'admin' as const
    };

    const mockUserDoc = {
      exists: () => true,
      data: () => ({ ...mockUser, ...updatedData })
    };

    (doc as jest.Mock).mockReturnValue({});
    (updateDoc as jest.Mock).mockResolvedValue(undefined);
    (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);

    await userService.updateUserStatus(mockUser.id, { isActive: true });

    expect(doc).toHaveBeenCalledWith(db, 'users', mockUser.id);
    expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { isActive: true });
  });

  it('should delete user successfully', async () => {
    (doc as jest.Mock).mockReturnValue({});
    (deleteDoc as jest.Mock).mockResolvedValue(undefined);

    const result = await userService.deleteUser(mockUser.id);

    expect(doc).toHaveBeenCalledWith(db, 'users', mockUser.id);
    expect(deleteDoc).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('should handle login error', async () => {
    const error = new Error('Invalid credentials');
    (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

    const result = await userService.login('test@example.com', 'wrong-password');
    expect(result).toBeNull();
  });

  it('should handle registration error', async () => {
    const error = new Error('Email already in use');
    (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

    const result = await userService.register('test@example.com', 'password', 'Test User');
    expect(result).toBeNull();
  });
}); 