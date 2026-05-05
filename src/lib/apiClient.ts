import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '../config/env';
import { AuthSessionUser, clearAuthSession, getAuthSession, setAuthSession } from './authSession';

const DEFAULT_ACCEPT_HEADER = 'application/json';
const API_BASE_URL = env.apiBaseUrl;
const SAME_ORIGIN_API_BASE_URL = env.defaultApiBaseUrl;

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const buildUrl = (path: string) => {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
};

const buildSameOriginUrl = (path: string) => {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  const normalizedBase = SAME_ORIGIN_API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');
  return `${normalizedBase}/${normalizedPath}`;
};

const hasCrossOriginApiBase = () => {
  if (typeof window === 'undefined' || !isAbsoluteUrl(API_BASE_URL)) {
    return false;
  }

  try {
    return new URL(API_BASE_URL).origin !== window.location.origin;
  } catch {
    return false;
  }
};

const canRetryWithSameOrigin = (path: string) =>
  hasCrossOriginApiBase() &&
  !isAbsoluteUrl(path) &&
  buildSameOriginUrl(path) !== buildUrl(path);

const shouldPreferSameOriginApi = () => !env.isDev && hasCrossOriginApiBase();

const getPrimaryUrl = (path: string) =>
  shouldPreferSameOriginApi() && !isAbsoluteUrl(path) ? buildSameOriginUrl(path) : buildUrl(path);

const createBaseQuery = (baseUrl: string) =>
  fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: (headers) => {
      if (!headers.has('Accept')) {
        headers.set('Accept', DEFAULT_ACCEPT_HEADER);
      }

      const accessToken = getAuthSession().accessToken;
      if (accessToken && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return headers;
    },
  });

const baseQuery = createBaseQuery(shouldPreferSameOriginApi() ? SAME_ORIGIN_API_BASE_URL : API_BASE_URL);
const sameOriginBaseQuery = createBaseQuery(SAME_ORIGIN_API_BASE_URL);

let refreshPromise: Promise<string | null> | null = null;

const buildHeaders = (init: RequestInit, options: ApiFetchOptions) => {
  const headers = new Headers(init.headers ?? {});

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', DEFAULT_ACCEPT_HEADER);
  }

  const authToken = options.authToken ?? getAuthSession().accessToken;
  if (!options.skipAuth && authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  return headers;
};

const executeFetch = async (path: string, init: RequestInit) => {
  const requestInit: RequestInit = {
    ...init,
    credentials: 'include',
  };

  try {
    return await fetch(getPrimaryUrl(path), requestInit);
  } catch (error) {
    if (!(error instanceof TypeError) || !canRetryWithSameOrigin(path)) {
      throw error;
    }

    return fetch(buildSameOriginUrl(path), requestInit);
  }
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

const extractErrorMessage = (statusText: string, payload: unknown) =>
  (typeof payload === 'object' && payload && 'message' in payload
    ? String((payload as Record<string, unknown>).message)
    : undefined) ?? statusText;

export interface ApiError extends Error {
  status: number;
  payload?: unknown;
}

export interface ApiFetchOptions {
  skipAuth?: boolean;
  authToken?: string;
  retryOnUnauthorized?: boolean;
}

type RefreshResponse = {
  accessToken: string;
  expiresIn?: number;
  user?: Record<string, unknown> | null;
};

const toAuthSessionUser = (value: RefreshResponse['user']): AuthSessionUser | null => {
  if (!value || typeof value !== 'object' || !('id' in value)) {
    return null;
  }

  return value as unknown as AuthSessionUser;
};

const createApiError = (status: number, statusText: string, payload: unknown): ApiError =>
  Object.assign(new Error(extractErrorMessage(statusText, payload) || 'Error en la solicitud'), {
    status,
    payload,
  });

export const refreshApiSession = async (): Promise<string | null> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await executeFetch('/auth/refresh', {
        method: 'POST',
        headers: {
          Accept: DEFAULT_ACCEPT_HEADER,
        },
      });
      const payload = (await parsePayload(response)) as RefreshResponse | undefined;

      if (!response.ok || !payload?.accessToken) {
        clearAuthSession();
        return null;
      }

      setAuthSession({
        accessToken: payload.accessToken,
        expiresIn: typeof payload.expiresIn === 'number' ? payload.expiresIn : null,
        user: toAuthSessionUser(payload.user),
      });

      return payload.accessToken;
    } catch {
      clearAuthSession();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

export const apiFetch = async <TResponse = unknown>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<TResponse> => {
  const sendRequest = (authToken?: string) =>
    executeFetch(path, {
      ...init,
      headers: buildHeaders(init, { ...options, authToken }),
    });

  let response = await sendRequest();

  if (
    response.status === 401 &&
    !options.skipAuth &&
    options.retryOnUnauthorized !== false
  ) {
    const refreshedToken = await refreshApiSession();

    if (refreshedToken) {
      response = await sendRequest(refreshedToken);
    }
  }

  const payload = await parsePayload(response);

  if (!response.ok) {
    throw createApiError(response.status, response.statusText, payload);
  }

  return payload as TResponse;
};

export const apiBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await baseQuery(args, api, extraOptions);
  const requestPath = typeof args === 'string' ? args : args.url;

  if (result.error?.status === 'FETCH_ERROR' && canRetryWithSameOrigin(requestPath)) {
    result = await sameOriginBaseQuery(args, api, extraOptions);
  }

  if (result.error?.status === 401) {
    const refreshedToken = await refreshApiSession();

    if (!refreshedToken) {
      clearAuthSession();
      return result;
    }

    return baseQuery(args, api, extraOptions);
  }

  return result;
};

export const isApiError = (error: unknown): error is ApiError =>
  typeof error === 'object' && error !== null && 'status' in error && typeof (error as ApiError).status === 'number';
