export interface AuthSessionUser {
  id: number | string;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  cardholderSyncId?: number | string | null;
  tarjetaNumero?: string | null;
  nombreCompleto?: string | null;
}

export interface AuthSessionState {
  accessToken: string | null;
  expiresIn: number | null;
  user: AuthSessionUser | null;
}

type SessionListener = (session: AuthSessionState) => void;

const listeners = new Set<SessionListener>();

const INITIAL_SESSION: AuthSessionState = {
  accessToken: null,
  expiresIn: null,
  user: null,
};

let authSession = { ...INITIAL_SESSION };

const notifyListeners = () => {
  for (const listener of listeners) {
    listener(getAuthSession());
  }
};

export const getAuthSession = (): AuthSessionState => ({
  accessToken: authSession.accessToken,
  expiresIn: authSession.expiresIn,
  user: authSession.user ? { ...authSession.user } : null,
});

export const setAuthSession = (session: Partial<AuthSessionState>) => {
  authSession = {
    accessToken: session.accessToken ?? authSession.accessToken,
    expiresIn: session.expiresIn ?? authSession.expiresIn,
    user: session.user ?? authSession.user,
  };
  notifyListeners();
};

export const clearAuthSession = () => {
  authSession = { ...INITIAL_SESSION };
  notifyListeners();
};

export const subscribeAuthSession = (listener: SessionListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};
