import {
  Auth0Provider,
  AppState,
  RedirectLoginOptions,
  PopupLoginOptions,
  useAuth0,
} from '@auth0/auth0-react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { env } from '../config/env';
import { authApi, UserProfile } from './api/auth';
import { clearPendingActivation, getPendingActivation, persistPendingActivation } from './authFlow';
import { isApiError } from './apiClient';
import { getRequestErrorMessage, isUnlinkedProfileError } from './requestErrors';

export type AppSessionStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'unlinked' | 'error';

export type AppSession = {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  status: AppSessionStatus;
};

type LoginResult = {
  mode: 'popup' | 'redirect';
};

type SignupResult = {
  mode: 'popup' | 'redirect';
  idToken?: string;
};

type AuthContextValue = AppSession & {
  hasIdentitySession: boolean;
  errorMessage: string | null;
  isAuth0Ready: boolean;
  login: () => Promise<LoginResult>;
  signupAfterActivation: (tarjetaNumero: string) => Promise<SignupResult>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  getAccessToken: () => Promise<string | null>;
  getIdToken: () => Promise<string | null>;
  clearErrorMessage: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const isPopupCancelled = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'error' in error ? String(error.error) : '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return code === 'popup_cancelled' || code === 'popup_closed' || message.includes('popup closed');
};

const shouldFallbackToRedirect = (error: unknown) => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = 'error' in error ? String(error.error) : '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return (
    code === 'popup_blocked' ||
    message.includes('block') ||
    message.includes('unable to open a popup') ||
    message.includes('popup window')
  );
};

const auth0IsConfigured =
  env.auth0Domain.length > 0 &&
  env.auth0ClientId.length > 0 &&
  env.auth0RedirectUri.length > 0 &&
  env.auth0LogoutRedirectUri.length > 0;

const buildAuthorizationParams = (screenHint?: 'signup') => ({
  redirect_uri: env.auth0RedirectUri,
  ...(env.auth0Audience ? { audience: env.auth0Audience } : {}),
  ...(screenHint ? { screen_hint: screenHint } : {}),
});

const disabledAuthContext: AuthContextValue = {
  isAuthenticated: false,
  profile: null,
  status: 'unauthenticated',
  hasIdentitySession: false,
  errorMessage: 'Auth0 no esta configurado en este entorno.',
  isAuth0Ready: false,
  login: async () => {
    throw new Error('Auth0 no esta configurado en este entorno.');
  },
  signupAfterActivation: async () => {
    throw new Error('Auth0 no esta configurado en este entorno.');
  },
  logout: async () => {},
  refreshProfile: async () => null,
  getAccessToken: async () => null,
  getIdToken: async () => null,
  clearErrorMessage: () => {},
};

