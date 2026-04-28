import { apiFetch } from '../apiClient';

export interface VerifyActivationRequest {
  tarjetaNumero: string;
  curp: string;
}

export interface VerifyActivationResponse {
  can_activate: boolean;
  message: string;
}

export interface CompleteActivationRequest {
  tarjetaNumero: string;
  auth0IdToken: string;
}

export interface CompleteActivationResponse {
  activated: boolean;
  message: string;
}

export const cardholderApi = {
  verifyActivation: ({ tarjetaNumero, curp }: VerifyActivationRequest) =>
    apiFetch<VerifyActivationResponse>('/cardholders/verify-activation', {
      method: 'POST',
      body: JSON.stringify({
        tarjeta_numero: tarjetaNumero,
        curp,
      }),
    }),
  completeActivation: ({ tarjetaNumero, auth0IdToken }: CompleteActivationRequest) =>
    apiFetch<CompleteActivationResponse>('/cardholders/complete-activation', {
      method: 'POST',
      body: JSON.stringify({
        tarjeta_numero: tarjetaNumero,
        auth0_id_token: auth0IdToken,
      }),
    }),
};
