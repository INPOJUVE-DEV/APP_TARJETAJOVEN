import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../src/pages/Login';

const authMocks = vi.hoisted(() => ({
  loginWithCredentials: vi.fn(),
  refreshProfile: vi.fn(),
  clearErrorMessage: vi.fn(),
}));

vi.mock('../src/lib/useAuth', () => ({
  useAuth: () => ({
    loginWithCredentials: authMocks.loginWithCredentials,
    refreshProfile: authMocks.refreshProfile,
    clearErrorMessage: authMocks.clearErrorMessage,
    status: 'unauthenticated',
    errorMessage: null,
    isAuthReady: true,
  }),
}));

describe('Login flow', () => {
  beforeEach(() => {
    cleanup();
    authMocks.loginWithCredentials.mockReset();
    authMocks.refreshProfile.mockReset();
    authMocks.clearErrorMessage.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envia correo y contrasena al iniciar sesion', async () => {
    authMocks.loginWithCredentials.mockResolvedValue({
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      scope: 'openid profile email offline_access',
      expiresAt: Date.now() + 3_600_000,
    });
    authMocks.refreshProfile.mockResolvedValue({
      id: '1',
      nombre: 'Ana',
      apellidos: 'Lopez',
    });

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contrasena'), {
      target: { value: 'Secreta123' },
    });

    fireEvent.submit(screen.getByLabelText('Correo').closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(authMocks.loginWithCredentials).toHaveBeenCalledWith('ana@example.com', 'Secreta123');
    });
    expect(authMocks.refreshProfile).toHaveBeenCalled();
  });
});
