import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { User } from '../../types/User';

// Mock the userService
jest.mock('../../services/userService');

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

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('provides initial loading state', () => {
    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Trigger login
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    // Wait for user to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('user')).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockUser.role)).toBeInTheDocument();
    });

    // Check if user was stored in localStorage
    const storedUser = localStorage.getItem('user');
    expect(storedUser).toBeTruthy();
    expect(JSON.parse(storedUser || '{}')).toEqual(mockUser);
  });

  it('handles login error', async () => {
    const errorMessage = 'Failed to fetch user data';
    (userService.getUserById as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    // Trigger login
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles logout', async () => {
    // Set up initial user state
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user')).toBeInTheDocument();
    });

    // Trigger logout
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });

    // Wait for user to be cleared
    await waitFor(() => {
      expect(screen.queryByTestId('user')).not.toBeInTheDocument();
    });

    // Check if user was removed from localStorage
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('restores user from localStorage on page reload', async () => {
    // Set up initial user state in localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <TestComponent mockUser={mockUser} />
      </AuthProvider>
    );

    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user')).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
      expect(screen.getByText(mockUser.role)).toBeInTheDocument();
    });
  });
}); 