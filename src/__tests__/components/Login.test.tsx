import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/auth/Login';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

// Mock the auth context
jest.mock('../../context/AuthContext');
jest.mock('../../services/userService');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      login: jest.fn(),
      isLoggedIn: false,
      loading: false
    });
  });

  it('should render social login buttons', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByRole('button', { name: /google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /microsoft/i })).toBeInTheDocument();
    expect(screen.getByText(/logga in med ditt sociala konto/i)).toBeInTheDocument();
  });

  it('should handle successful Google login', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    };

    (userService.loginWithGoogle as jest.Mock).mockResolvedValue(mockUser);
    const mockAuthLogin = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockAuthLogin,
      isLoggedIn: false,
      loading: false
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(userService.loginWithGoogle).toHaveBeenCalled();
      expect(mockAuthLogin).toHaveBeenCalledWith(mockUser);
      expect(mockNavigate).toHaveBeenCalledWith('/pages');
    });
  });

  it('should handle successful Microsoft login', async () => {
    const mockUser = {
      id: '456',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    };

    (userService.loginWithMicrosoft as jest.Mock).mockResolvedValue(mockUser);
    const mockAuthLogin = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockAuthLogin,
      isLoggedIn: false,
      loading: false
    });

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /microsoft/i }));

    await waitFor(() => {
      expect(userService.loginWithMicrosoft).toHaveBeenCalled();
      expect(mockAuthLogin).toHaveBeenCalledWith(mockUser);
      expect(mockNavigate).toHaveBeenCalledWith('/pages');
    });
  });

  it('should handle login error', async () => {
    const mockError = new Error('Authentication failed');
    (userService.loginWithGoogle as jest.Mock).mockRejectedValue(mockError);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /google/i }));

    await waitFor(() => {
      expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
    });
  });
}); 