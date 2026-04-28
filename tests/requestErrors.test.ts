import { describe, expect, it } from 'vitest';
import { getRequestErrorMessage, isAccountAlreadyLinkedError } from '../src/lib/requestErrors';

const createApiError = (status: number, message: string) =>
  Object.assign(new Error(message), {
    status,
  });

describe('requestErrors', () => {
  it('usa mensaje generico para fallos de activacion 422', () => {
    const error = createApiError(422, 'CURP invalida');

    expect(
      getRequestErrorMessage(error, {
        useGenericActivationError: true,
      }),
    ).toBe('No se pudo validar la tarjeta con los datos proporcionados.');
  });

  it('identifica cuentas ya vinculadas', () => {
    expect(isAccountAlreadyLinkedError(createApiError(409, 'Duplicado'))).toBe(true);
    expect(isAccountAlreadyLinkedError(createApiError(500, 'Error'))).toBe(false);
  });
});
