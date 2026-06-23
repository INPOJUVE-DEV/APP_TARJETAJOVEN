const STRICT_CURP_REGEX =
  /^[A-Z]{1}[AEIOUX]{1}[A-Z]{2}\d{2}(?:0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM]{1}(?:AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]{1}\d{1}$/;
const BASIC_CURP_REGEX = /^[A-Z0-9]{18}$/;

export const normalizeCurp = (value: string) => value.trim().toUpperCase();

export const isValidCurp = (value: string, options?: { strict?: boolean }) => {
  const normalized = normalizeCurp(value);
  const regex = options?.strict ? STRICT_CURP_REGEX : BASIC_CURP_REGEX;
  return regex.test(normalized);
};

export const getBirthDateFromCurp = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const normalized = normalizeCurp(value);
  if (!isValidCurp(normalized, { strict: true })) {
    return null;
  }

  const yearFragment = Number.parseInt(normalized.slice(4, 6), 10);
  const month = Number.parseInt(normalized.slice(6, 8), 10);
  const day = Number.parseInt(normalized.slice(8, 10), 10);
  const differentiator = normalized[16] ?? '';
  const year = `${differentiator}`.match(/[A-Z]/) ? 2000 + yearFragment : 1900 + yearFragment;
  const birthDate = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate.getUTCFullYear() !== year ||
    birthDate.getUTCMonth() !== month - 1 ||
    birthDate.getUTCDate() !== day
  ) {
    return null;
  }

  return birthDate;
};

export const getAgeFromCurp = (value?: string | null, referenceDate = new Date()) => {
  const birthDate = getBirthDateFromCurp(value);
  if (!birthDate) {
    return null;
  }

  const referenceYear = referenceDate.getUTCFullYear();
  const referenceMonth = referenceDate.getUTCMonth();
  const referenceDay = referenceDate.getUTCDate();
  let age = referenceYear - birthDate.getUTCFullYear();

  const hadBirthdayThisYear =
    referenceMonth > birthDate.getUTCMonth() ||
    (referenceMonth === birthDate.getUTCMonth() && referenceDay >= birthDate.getUTCDate());

  if (!hadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

export { STRICT_CURP_REGEX };
