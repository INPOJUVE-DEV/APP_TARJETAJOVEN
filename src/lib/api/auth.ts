import type { AuthTokens } from '../authStorage';
import { apiFetch } from '../apiClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserProfile {
  id: string;
  nombre: string;
  apellidos: string;
  email?: string | null;
  municipio?: string | null;
  telefono?: string | null;
  edad?: number | null;
  creditos?: number | null;
  fotoUrl?: string | null;
  portadaUrl?: string | null;
  barcodeValue?: string | null;
}

export const authApi = {
  login: (payload: LoginRequest) =>
    apiFetch<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, { skipAuth: true }),
  logout: () =>
    apiFetch<void>('/auth/logout', {
      method: 'POST',
    }),
  profile: () => apiFetch<UserProfile>('/me'),
};
