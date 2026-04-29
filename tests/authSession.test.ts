import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearStoredAuthSession,
  getStoredAuthSession,
  persistAuthSession,
  shouldRefreshAuthSession,
} from '../src/lib/authSession';

describe('authSession', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('persiste y recupera la sesion embebida', () => {
    persistAuthSession({
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      scope: 'openid profile email offline_access',
      expiresAt: 1_900_000_000_000,
    });

    expect(getStoredAuthSession()).toEqual({
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      scope: 'openid profile email offline_access',
      expiresAt: 1_900_000_000_000,
    });
  });

  it('indica cuando la sesion debe refrescarse', () => {
    expect(
      shouldRefreshAuthSession(
        {
          accessToken: 'access-token',
          idToken: 'id-token',
          refreshToken: 'refresh-token',
          tokenType: 'Bearer',
          scope: 'openid',
          expiresAt: 2_000,
        },
        {
          now: 1_500,
          bufferMs: 600,
        },
      ),
    ).toBe(true);
  });

  it('elimina la sesion al limpiar el almacenamiento', () => {
    persistAuthSession({
      accessToken: 'access-token',
      idToken: 'id-token',
      refreshToken: 'refresh-token',
      tokenType: 'Bearer',
      scope: 'openid',
      expiresAt: 1_900_000_000_000,
    });

    clearStoredAuthSession();

    expect(getStoredAuthSession()).toBeNull();
  });
});
