import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { env } from '../config/env';
import { authApi, UserProfile } from './api/auth';
import { clearPendingActivation } from './authFlow';
import { isApiError } from './apiClient';
import {
  getEmbeddedAuthErrorMessage,
  loginWithEmbeddedCredentials,
  refreshEmbeddedAuthSession,
  signupWithEmbeddedCredentials,
} from './embeddedAuth';
import {
  clearStoredAuthSession,
  EmbeddedAuthSession,
  getStoredAuthSession,
  persistAuthSession,
  shouldRefreshAuthSession,
} from './authSession';
import { getRequestErrorMessage, isUnlinkedProfileError } from './requestErrors';

export type AppSessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unlinked' | 'error';

export type AppSession = {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  status: AppSessionStatus;
};

type AuthContextValue = AppSession & {
  errorMessage: string | null;
  isAuthReady: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<EmbeddedAuthSession>;
  signupWithCredentials: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  getAccessToken: () => Promise<string | null>;
  getIdToken: () => Promise<string | null>;
  clearErrorMessage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const authIsConfigured =
  env.auth0Domain.length > 0 &&
  env.auth0ClientId.length > 0 &&
  env.auth0Audience.length > 0 &&
  env.auth0DbConnection.length > 0;

const disabledAuthContext: AuthContextValue = {
  isAuthenticated: false,
  profile: null,
  status: 'unauthenticated',
  errorMessage: 'El acceso seguro no esta configurado en este entorno.',
  isAuthReady: true,
  loginWithCredentials: async () => {
    throw new Error('El acceso seguro no esta configurado en este entorno.');
  },
  signupWithCredentials: async () => {
    throw new Error('El acceso seguro no esta configurado en este entorno.');
  },
  logout: async () => {},
  refreshProfile: async () => null,
  getAccessToken: async () => null,
  getIdToken: async () => null,
  clearErrorMessage: () => {},
};

const InnerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AppSessionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [session, setSession] = useState<EmbeddedAuthSession | null>(() => getStoredAuthSession());
  const sessionRef = useRef<EmbeddedAuthSession | null>(session);

  const storeSession = useCallback((nextSession: EmbeddedAuthSession | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    persistAuthSession(nextSession);
  }, []);

  const clearSession = useCallback(() => {
    storeSession(null);
    clearStoredAuthSession();
  }, [storeSession]);

  const ensureSession = useCallback(
    async (options?: { forceRefresh?: boolean; suppressErrors?: boolean }) => {
      const currentSession = sessionRef.current ?? getStoredAuthSession();
      if (!currentSession) {
        clearSession();
        return null;
      }

      if (!options?.forceRefresh && !shouldRefreshAuthSession(currentSession)) {
        if (sessionRef.current !== currentSession) {
          storeSession(currentSession);
        }

        return currentSession;
      }

      if (!currentSession.refreshToken) {
        clearSession();
        if (!options?.suppressErrors) {
          setErrorMessage('Tu acceso expiro. Inicia sesion nuevamente.');
        }
        return null;
      }

      try {
        const refreshedSession = await refreshEmbeddedAuthSession(
          currentSession.refreshToken,
          currentSession.idToken,
          currentSession.refreshToken,
        );
        storeSession(refreshedSession);
        setErrorMessage(null);
        return refreshedSession;
      } catch (refreshError) {
        clearSession();
        if (!options?.suppressErrors) {
          setErrorMessage(getEmbeddedAuthErrorMessage(refreshError, 'refresh'));
        }
        return null;
      }
    },
    [clearSession, storeSession],
  );

  const loadProfile = useCallback(
    async (currentSession: EmbeddedAuthSession, options?: { allowRetry?: boolean }) => {
      try {
        const nextProfile = await authApi.profile(currentSession.accessToken);
        setProfile(nextProfile);
        setStatus('authenticated');
        setErrorMessage(null);
        return nextProfile;
      } catch (nextError) {
        if (isApiError(nextError) && nextError.status === 401 && options?.allowRetry !== false) {
          const refreshedSession = await ensureSession({ forceRefresh: true, suppressErrors: true });
          if (refreshedSession) {
            return loadProfile(refreshedSession, { allowRetry: false });
          }

          setProfile(null);
          setStatus('unauthenticated');
          setErrorMessage('Tu acceso expiro. Inicia sesion nuevamente.');
          return null;
        }

        if (isApiError(nextError) && isUnlinkedProfileError(nextError)) {
          setProfile(null);
          setStatus('unlinked');
          setErrorMessage(null);
          return null;
        }

        const message = getRequestErrorMessage(nextError, {
          fallbackMessage: 'No pudimos obtener tu informacion de perfil.',
        });
        setProfile(null);
        setStatus('error');
        setErrorMessage(message);
        return null;
      }
    },
    [ensureSession],
  );

  const refreshProfile = useCallback(async () => {
    setStatus('loading');
    const activeSession = await ensureSession();
    if (!activeSession) {
      setProfile(null);
      setStatus('unauthenticated');
      return null;
    }

    return loadProfile(activeSession, { allowRetry: true });
  }, [ensureSession, loadProfile]);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const storedSession = await ensureSession({ suppressErrors: true });
      if (!isMounted) {
        return;
      }

      if (!storedSession) {
        setProfile(null);
        setStatus('unauthenticated');
        setIsAuthReady(true);
        return;
      }

      await loadProfile(storedSession, { allowRetry: true });
      if (isMounted) {
        setIsAuthReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [ensureSession, loadProfile]);

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      setErrorMessage(null);
      setStatus('loading');

      try {
        const nextSession = await loginWithEmbeddedCredentials(email, password);
        storeSession(nextSession);
        setProfile(null);
        return nextSession;
      } catch (loginError) {
        clearSession();
        setProfile(null);
        setStatus('unauthenticated');
        const message = getEmbeddedAuthErrorMessage(loginError, 'login');
        setErrorMessage(message);
        throw new Error(message);
      }
    },
    [clearSession, storeSession],
  );

  const signupWithCredentials = useCallback(async (email: string, password: string) => {
    setErrorMessage(null);

    try {
      await signupWithEmbeddedCredentials(email, password);
    } catch (signupError) {
      const message = getEmbeddedAuthErrorMessage(signupError, 'signup');
      setErrorMessage(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    clearPendingActivation();
    clearSession();
    setProfile(null);
    setStatus('unauthenticated');
    setErrorMessage(null);
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: status === 'authenticated',
      profile,
      status,
      errorMessage,
      isAuthReady,
      loginWithCredentials,
      signupWithCredentials,
      logout,
      refreshProfile,
      getAccessToken: async () => {
        const activeSession = await ensureSession();
        return activeSession?.accessToken ?? null;
      },
      getIdToken: async () => {
        const activeSession = await ensureSession();
        return activeSession?.idToken ?? null;
      },
      clearErrorMessage: () => setErrorMessage(null),
    }),
    [
      ensureSession,
      errorMessage,
      isAuthReady,
      loginWithCredentials,
      logout,
      profile,
      refreshProfile,
      signupWithCredentials,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AppAuthProvider = ({ children }: { children: ReactNode }) => {
  if (!authIsConfigured) {
    return <AuthContext.Provider value={disabledAuthContext}>{children}</AuthContext.Provider>;
  }

  return <InnerAuthProvider>{children}</InnerAuthProvider>;
};

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth debe usarse dentro de AppAuthProvider.');
  }

  return context;
};
