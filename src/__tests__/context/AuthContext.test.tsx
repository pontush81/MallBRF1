import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { User } from '../../types/User';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(() => Promise.resolve()),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return jest.fn(); // Return a mock unsubscribe function
  })
}));

// Mock the userService
jest.mock('../../services/userService');

// Mock Firebase auth module
jest.mock('../../services/firebase', () => ({
  auth: {}
}));

// Test component to access auth context
const TestComponent = ({ mockUser }: { mockUser: User }) => {
  const { user, loading, error, login, logout } = useAuth();
  return (
    <div>
      {loading && <div data-testid="loading">Loading...</div>}
      {error && <div data-testid="error">{error}</div>}
      {user && (
        <div data-testid="user">
          <div>{user.email}</div>
          <div>{user.role}</div>
        </div>
      )}
      <button onClick={() => login(mockUser)}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    isActive: true,
    createdAt: '2024-03-23T12:00:00Z',
    lastLogin: '2024-03-23T12:00:00Z'
  };

  const mockFirebaseUser = {
    uid: '1',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Reset the onAuthStateChanged mock to its default behavior
    const { onAuthStateChanged } = require('firebase/auth');
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn(); // Return a mock unsubscribe function
    });
  });

  it('provides initial loading state', async () => {
    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  it('handles successful login', async () => {
    // Mock userService to return user data
    (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

    // Mock Firebase auth to return a user
    const { onAuthStateChanged } = require('firebase/auth');
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockFirebaseUser);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockUser.role)).toBeInTheDocument();
    });
  });

  it('handles login error', async () => {
    // Mock userService to throw an error
    (userService.getUserById as jest.Mock).mockRejectedValue(new Error('Failed to fetch user'));

    // Mock Firebase auth to return a user
    const { onAuthStateChanged } = require('firebase/auth');
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockFirebaseUser);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch user data')).toBeInTheDocument();
    });
  });

  it('handles logout', async () => {
    // Mock userService to return user data
    (userService.getUserById as jest.Mock).mockResolvedValue(mockUser);

    // Mock Firebase auth to return a user initially
    const { onAuthStateChanged, signOut } = require('firebase/auth');
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockFirebaseUser);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user')).toBeInTheDocument();
    });

    // Click logout button
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });

    // Verify signOut was called
    expect(signOut).toHaveBeenCalled();

    // Verify user is logged out
    await waitFor(() => {
      expect(screen.queryByTestId('user')).not.toBeInTheDocument();
    });
  });

  it('restores user from localStorage on page reload', async () => {
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Mock Firebase auth to return no user (simulating page reload)
    const { onAuthStateChanged } = require('firebase/auth');
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(null);
      return jest.fn();
    });

    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('user')).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockUser.role)).toBeInTheDocument();
    });
  });
}); 