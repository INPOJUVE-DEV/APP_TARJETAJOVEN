import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPendingActivation,
  getPendingActivation,
  persistPendingActivation,
} from '../src/lib/authFlow';

describe('authFlow', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it('persiste solo el estado temporal de activacion', () => {
    persistPendingActivation({
      tarjetaNumero: 'TJ-000123',
      verified: true,
    });

    expect(getPendingActivation()).toEqual({
      tarjetaNumero: 'TJ-000123',
      verified: true,
    });

    expect(window.sessionStorage.getItem('tj.auth.pending-activation')).not.toContain('CURP');
  });

  it('elimina el estado temporal al limpiar la activacion', () => {
    persistPendingActivation({
      tarjetaNumero: 'TJ-000123',
      verified: true,
    });

    clearPendingActivation();

    expect(getPendingActivation()).toBeNull();
  });
});
