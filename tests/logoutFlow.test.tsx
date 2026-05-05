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
      nombre: 'Ana',
      apellidos: 'Lopez',
      edad: 22,
      barcodeValue: 'TJ-0001',
    },
    logout: authMocks.logout,
  }),
}));

describe('Logout flow', () => {
  it('limpia la sesion local y vuelve al login', async () => {
    authMocks.logout.mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    await waitFor(() => {
      expect(authMocks.logout).toHaveBeenCalled();
    });
    expect(navigateMock).toHaveBeenCalledWith('/login', { replace: true });
  });
});
