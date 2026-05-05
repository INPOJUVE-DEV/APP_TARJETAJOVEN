import { apiFetch } from '../apiClient';

export interface SessionUser {
  id: number | string;
  email: string;
  nombreCompleto?: string | null;
  role: string;
  status: string;
  cardholderSyncId?: number | null;
  tarjetaNumero?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
}

export type RefreshResponse = LoginResponse;

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordResponse {
  reset: boolean;
  message: string;
}

export interface UserProfile {
  id: number | string;
  nombre: string;
  apellidos: string;
  role: string;
  status: string;
  edad?: number | null;
  creditos?: number | null;
  barcodeValue?: string | null;
  email?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  fotoUrl?: string | null;
  portadaUrl?: string | null;
  cardholderSyncId?: number | null;
  tarjetaNumero?: string | null;
}

export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<LoginResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      },
      {
        skipAuth: true,
        retryOnUnauthorized: false,
      },
    ),
  refresh: () =>
    apiFetch<RefreshResponse>(
      '/auth/refresh',
      {
        method: 'POST',
      },
      {
        skipAuth: true,
        retryOnUnauthorized: false,
      },
    ),
  logout: () =>
    apiFetch<void>(
      '/auth/logout',
      {
        method: 'POST',
      },
      {
        skipAuth: true,
        retryOnUnauthorized: false,
      },
    ),
  forgotPassword: (email: string) =>
    apiFetch<ForgotPasswordResponse>(
      '/auth/forgot-password',
      {
        method: 'POST',
        body: JSON.stringify({ email }),
      },
      {
        skipAuth: true,
        retryOnUnauthorized: false,
      },
    ),
  resetPassword: (token: string, password: string, passwordConfirmation: string) =>
    apiFetch<ResetPasswordResponse>(
      '/auth/reset-password',
      {
        method: 'POST',
        body: JSON.stringify({
          token,
          password,
          password_confirmation: passwordConfirmation,
        }),
      },
      {
        skipAuth: true,
        retryOnUnauthorized: false,
      },
    ),
  profile: () => apiFetch<UserProfile>('/me'),
};