const InnerAuthProvider = ({ children }: { children: ReactNode }) => {
  const {
    error,
    isAuthenticated: auth0Authenticated,
    isLoading,
    getAccessTokenSilently,
    getIdTokenClaims,
    loginWithPopup,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AppSessionStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getAccessToken = useCallback(async () => {
    if (!auth0Authenticated) {
      return null;
    }

    return getAccessTokenSilently({
      authorizationParams: buildAuthorizationParams(),
    });
  }, [auth0Authenticated, getAccessTokenSilently]);

  const getIdToken = useCallback(async () => {
    if (!auth0Authenticated) {
      return null;
    }

    const claims = await getIdTokenClaims();
    return claims?.__raw ?? null;
  }, [auth0Authenticated, getIdTokenClaims]);

  const refreshProfile = useCallback(async () => {
    if (!auth0Authenticated) {
      setProfile(null);
      setStatus('unauthenticated');
      return null;
    }

    setStatus('loading');

    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setProfile(null);
        setStatus('unauthenticated');
        setErrorMessage('Tu sesion expiro. Inicia sesion nuevamente.');
        return null;
      }

      const nextProfile = await authApi.profile(accessToken);
      setProfile(nextProfile);
      setStatus('authenticated');
      setErrorMessage(null);
      return nextProfile;
    } catch (nextError) {
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
      setStatus(isApiError(nextError) && nextError.status === 401 ? 'unauthenticated' : 'error');
      setErrorMessage(message);
      return null;
    }
  }, [auth0Authenticated, getAccessToken]);

  useEffect(() => {
    if (error) {
      setStatus('error');
      setErrorMessage(error.message || 'No pudimos iniciar la autenticacion.');
      return;
    }

    if (isLoading) {
      setStatus('loading');
      return;
    }

    if (!auth0Authenticated) {
      setProfile(null);
      setStatus('unauthenticated');
      return;
    }

    if (getPendingActivation()) {
      setStatus('loading');
      return;
    }

    void refreshProfile();
  }, [auth0Authenticated, error, isLoading, refreshProfile]);

  const login = useCallback(async (): Promise<LoginResult> => {
    setErrorMessage(null);

    const popupOptions: PopupLoginOptions = {
      authorizationParams: buildAuthorizationParams(),
    };
    const redirectOptions: RedirectLoginOptions<AppState> = {
      authorizationParams: buildAuthorizationParams(),
      appState: {
        returnTo: '/perfil',
      },
    };

    try {
      await loginWithPopup(popupOptions);
      return { mode: 'popup' };
    } catch (loginError) {
      if (isPopupCancelled(loginError)) {
        const message = 'Se cancelo el inicio de sesion.';
        setErrorMessage(message);
        throw new Error(message);
      }

      if (shouldFallbackToRedirect(loginError)) {
        await loginWithRedirect(redirectOptions);
        return { mode: 'redirect' };
      }

      const message = 'No pudimos iniciar sesion. Intenta de nuevo.';
      setErrorMessage(message);
      throw new Error(message);
    }
  }, [loginWithPopup, loginWithRedirect]);

  const signupAfterActivation = useCallback(
    async (tarjetaNumero: string): Promise<SignupResult> => {
      setErrorMessage(null);
      persistPendingActivation({
        tarjetaNumero,
        verified: true,
      });

      const popupOptions: PopupLoginOptions = {
        authorizationParams: buildAuthorizationParams('signup'),
      };
      const redirectOptions: RedirectLoginOptions<AppState> = {
        authorizationParams: buildAuthorizationParams('signup'),
        appState: {
          returnTo: '/activar',
        },
      };

      try {
        await loginWithPopup(popupOptions);
        const idToken = await getIdToken();
        if (!idToken) {
          throw new Error('No pudimos obtener tu token de identidad.');
        }
        return {
          mode: 'popup',
          idToken,
        };
      } catch (signupError) {
        if (isPopupCancelled(signupError)) {
          clearPendingActivation();
          const message = 'Se cancelo la activacion.';
          setErrorMessage(message);
          throw new Error(message);
        }

        if (shouldFallbackToRedirect(signupError)) {
          await loginWithRedirect(redirectOptions);
          return { mode: 'redirect' };
        }

        clearPendingActivation();
        const message = 'No pudimos continuar con la activacion. Intenta de nuevo.';
        setErrorMessage(message);
        throw new Error(message);
      }
    },
    [getIdToken, loginWithPopup, loginWithRedirect],
  );

  const logout = useCallback(async () => {
    clearPendingActivation();
    setProfile(null);
    setStatus('unauthenticated');
    setErrorMessage(null);

    await auth0Logout({
      logoutParams: {
        returnTo: env.auth0LogoutRedirectUri,
      },
    });
  }, [auth0Logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: status === 'authenticated',
      profile,
      status,
      hasIdentitySession: auth0Authenticated,
      errorMessage,
      isAuth0Ready: !isLoading && !error,
      login,
      signupAfterActivation,
      logout,
      refreshProfile,
      getAccessToken,
      getIdToken,
      clearErrorMessage: () => setErrorMessage(null),
    }),
    [
      error,
      errorMessage,
      auth0Authenticated,
      getAccessToken,
      getIdToken,
      isLoading,
      login,
      logout,
      profile,
      refreshProfile,
      signupAfterActivation,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const AppAuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const handleRedirectCallback = useCallback(
    (appState?: AppState) => {
      const nextPath = typeof appState?.returnTo === 'string' ? appState.returnTo : '/perfil';
      navigate(nextPath, { replace: true });
    },
    [navigate],
  );

  if (!auth0IsConfigured) {
    return <AuthContext.Provider value={disabledAuthContext}>{children}</AuthContext.Provider>;
  }

  return (
    <Auth0Provider
      domain={env.auth0Domain}
      clientId={env.auth0ClientId}
      authorizationParams={buildAuthorizationParams()}
      cacheLocation="memory"
      useRefreshTokens
      onRedirectCallback={handleRedirectCallback}
    >
      <InnerAuthProvider>{children}</InnerAuthProvider>
    </Auth0Provider>
  );
};

export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth debe usarse dentro de AppAuthProvider.');
  }

  return context;
};
