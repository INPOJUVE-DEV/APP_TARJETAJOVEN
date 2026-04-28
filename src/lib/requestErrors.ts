import { ApiError, isApiError } from './apiClient';

const GENERIC_ACTIVATION_ERROR = 'No se pudo validar la tarjeta con los datos proporcionados.';
const GENERIC_REQUEST_ERROR = 'No pudimos procesar la solicitud. Intenta mas tarde.';

const mapApiStatusToMessage = (status: number) => {
  switch (status) {
    case 401:
      return 'Tu sesion expiro. Inicia sesion nuevamente.';
    case 409:
      return 'Esta tarjeta ya tiene una cuenta asociada.';
    case 410:
      return 'Este flujo ya no esta disponible. Usa la activacion con Auth0.';
    case 422:
      return 'Los datos ingresados no son validos.';
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
    if (error.status === 409) {
      return mapApiStatusToMessage(error.status);
    }

    if (error.status === 422) {
      return GENERIC_ACTIVATION_ERROR;
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

export const isSessionExpiredError = (error: unknown) =>
  isApiError(error) && error.status === 401;

export const isUnlinkedProfileError = (error: ApiError) =>
  error.status === 403 || error.status === 404 || error.status === 410;
