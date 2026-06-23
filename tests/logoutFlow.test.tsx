import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../src/pages/Profile';

const navigateMock = vi.hoisted(() => vi.fn());
const authMocks = vi.hoisted(() => ({
  logout: vi.fn(),
}));
const profileState = vi.hoisted(() => ({
  value: {
    nombre: 'Beneficiario',
    apellidos: 'Lopez Perez',
    titularNombre: 'Ana Maria',
    titularPrimerApellido: 'Sanchez',
    edad: 22,
    barcodeValue: 'TJ-0001',
  } as Record<string, unknown>,
}));
const sessionState = vi.hoisted(() => ({
  value: {
    user: {
      nombreCompleto: null as string | null,
    },
  },
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
    profile: profileState.value,
    logout: authMocks.logout,
  }),
}));

vi.mock('../src/lib/authSession', () => ({
  getAuthSession: () => sessionState.value,
}));

describe('Logout flow', () => {
  beforeEach(() => {
    cleanup();
    authMocks.logout.mockReset();
    navigateMock.mockReset();
    profileState.value = {
      nombre: 'Beneficiario',
      apellidos: 'Lopez Perez',
      titularNombre: 'Ana Maria',
      titularPrimerApellido: 'Sanchez',
      edad: 22,
      barcodeValue: 'TJ-0001',
    };
    sessionState.value = {
      user: {
        nombreCompleto: null,
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('acepta variantes snake_case del backend para el titular', () => {
    profileState.value = {
      titular_nombres: 'Lucia Fernanda',
      titular_apellidos: 'Martinez Lopez',
      edad: 20,
    };

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hola, Lucia Martinez' })).toBeTruthy();
    expect(screen.getByText('Lucia Martinez')).toBeTruthy();
  });

  it('usa nombreCompleto del perfil cuando viene del backend', () => {
    profileState.value = {
      nombreCompleto: 'JUAN PEREZ',
      edad: 19,
    };

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hola, JUAN PEREZ' })).toBeTruthy();
    expect(screen.getByText('JUAN PEREZ')).toBeTruthy();
    expect(screen.queryByText('Juventud potosina')).toBeNull();
  });

  it('usa nombreCompleto de sesion cuando el perfil no trae nombre renderizable', () => {
    profileState.value = {
      edad: 19,
    };
    sessionState.value = {
      user: {
        nombreCompleto: 'Mariana Torres Gomez',
      },
    };

    render(
      <MemoryRouter>
        <Profile />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Hola, Mariana Torres' })).toBeTruthy();
    expect(screen.getByText('Mariana Torres')).toBeTruthy();
  });
});
