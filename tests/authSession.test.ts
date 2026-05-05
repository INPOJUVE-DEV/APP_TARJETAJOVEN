import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from '../src/lib/authSession';

describe('authSession', () => {
  beforeEach(() => {
    clearAuthSession();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('mantiene la sesion solo en memoria', () => {
    setAuthSession({
      accessToken: 'access-token',
      expiresIn: 900,
      user: {
        id: 1,
        email: 'ana@example.com',
      },
    });

    expect(getAuthSession()).toEqual({
      accessToken: 'access-token',
      expiresIn: 900,
      user: {
        id: 1,
        email: 'ana@example.com',
      },
    });
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it('notifica cambios y limpia la sesion', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAuthSession(listener);

    setAuthSession({
      accessToken: 'access-token',
    });
    clearAuthSession();

    expect(listener).toHaveBeenCalledTimes(2);
    expect(getAuthSession().accessToken).toBeNull();

    unsubscribe();
  });
});
