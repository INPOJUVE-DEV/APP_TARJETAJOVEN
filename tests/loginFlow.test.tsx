import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../src/pages/Login';

const authMocks = vi.hoisted(() => ({
  login: vi.fn(),
  clearErrorMessage: vi.fn(),
}));

vi.mock('../src/lib/useAuth', () => ({
  useAuth: () => ({
    login: authMocks.login,
    clearErrorMessage: authMocks.clearErrorMessage,
    status: 'unauthenticated',
    errorMessage: null,
    isAuthReady: true,
  }),
}));

describe('Login flow', () => {
  beforeEach(() => {
    cleanup();
    authMocks.login.mockReset();
    authMocks.clearErrorMessage.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('envia correo y contrasena al iniciar sesion local', async () => {
    authMocks.login.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/correo/i), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/contra/i), {
      target: { value: 'Segura123456' },
    });

    fireEvent.submit(screen.getByLabelText(/correo/i).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(authMocks.login).toHaveBeenCalledWith('ana@example.com', 'Segura123456');
    });
    expect(screen.getByRole('link', { name: /olvid/i })).toBeTruthy();
  });
});
