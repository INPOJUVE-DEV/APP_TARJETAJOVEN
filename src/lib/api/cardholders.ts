import { apiFetch } from '../apiClient';
import { LoginResponse } from './auth';

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
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface CompleteActivationResponse extends LoginResponse {
  activated: boolean;
  message: string;
}

export const cardholderApi = {
  verifyActivation: ({ tarjetaNumero, curp }: VerifyActivationRequest) =>
    apiFetch<VerifyActivationResponse>(
      '/cardholders/verify-activation',
      {
        method: 'POST',
        body: JSON.stringify({
          tarjeta_numero: tarjetaNumero,
          curp,
        }),
      },
      {
        skipAuth: true,
        retryOnUnauthorized: false,
      },
    ),
  completeActivation: ({
    tarjetaNumero,
    email,
    password,
    passwordConfirmation,
  }: CompleteActivationRequest) =>
    apiFetch<CompleteActivationResponse>(
      '/cardholders/complete-activation',
      {
        method: 'POST',
        body: JSON.stringify({
          tarjeta_numero: tarjetaNumero,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      },
      {
        skipAuth: true,
        retryOnUnauthorized: false,
      },
    ),
};
