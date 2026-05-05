import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../src/pages/ForgotPassword';
import ResetPassword from '../src/pages/ResetPassword';

const navigateMock = vi.hoisted(() => vi.fn());
const authMocks = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('../src/lib/useAuth', () => ({
  useAuth: () => ({
    forgotPassword: authMocks.forgotPassword,
    resetPassword: authMocks.resetPassword,
  }),
}));

describe('Recovery flow', () => {
  beforeEach(() => {
    cleanup();
    navigateMock.mockReset();
    authMocks.forgotPassword.mockReset();
    authMocks.resetPassword.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra el mismo mensaje neutro para correos existentes o inexistentes', async () => {
    authMocks.forgotPassword.mockResolvedValue(
      'Si el correo existe y esta habilitado, recibira instrucciones para restablecer la contrasena.',
    );

    const { rerender } = render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'ana@example.com' },
    });
    fireEvent.submit(screen.getByLabelText('Correo').closest('form') as HTMLFormElement);

    await screen.findByText(
      'Si el correo existe y esta habilitado, recibira instrucciones para restablecer la contrasena.',
    );

    rerender(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'nadie@example.com' },
    });
    fireEvent.submit(screen.getByLabelText('Correo').closest('form') as HTMLFormElement);

    await screen.findByText(
      'Si el correo existe y esta habilitado, recibira instrucciones para restablecer la contrasena.',
    );
    expect(authMocks.forgotPassword).toHaveBeenCalledTimes(2);
  });

  it('envia token y password_confirmation al reset', async () => {
    authMocks.resetPassword.mockResolvedValue('Contrasena actualizada correctamente.');

    render(
      <MemoryRouter initialEntries={['/reset-password?token=test-token']}>
        <ResetPassword />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'Segura123456' },
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña'), {
      target: { value: 'Segura123456' },
    });

    fireEvent.submit(screen.getByLabelText('Contraseña').closest('form') as HTMLFormElement);

    await waitFor(() => {
      expect(authMocks.resetPassword).toHaveBeenCalledWith(
        'test-token',
        'Segura123456',
        'Segura123456',
      );
    });
    expect(navigateMock).toHaveBeenCalled();
  });
});
