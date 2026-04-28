import { apiFetch } from '../apiClient';

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
  auth0UserId?: string | null;
  cardholderSyncId?: string | null;
}

export const authApi = {
  profile: (accessToken: string) =>
    apiFetch<UserProfile>('/me', undefined, {
      authToken: accessToken,
    }),
};
