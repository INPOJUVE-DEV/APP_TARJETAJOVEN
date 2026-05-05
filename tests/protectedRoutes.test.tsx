import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import ProtectedRoute from '../src/components/ProtectedRoute';

const authState = vi.hoisted(() => ({
  status: 'unauthenticated',
}));

vi.mock('../src/lib/useAuth', () => ({
  useAuth: () => ({
    status: authState.status,
  }),
}));

const renderProtectedRoute = () =>
  render(
    <MemoryRouter initialEntries={['/catalog']}>
      <Routes>
        <Route path="/login" element={<p>Login screen</p>} />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute>
              <p>Catalogo privado</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

describe('ProtectedRoute', () => {
  it('redirige al login cuando no hay sesion', async () => {
    authState.status = 'unauthenticated';
    renderProtectedRoute();

    expect(await screen.findByText('Login screen')).toBeTruthy();
  });

  it('muestra estado de carga mientras recupera sesion', () => {
    authState.status = 'loading';
    renderProtectedRoute();

    expect(screen.getByText('Validando sesión')).toBeTruthy();
  });

  it('permite el acceso cuando la sesion esta autenticada', () => {
    authState.status = 'authenticated';
    renderProtectedRoute();

    expect(screen.getByText('Catalogo privado')).toBeTruthy();
  });
});
