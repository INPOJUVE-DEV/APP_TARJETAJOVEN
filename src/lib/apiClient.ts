import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '../config/env';
import { clearStoredTokens, getStoredTokens } from './authStorage';

const API_BASE_URL = env.apiBaseUrl;

const buildUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedBase = API_BASE_URL.replace(/\/+$/, '');
  const normalizedPath = path.replace(/^\/+/, '');

  return `${normalizedBase}/${normalizedPath}`;
};

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const tokens = getStoredTokens();
    if (tokens?.accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${tokens.accessToken}`);
    }

    return headers;
  },
});

export const apiBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    clearStoredTokens();
  }

  return result;
};

export interface ApiError extends Error {
  status: number;
  payload?: unknown;
}

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

export interface ApiFetchOptions {
  skipAuth?: boolean;
}

export const apiFetch = async <TResponse = unknown>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<TResponse> => {
  const headers = new Headers(init.headers ?? {});

  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const tokens = getStoredTokens();
  if (!options.skipAuth && tokens?.accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    clearStoredTokens();
  }

  const payload = await parsePayload(response);

  if (!response.ok) {
    const message =
      (typeof payload === 'object' && payload && 'message' in payload
        ? String((payload as Record<string, unknown>).message)
        : undefined) ?? response.statusText;

    const error: ApiError = Object.assign(new Error(message || 'Error en la solicitud'), {
      status: response.status,
      payload,
    });
    throw error;
  }

  return payload as TResponse;
};

export const isApiError = (error: unknown): error is ApiError =>
  typeof error === 'object' && error !== null && 'status' in error && typeof (error as ApiError).status === 'number';
