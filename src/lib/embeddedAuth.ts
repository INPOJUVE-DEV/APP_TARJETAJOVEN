import { env } from '../config/env';
import { EmbeddedAuthSession } from './authSession';

interface EmbeddedAuthApiError extends Error {
  status?: number;
  code?: string;
  payload?: unknown;
}

interface Auth0TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
  expires_in?: number;
}

const normalizeAuth0Domain = (value: string) =>
  /^https?:\/\//i.test(value) ? value.replace(/\/+$/, '') : `https://${value.replace(/\/+$/, '')}`;

const buildAuth0Url = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizeAuth0Domain(env.auth0Domain)}${normalizedPath}`;
};

const parsePayload = async (response: Response) => {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const createEmbeddedAuthError = (
  message: string,
  options?: { status?: number; code?: string; payload?: unknown },
) =>
  Object.assign(new Error(message), {
    status: options?.status,
    code: options?.code,
    payload: options?.payload,
  }) as EmbeddedAuthApiError;

const auth0Fetch = async <TResponse>(path: string, body: Record<string, unknown>) => {
  const response = await fetch(buildAuth0Url(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    const message =
      (typeof payload === 'object' && payload && 'description' in payload
        ? String((payload as Record<string, unknown>).description)
        : undefined) ??
      (typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as Record<string, unknown>).message)
        : undefined) ??
      response.statusText ??
      'No pudimos completar la solicitud de acceso.';

    throw createEmbeddedAuthError(message, {
      status: response.status,
      code:
        typeof payload === 'object' && payload && 'error' in payload
          ? String((payload as Record<string, unknown>).error)
          : undefined,
      payload,
    });
  }

  return payload as TResponse;
};

const toEmbeddedAuthSession = (
  tokenResponse: Auth0TokenResponse,
  options?: { previousIdToken?: string; previousRefreshToken?: string | null },
): EmbeddedAuthSession => {
  if (!tokenResponse.access_token) {
    throw createEmbeddedAuthError('No pudimos obtener una sesion valida.');
  }

  const idToken = tokenResponse.id_token ?? options?.previousIdToken;
  if (!idToken) {
    throw createEmbeddedAuthError('No pudimos obtener una sesion valida.');
  }

  return {
    accessToken: tokenResponse.access_token,
    idToken,
    refreshToken: tokenResponse.refresh_token ?? options?.previousRefreshToken ?? null,
    tokenType: tokenResponse.token_type ?? 'Bearer',
    scope: tokenResponse.scope ?? '',
    expiresAt: Date.now() + Math.max((tokenResponse.expires_in ?? 0) * 1000, 60_000),
  };
};

export const signupWithEmbeddedCredentials = async (email: string, password: string) => {
  await auth0Fetch<unknown>('/dbconnections/signup', {
    client_id: env.auth0ClientId,
    connection: env.auth0DbConnection,
    email: email.trim().toLowerCase(),
    password,
  });
};

export const loginWithEmbeddedCredentials = async (email: string, password: string) => {
  const tokenResponse = await auth0Fetch<Auth0TokenResponse>('/oauth/token', {
    grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
    client_id: env.auth0ClientId,
    username: email.trim().toLowerCase(),
    password,
    realm: env.auth0DbConnection,
    audience: env.auth0Audience,
    scope: 'openid profile email offline_access',
  });

  return toEmbeddedAuthSession(tokenResponse);
};

export const refreshEmbeddedAuthSession = async (
  refreshToken: string,
  previousIdToken: string,
  previousRefreshToken?: string | null,
) => {
  const tokenResponse = await auth0Fetch<Auth0TokenResponse>('/oauth/token', {
    grant_type: 'refresh_token',
    client_id: env.auth0ClientId,
    refresh_token: refreshToken,
  });

  return toEmbeddedAuthSession(tokenResponse, {
    previousIdToken,
    previousRefreshToken: previousRefreshToken ?? refreshToken,
  });
};

export const getEmbeddedAuthErrorMessage = (
  error: unknown,
  mode: 'signup' | 'login' | 'refresh',
) => {
  const fallbackMessage =
    mode === 'signup'
      ? 'No pudimos crear tu acceso. Intenta de nuevo.'
      : mode === 'login'
      ? 'No pudimos iniciar sesion. Revisa tus datos e intenta de nuevo.'
      : 'Tu acceso expiro. Inicia sesion nuevamente.';

  if (!error || typeof error !== 'object') {
    return fallbackMessage;
  }

  const authError = error as EmbeddedAuthApiError;
  const code = authError.code ?? '';
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  if (mode === 'signup') {
    if (code === 'user_exists' || message.includes('already exists')) {
      return 'Ya existe una cuenta con este correo.';
    }

    if (message.includes('password') && message.includes('strength')) {
      return 'La contrasena no cumple con los requisitos de seguridad.';
    }
  }

  if (mode === 'login') {
    if (code === 'invalid_grant' || message.includes('wrong email or password')) {
      return 'Correo o contrasena incorrectos.';
    }

    if (message.includes('blocked')) {
      return 'Tu acceso no esta disponible por el momento.';
    }
  }

  if (mode === 'refresh') {
    return 'Tu acceso expiro. Inicia sesion nuevamente.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};
