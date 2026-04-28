import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '../config/env';

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

    return headers;
  },
});

export const apiBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await baseQuery(args, api, extraOptions);

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
  authToken?: string;
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

  if (!options.skipAuth && options.authToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${options.authToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

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
