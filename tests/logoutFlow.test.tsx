import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../src/pages/Profile';

const navigateMock = vi.hoisted(() => vi.fn());
const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
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
    profile: {
      nombre: 'Beneficiario',
      apellidos: 'Lopez Perez',
      titularNombre: 'Ana Maria',
      titularPrimerApellido: 'Sanchez',
      edad: 22,
      barcodeValue: 'TJ-0001',
    },
    logout: authMocks.logout,
  }),
}));

describe('Logout flow', () => {
  it('muestra el nombre del titular y vuelve al login al cerrar sesion', async () => {
    authMocks.logout.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hola, Ana Sanchez' })).toBeTruthy();
    expect(screen.getByText('Ana Sanchez')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesion' }));

    await waitFor(() => {
      expect(authMocks.logout).toHaveBeenCalled();
    });
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });
});
