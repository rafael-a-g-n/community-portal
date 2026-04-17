import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminLoginPage from './AdminLoginPage';
import * as authService from '../services/authService';

const renderWithRouter = (component) =>
  render(<BrowserRouter>{component}</BrowserRouter>);

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the login form', () => {
    renderWithRouter(<AdminLoginPage />);
    expect(screen.getByText('auth.adminPortal')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.username')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /auth.signIn/i })).toBeInTheDocument();
  });

  it('navigates to dashboard on successful login', async () => {
    vi.spyOn(authService, 'login').mockResolvedValue('fake-token');
    renderWithRouter(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'password123' } });
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('admin', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('shows an error message on invalid credentials', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue({
      response: { status: 400 },
    });
    renderWithRouter(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'wrongpass' } });
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent(
        'auth.invalidCredentials'
      );
    });
  });

  it('shows a generic error on server failure', async () => {
    vi.spyOn(authService, 'login').mockRejectedValue({ response: { status: 500 } });
    renderWithRouter(<AdminLoginPage />);

    fireEvent.change(screen.getByLabelText('auth.username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByTestId('login-form'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent(
        'auth.serverError'
      );
    });
  });
});
