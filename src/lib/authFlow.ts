export type ActivationState = {
  tarjetaNumero: string;
  verified: boolean;
};

const PENDING_ACTIVATION_STORAGE_KEY = 'tj.auth.pending-activation';

const isBrowser = typeof window !== 'undefined';

export const getPendingActivation = (): ActivationState | null => {
  if (!isBrowser) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(PENDING_ACTIVATION_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as ActivationState | null;
    if (
      parsed &&
      typeof parsed.tarjetaNumero === 'string' &&
      parsed.tarjetaNumero.trim().length > 0 &&
      typeof parsed.verified === 'boolean'
    ) {
      return {
        tarjetaNumero: parsed.tarjetaNumero.trim(),
        verified: parsed.verified,
      };
    }
  } catch {
    window.sessionStorage.removeItem(PENDING_ACTIVATION_STORAGE_KEY);
  }

  return null;
};

export const persistPendingActivation = (state: ActivationState | null) => {
  if (!isBrowser) {
    return;
  }

  if (!state) {
    window.sessionStorage.removeItem(PENDING_ACTIVATION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(
    PENDING_ACTIVATION_STORAGE_KEY,
    JSON.stringify({
      tarjetaNumero: state.tarjetaNumero.trim(),
      verified: state.verified,
    }),
  );
};

export const clearPendingActivation = () => {
  persistPendingActivation(null);
};
