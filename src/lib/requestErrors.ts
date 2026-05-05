import { ApiError, isApiError } from './apiClient';

export type ActivationErrorKind = 'already_linked' | 'blocked' | 'invalid' | 'session_expired' | 'error';

const GENERIC_ACTIVATION_ERROR = 'Los datos no coinciden. Verifica tu numero de tarjeta y CURP.';
const GENERIC_REQUEST_ERROR = 'No pudimos procesar la solicitud. Intenta mas tarde.';

const getApiMessage = (error: unknown) => {
  if (!isApiError(error)) {
    return '';
  }

  if (typeof error.payload === 'object' && error.payload && 'message' in error.payload) {
    return String((error.payload as Record<string, unknown>).message ?? '').toLowerCase();
  }

  return error.message.toLowerCase();
};

const mapApiStatusToMessage = (status: number) => {
  switch (status) {
    case 401:
      return 'Tu acceso expiro. Inicia sesion nuevamente.';
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

export const isAccountAlreadyLinkedError = (error: unknown) =>
  isApiError(error) &&
  error.status === 409 &&
  (
    getApiMessage(error).includes('ya tiene una cuenta asociada') ||
    getApiMessage(error).includes('ya esta vinculada') ||
    getApiMessage(error).includes('ya cuenta con una cuenta vinculada') ||
    getApiMessage(error).includes('duplicado') ||
    getApiMessage(error).includes('email ya')
  );

export const isBlockedActivationError = (error: unknown) =>
  isApiError(error) &&
  (
    (error.status === 403 &&
      (
        getApiMessage(error).includes('bloquead') ||
        getApiMessage(error).includes('no permitido') ||
        getApiMessage(error).includes('no esta activa') ||
        getApiMessage(error).includes('no esta disponible')
      )) ||
    (error.status === 409 && getApiMessage(error).includes('no esta activa'))
  );

export const isInvalidActivationError = (error: unknown) =>
  isApiError(error) &&
  (error.status === 422 ||
    (error.status === 403 && !isBlockedActivationError(error)) ||
    (error.status === 409 && !isBlockedActivationError(error) && !isAccountAlreadyLinkedError(error)));

export const isSessionExpiredError = (error: unknown) =>
  isApiError(error) && error.status === 401;

export const isUnlinkedProfileError = (_error: ApiError) => false;

export const getRequestErrorMessage = (
  error: unknown,
  options?: {
    fallbackMessage?: string;
    useGenericActivationError?: boolean;
  },
) => {
  if (isAccountAlreadyLinkedError(error)) {
    return 'Esta tarjeta ya tiene una cuenta asociada.';
  }

  if (isBlockedActivationError(error)) {
    return 'Esta tarjeta no esta activa. Acude a soporte.';
  }

  if (isInvalidActivationError(error)) {
    return GENERIC_ACTIVATION_ERROR;
  }

  if (options?.useGenericActivationError && isApiError(error)) {
    if (error.status === 403 || error.status === 409 || error.status === 422) {
      return mapApiStatusToMessage(error.status);
    }
  }

  if (isApiError(error)) {
    if (typeof error.payload === 'object' && error.payload && 'message' in error.payload) {
      return String((error.payload as Record<string, unknown>).message ?? mapApiStatusToMessage(error.status));
    }

    return mapApiStatusToMessage(error.status);
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return options?.fallbackMessage ?? GENERIC_REQUEST_ERROR;
};

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
