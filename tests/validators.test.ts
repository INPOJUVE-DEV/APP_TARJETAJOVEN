import { describe, expect, it } from 'vitest';
import {
  isSecurePassword,
  isValidEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordsMatch,
} from '../src/lib/validators';

describe('validators', () => {
  it('valida correos electronicos', () => {
    expect(isValidEmail('ana@example.com')).toBe(true);
    expect(isValidEmail('invalido')).toBe(false);
  });

  it('aplica la politica minima de contrasena', () => {
    expect(isSecurePassword('Segura123456')).toBe(true);
    expect(isSecurePassword('Corta123')).toBe(false);
    expect(isSecurePassword(`A${'a'.repeat(PASSWORD_MAX_LENGTH)}1`)).toBe(false);
    expect(PASSWORD_MIN_LENGTH).toBe(12);
  });

  it('valida confirmacion de contrasena', () => {
    expect(passwordsMatch('Segura123456', 'Segura123456')).toBe(true);
    expect(passwordsMatch('Segura123456', 'Otra123456789')).toBe(false);
  });
});
