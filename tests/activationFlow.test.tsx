import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Activation from '../src/pages/Activation';

const authMocks = vi.hoisted(() => ({
  verifyActivation: vi.fn(),
  completeActivation: vi.fn(),
  clearErrorMessage: vi.fn(),
}));

vi.mock('../src/lib/useAuth', () => ({
  useAuth: () => ({
    verifyActivation: authMocks.verifyActivation,
    completeActivation: authMocks.completeActivation,
    clearErrorMessage: authMocks.clearErrorMessage,
  }),
}));

describe('Activation flow', () => {
  beforeEach(() => {
    cleanup();
    window.sessionStorage.clear();
    authMocks.verifyActivation.mockReset();
    authMocks.completeActivation.mockReset();
    authMocks.clearErrorMessage.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('valida la tarjeta y habilita la creacion de acceso', async () => {
    authMocks.verifyActivation.mockResolvedValue({ can_activate: true, message: 'ok' });

    render(
      <MemoryRouter>
        <Activation />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/numero|número/i), {
      target: { value: 'TJ-000123' },
    });
    fireEvent.change(screen.getByLabelText(/^curp$/i), {
      target: { value: 'MELR000202MSPSRD06' },
    });

    fireEvent.submit(screen.getByLabelText(/numero|número/i).closest('form') as HTMLFormElement);

    await screen.findByText(/Tarjeta validada correctamente/i);

    expect(screen.queryByLabelText(/^curp$/i)).toBeNull();
    expect(window.sessionStorage.getItem('tj.auth.pending-activation')).not.toContain('MELR000202MSPSRD06');
    expect(screen.getByLabelText(/correo/i)).toBeTruthy();
    expect(screen.getByLabelText(/^contrase|^contra/i)).toBeTruthy();
    expect(screen.getByLabelText(/he le/i)).toBeTruthy();
  });

  it('muestra el estado blocked cuando la API devuelve 403', async () => {
    authMocks.verifyActivation.mockRejectedValue(
      Object.assign(new Error('Bloqueado'), {
        status: 403,
        payload: { message: 'Bloqueado' },
      }),
    );

    render(
      <MemoryRouter>
        <Activation />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/numero|número/i), {
      target: { value: 'TJ-000123' },
    });
    fireEvent.change(screen.getByLabelText(/^curp$/i), {
      target: { value: 'MELR000202MSPSRD06' },
    });

    fireEvent.submit(screen.getByLabelText(/numero|número/i).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(screen.getByText(/Acude a soporte/i)).toBeTruthy();
    });
  });

  it('requiere aceptar el aviso antes de completar la activacion', async () => {
    authMocks.verifyActivation.mockResolvedValue({ can_activate: true, message: 'ok' });

    render(
      <MemoryRouter>
        <Activation />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/numero|número/i), {
      target: { value: 'TJ-000123' },
    });
    fireEvent.change(screen.getByLabelText(/^curp$/i), {
      target: { value: 'MELR000202MSPSRD06' },
    });
    fireEvent.submit(screen.getByLabelText(/numero|número/i).closest('form') as HTMLFormElement);

    await screen.findByLabelText(/correo/i);

    fireEvent.change(screen.getByLabelText(/correo/i), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contrase|^contra/i), {
      target: { value: 'Segura123456' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar/i), {
      target: { value: 'Segura123456' },
    });

    fireEvent.submit(screen.getByLabelText(/correo/i).closest('form') as HTMLFormElement);

    expect(screen.getByText(/Debes aceptar el Aviso de privacidad/i)).toBeTruthy();
    expect(authMocks.completeActivation).not.toHaveBeenCalled();
  });

  it('completa la activacion con correo y password_confirmation', async () => {
    authMocks.verifyActivation.mockResolvedValue({ can_activate: true, message: 'ok' });
    authMocks.completeActivation.mockResolvedValue(null);

    render(
      <MemoryRouter>
        <Activation />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/numero|número/i), {
      target: { value: 'TJ-000123' },
    });
    fireEvent.change(screen.getByLabelText(/^curp$/i), {
      target: { value: 'MELR000202MSPSRD06' },
    });
    fireEvent.submit(screen.getByLabelText(/numero|número/i).closest('form') as HTMLFormElement);

    await screen.findByLabelText(/correo/i);

    fireEvent.change(screen.getByLabelText(/correo/i), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^contrase|^contra/i), {
      target: { value: 'Segura123456' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar/i), {
      target: { value: 'Segura123456' },
    });
    fireEvent.click(screen.getByLabelText(/he le/i));

    fireEvent.submit(screen.getByLabelText(/correo/i).closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(authMocks.completeActivation).toHaveBeenCalledWith({
        tarjetaNumero: 'TJ-000123',
        email: 'ana@example.com',
        password: 'Segura123456',
        passwordConfirmation: 'Segura123456',
      });
    });
  });
});
