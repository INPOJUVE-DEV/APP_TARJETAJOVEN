const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export const isValidEmail = (value: string) => EMAIL_REGEX.test(value.trim().toLowerCase());

export const isSecurePassword = (
  value: string,
  minLength = PASSWORD_MIN_LENGTH,
  maxLength = PASSWORD_MAX_LENGTH,
) => {
  const normalized = value ?? '';
  return (
    normalized.length >= minLength &&
    normalized.length <= maxLength &&
    /[A-Z]/.test(normalized) &&
    /[a-z]/.test(normalized) &&
    /\d/.test(normalized)
  );
};

export const passwordsMatch = (password: string, passwordConfirmation: string) =>
  password === passwordConfirmation;
