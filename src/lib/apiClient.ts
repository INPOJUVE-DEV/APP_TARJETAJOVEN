import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '../config/env';

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

const createBaseQuery = (baseUrl: string) =>
  fetchBaseQuery({
    baseUrl,
    credentials: 'include',
    prepareHeaders: (headers) => {
      if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
      }

      return headers;
    },
  });

const baseQuery = createBaseQuery(API_BASE_URL);
const sameOriginBaseQuery = createBaseQuery(SAME_ORIGIN_API_BASE_URL);

export const apiBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await baseQuery(args, api, extraOptions);

  const requestPath = typeof args === 'string' ? args : args.url;
  if (result.error?.status === 'FETCH_ERROR' && canRetryWithSameOrigin(requestPath)) {
    return sameOriginBaseQuery(args, api, extraOptions);
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

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  };

  let response: Response;

  try {
    response = await fetch(buildUrl(path), requestInit);
  } catch (error) {
    if (!(error instanceof TypeError) || !canRetryWithSameOrigin(path)) {
      throw error;
    }

    response = await fetch(buildSameOriginUrl(path), requestInit);
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
