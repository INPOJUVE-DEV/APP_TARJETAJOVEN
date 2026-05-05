import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { AppAuthProvider } from '../src/lib/AppAuthProvider';
import { useAuth } from '../src/lib/useAuth';
import { clearAuthSession } from '../src/lib/authSession';

const SessionProbe = () => {
  const { status, profile, isAuthReady } = useAuth();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="ready">{String(isAuthReady)}</span>
      <span data-testid="name">{profile?.nombre ?? 'sin-perfil'}</span>
    </div>
  );
};

describe('Bootstrap flow', () => {
  beforeEach(() => {
    clearAuthSession();
  });

  afterEach(() => {
    cleanup();
    clearAuthSession();
    vi.restoreAllMocks();
  });

  it('recupera la sesion con refresh al abrir la app', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);

      if (url.includes('/auth/refresh')) {
        return new Response(
          JSON.stringify({
            accessToken: 'fresh-token',
            expiresIn: 900,
            user: {
              id: 1,
              email: 'ana@example.com',
              role: 'beneficiary',
              status: 'active',
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      if (url.includes('/me')) {
        return new Response(
          JSON.stringify({
            id: 1,
            nombre: 'Ana',
            apellidos: 'Lopez',
            role: 'beneficiary',
            status: 'active',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    render(
      <AppAuthProvider>
        <SessionProbe />
      </AppAuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('authenticated');
    });
    expect(screen.getByTestId('ready').textContent).toBe('true');
    expect(screen.getByTestId('name').textContent).toBe('Ana');
  });

  it('queda sin sesion cuando refresh falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'Sesion no disponible.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    render(
      <AppAuthProvider>
        <SessionProbe />
      </AppAuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unauthenticated');
    });
    expect(screen.getByTestId('ready').textContent).toBe('true');
  });
});
