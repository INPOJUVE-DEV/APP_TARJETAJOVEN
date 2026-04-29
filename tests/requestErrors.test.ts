import { describe, expect, it } from 'vitest';
import {
  getActivationErrorKind,
  getRequestErrorMessage,
  isAccountAlreadyLinkedError,
} from '../src/lib/requestErrors';

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
    ).toBe('Los datos no coinciden. Verifica tu numero de tarjeta y CURP.');
  });

  it('identifica cuentas ya vinculadas', () => {
    expect(isAccountAlreadyLinkedError(createApiError(409, 'Duplicado'))).toBe(true);
    expect(isAccountAlreadyLinkedError(createApiError(500, 'Error'))).toBe(false);
  });

  it('mapea estados de bloqueo e invalidez para activacion', () => {
    expect(getActivationErrorKind(createApiError(403, 'Bloqueado'))).toBe('blocked');
    expect(getActivationErrorKind(createApiError(422, 'Invalido'))).toBe('invalid');
    expect(getRequestErrorMessage(createApiError(403, 'Bloqueado'))).toBe(
      'Esta tarjeta no esta activa. Acude a soporte.',
    );
  });
});
