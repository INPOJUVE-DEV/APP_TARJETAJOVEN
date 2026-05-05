import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi, UserProfile } from './api/auth';
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  subscribeAuthSession,
} from './authSession';
import { refreshApiSession, isApiError } from './apiClient';
import {
  cardholderApi,
  CompleteActivationRequest,
  VerifyActivationRequest,
  VerifyActivationResponse,
} from './api/cardholders';
import { getRequestErrorMessage, isSessionExpiredError } from './requestErrors';

export type AppSessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export type AppSession = {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  status: AppSessionStatus;
};

type AuthContextValue = AppSession & {
  errorMessage: string | null;
  isAuthReady: boolean;
  login: (username: string, password: string) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  refreshProfile: () => Promise<UserProfile | null>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (token: string, password: string, passwordConfirmation: string) => Promise<string>;
  verifyActivation: (payload: VerifyActivationRequest) => Promise<VerifyActivationResponse>;
  completeActivation: (payload: CompleteActivationRequest) => Promise<UserProfile | null>;
  clearErrorMessage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const LOGIN_ERROR_MESSAGE = 'Correo o contraseña incorrectos.';
const SESSION_ERROR_MESSAGE = 'No pudimos recuperar tu sesión. Intenta de nuevo.';

const isInvalidLoginError = (error: unknown) =>
  isApiError(error) && (error.status === 401 || error.status === 422);

const InnerAuthProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AppSessionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const nextProfile = await authApi.profile();
      setProfile(nextProfile);
      setStatus('authenticated');
      setErrorMessage(null);
      return nextProfile;
    } catch (error) {
      if (isSessionExpiredError(error)) {
        clearAuthSession();
        setProfile(null);
        setStatus('unauthenticated');
        setErrorMessage(null);
        return null;
      }

      setProfile(null);
      setStatus('error');
      setErrorMessage(
        getRequestErrorMessage(error, {
          fallbackMessage: 'No pudimos obtener tu información de perfil.',
        }),
      );
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeAuthSession((session) => {
      if (!session.accessToken) {
        setProfile(null);
        setStatus('unauthenticated');
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      setStatus('loading');
      setErrorMessage(null);

      try {
        let accessToken = getAuthSession().accessToken;

        if (!accessToken) {
          accessToken = await refreshApiSession();
        }

        if (!isMounted) {
          return;
        }

        if (!accessToken) {
          setProfile(null);
          setStatus('unauthenticated');
          return;
        }

        await loadProfile();
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setProfile(null);
        setStatus('error');
        setErrorMessage(
          getRequestErrorMessage(error, {
            fallbackMessage: SESSION_ERROR_MESSAGE,
          }),
        );
      } finally {
        if (isMounted) {
          setIsAuthReady(true);
        }
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [loadProfile]);

  const login = useCallback(
    async (username: string, password: string) => {
      setStatus('loading');
      setErrorMessage(null);

      try {
        const session = await authApi.login(username, password);
        setAuthSession({
          accessToken: session.accessToken,
          expiresIn: session.expiresIn,
          user: session.user,
        });

        return await loadProfile();
      } catch (error) {
        clearAuthSession();
        setProfile(null);
        setStatus('unauthenticated');
        setErrorMessage(
          isInvalidLoginError(error)
            ? LOGIN_ERROR_MESSAGE
            : getRequestErrorMessage(error, {
                fallbackMessage: 'No pudimos iniciar sesión. Intenta de nuevo.',
              }),
        );
        throw error;
      }
    },
    [loadProfile],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // El frontend debe limpiar la sesion aunque el backend falle al limpiar la cookie.
    } finally {
      clearAuthSession();
      setProfile(null);
      setStatus('unauthenticated');
      setErrorMessage(null);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    const refreshedToken = await refreshApiSession();

    if (!refreshedToken) {
      setProfile(null);
      setStatus('unauthenticated');
      return false;
    }

    const nextProfile = await loadProfile();
    return nextProfile !== null;
  }, [loadProfile]);

  const forgotPassword = useCallback(async (email: string) => {
    const response = await authApi.forgotPassword(email);
    setErrorMessage(null);
    return response.message;
  }, []);

  const resetPassword = useCallback(async (token: string, password: string, passwordConfirmation: string) => {
    const response = await authApi.resetPassword(token, password, passwordConfirmation);
    clearAuthSession();
    setProfile(null);
    setStatus('unauthenticated');
    setErrorMessage(null);
    return response.message;
  }, []);

  const verifyActivation = useCallback((payload: VerifyActivationRequest) => {
    setErrorMessage(null);
    return cardholderApi.verifyActivation(payload);
  }, []);

  const completeActivation = useCallback(
    async (payload: CompleteActivationRequest) => {
      const response = await cardholderApi.completeActivation(payload);
      setAuthSession({
        accessToken: response.accessToken,
        expiresIn: response.expiresIn,
        user: response.user,
      });

      return await loadProfile();
    },
    [loadProfile],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: status === 'authenticated',
      profile,
      status,
      errorMessage,
      isAuthReady,
      login,
      logout,
      refreshSession,
      refreshProfile: loadProfile,
      forgotPassword,
      resetPassword,
      verifyActivation,
      completeActivation,
      clearErrorMessage: () => setErrorMessage(null),
    }),
    [
      completeActivation,
      errorMessage,
      forgotPassword,
      isAuthReady,
      loadProfile,
      login,
      logout,
      profile,
      refreshSession,
      resetPassword,
      status,
      verifyActivation,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AppAuthProvider = ({ children }: { children: ReactNode }) => (
  <InnerAuthProvider>{children}</InnerAuthProvider>
);

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth debe usarse dentro de AppAuthProvider.');
  }

  return context;
};
