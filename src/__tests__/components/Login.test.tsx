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

  it('should render login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
    
    expect(screen.getByLabelText(/e-postadress/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lösenord/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logga in/i })).toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    };

    (userService.login as jest.Mock).mockResolvedValue(mockUser);
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

    fireEvent.change(screen.getByLabelText(/e-postadress/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: 'password123' }
    });

    fireEvent.click(screen.getByRole('button', { name: /logga in/i }));

    await waitFor(() => {
      expect(userService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(mockAuthLogin).toHaveBeenCalledWith(mockUser);
      expect(mockNavigate).toHaveBeenCalledWith('/pages');
    });
  });

  it('should handle login error', async () => {
    (userService.login as jest.Mock).mockResolvedValue(null);

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/e-postadress/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/lösenord/i), {
      target: { value: 'wrongpassword' }
    });

    fireEvent.click(screen.getByRole('button', { name: /logga in/i }));

    await waitFor(() => {
      expect(screen.getByText(/felaktig e-post eller lösenord/i)).toBeInTheDocument();
    });
  });

  it('should validate required fields', async () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /logga in/i }));

    await waitFor(() => {
      expect(screen.getByText(/vänligen fyll i både e-post och lösenord/i)).toBeInTheDocument();
    });
  });

  it('should fill demo user credentials', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /användare/i }));

    expect(screen.getByLabelText(/e-postadress/i)).toHaveValue('user@example.com');
    expect(screen.getByLabelText(/lösenord/i)).toHaveValue('password123');
  });
}); 