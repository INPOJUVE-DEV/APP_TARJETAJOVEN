import { ApiError, isApiError } from './apiClient';

export type ActivationErrorKind = 'already_linked' | 'blocked' | 'invalid' | 'session_expired' | 'error';

const GENERIC_ACTIVATION_ERROR = 'Los datos no coinciden. Verifica tu numero de tarjeta y CURP.';
const GENERIC_REQUEST_ERROR = 'No pudimos procesar la solicitud. Intenta mas tarde.';

const mapApiStatusToMessage = (status: number) => {
  switch (status) {
    case 401:
      return 'Tu acceso expiro. Inicia sesion nuevamente.';
    case 403:
      return 'Esta tarjeta no esta activa. Acude a soporte.';
    case 409:
      return 'Esta tarjeta ya tiene una cuenta asociada.';
    case 410:
      return 'Este flujo ya no esta disponible. Usa la activacion vigente.';
    case 422:
      return GENERIC_ACTIVATION_ERROR;
    case 500:
      return GENERIC_REQUEST_ERROR;
    default:
      return GENERIC_REQUEST_ERROR;
  }
};

export const getRequestErrorMessage = (
  error: unknown,
  options?: {
    fallbackMessage?: string;
    useGenericActivationError?: boolean;
  },
) => {
  if (options?.useGenericActivationError && isApiError(error)) {
    if (error.status === 403 || error.status === 409 || error.status === 422) {
      return mapApiStatusToMessage(error.status);
    }
  }

  if (isApiError(error)) {
    return mapApiStatusToMessage(error.status);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return options?.fallbackMessage ?? GENERIC_REQUEST_ERROR;
};

export const isAccountAlreadyLinkedError = (error: unknown) =>
  isApiError(error) && error.status === 409;

export const isBlockedActivationError = (error: unknown) =>
  isApiError(error) && error.status === 403;

export const isInvalidActivationError = (error: unknown) =>
  isApiError(error) && error.status === 422;

export const isSessionExpiredError = (error: unknown) =>
  isApiError(error) && error.status === 401;

export const isUnlinkedProfileError = (error: ApiError) =>
  error.status === 403 || error.status === 404 || error.status === 410;

export const getActivationErrorKind = (error: unknown): ActivationErrorKind => {
  if (isAccountAlreadyLinkedError(error)) {
    return 'already_linked';
  }

  if (isBlockedActivationError(error)) {
    return 'blocked';
  }

  if (isInvalidActivationError(error)) {
    return 'invalid';
  }

  if (isSessionExpiredError(error)) {
    return 'session_expired';
  }

  return 'error';
};
