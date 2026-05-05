import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../src/lib/apiClient';
import { clearAuthSession, getAuthSession, setAuthSession } from '../src/lib/authSession';

describe('apiClient', () => {
  beforeEach(() => {
    clearAuthSession();
  });

  afterEach(() => {
    clearAuthSession();
    vi.restoreAllMocks();
  });

  it('serializa refresh concurrentes y reintenta una sola vez por request', async () => {
    let refreshCalls = 0;
    let meCalls = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get('Authorization');

      if (url.includes('/auth/refresh')) {
        refreshCalls += 1;
        return new Response(
          JSON.stringify({
            accessToken: 'new-token',
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
        meCalls += 1;

        if (authorization === 'Bearer stale-token') {
          return new Response(JSON.stringify({ message: 'Token invalido' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    setAuthSession({
      accessToken: 'stale-token',
      expiresIn: 900,
      user: {
        id: 1,
      },
    });

    await Promise.all([apiFetch('/me'), apiFetch('/me')]);

    expect(refreshCalls).toBe(1);
    expect(meCalls).toBe(4);
    expect(getAuthSession().accessToken).toBe('new-token');
  });

  it('limpia la sesion cuando refresh falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get('Authorization');

      if (url.includes('/auth/refresh')) {
        return new Response(JSON.stringify({ message: 'Sesion no disponible.' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.includes('/me') && authorization === 'Bearer stale-token') {
        return new Response(JSON.stringify({ message: 'Token invalido' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    setAuthSession({
      accessToken: 'stale-token',
      expiresIn: 900,
      user: {
        id: 1,
      },
    });

    await expect(apiFetch('/me')).rejects.toMatchObject({ status: 401 });
    expect(getAuthSession().accessToken).toBeNull();
  });
});
