import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Activation from '../src/pages/Activation';

const authMocks = vi.hoisted(() => ({
  signupWithCredentials: vi.fn(),
  loginWithCredentials: vi.fn(),
  refreshProfile: vi.fn(),
  clearErrorMessage: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('../src/lib/useAuth', () => ({
  useAuth: () => ({
    signupWithCredentials: authMocks.signupWithCredentials,
    loginWithCredentials: authMocks.loginWithCredentials,
    refreshProfile: authMocks.refreshProfile,
    clearErrorMessage: authMocks.clearErrorMessage,
    logout: authMocks.logout,
  }),
}));

describe('Activation flow', () => {
  beforeEach(() => {
    cleanup();
    window.sessionStorage.clear();
    window.localStorage.clear();
    authMocks.signupWithCredentials.mockReset();
    authMocks.loginWithCredentials.mockReset();
    authMocks.refreshProfile.mockReset();
    authMocks.clearErrorMessage.mockReset();
    authMocks.logout.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('valida la tarjeta, limpia la CURP y espera el boton explicito para crear acceso', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ can_activate: true, message: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(
      <MemoryRouter>
        <Activation />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Numero de tarjeta'), {
      target: { value: 'TJ-000123' },
    });
    fireEvent.change(screen.getByLabelText('CURP'), {
      target: { value: 'MELR000202MSPSRD06' },
    });

    fireEvent.submit(screen.getByLabelText('Numero de tarjeta').closest('form') as HTMLFormElement);

    await screen.findByText('Tarjeta validada correctamente. Ahora crea tu acceso con correo y contrasena.');

    expect(authMocks.signupWithCredentials).not.toHaveBeenCalled();
    expect(authMocks.loginWithCredentials).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('CURP')).toBeNull();
    expect(window.sessionStorage.getItem('tj.auth.pending-activation')).not.toContain('MELR000202MSPSRD06');

    fireEvent.click(screen.getByRole('button', { name: 'Crear mi acceso' }));

    expect(screen.getByLabelText('Correo')).toBeTruthy();
    expect(screen.getByLabelText('Contrasena')).toBeTruthy();
  });

  it('muestra el estado blocked cuando la API devuelve 403', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'No permitido' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(
      <MemoryRouter>
        <Activation />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Numero de tarjeta'), {
      target: { value: 'TJ-000123' },
    });
    fireEvent.change(screen.getByLabelText('CURP'), {
      target: { value: 'MELR000202MSPSRD06' },
    });

    fireEvent.submit(screen.getByLabelText('Numero de tarjeta').closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText('Esta tarjeta no esta activa. Acude a soporte.')).toBeTruthy();
    });
  });
});
