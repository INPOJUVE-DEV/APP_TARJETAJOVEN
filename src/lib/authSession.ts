export interface EmbeddedAuthSession {
  accessToken: string;
  idToken: string;
  refreshToken: string | null;
  tokenType: string;
  scope: string;
  expiresAt: number;
}

const AUTH_SESSION_STORAGE_KEY = 'tj.auth.embedded-session';
const REFRESH_BUFFER_MS = 60_000;

const isBrowser = typeof window !== 'undefined';

const isValidSession = (value: unknown): value is EmbeddedAuthSession => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as EmbeddedAuthSession;
  return (
    typeof candidate.accessToken === 'string' &&
    candidate.accessToken.length > 0 &&
    typeof candidate.idToken === 'string' &&
    candidate.idToken.length > 0 &&
    (typeof candidate.refreshToken === 'string' || candidate.refreshToken === null) &&
    typeof candidate.tokenType === 'string' &&
    candidate.tokenType.length > 0 &&
    typeof candidate.scope === 'string' &&
    typeof candidate.expiresAt === 'number' &&
    Number.isFinite(candidate.expiresAt)
  );
};

export const getStoredAuthSession = (): EmbeddedAuthSession | null => {
  if (!isBrowser) {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    if (isValidSession(parsed)) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }

  return null;
};

export const persistAuthSession = (session: EmbeddedAuthSession | null) => {
  if (!isBrowser) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredAuthSession = () => {
  persistAuthSession(null);
};

export const shouldRefreshAuthSession = (
  session: EmbeddedAuthSession,
  options?: { now?: number; bufferMs?: number },
) => {
  const now = options?.now ?? Date.now();
  const bufferMs = options?.bufferMs ?? REFRESH_BUFFER_MS;
  return session.expiresAt - bufferMs <= now;
};
