const DEFAULT_API_BASE_URL = '/api/v1';

const rawApiBaseUrl = import.meta.env.VITE_API_URL;
const apiBaseUrl =
  typeof rawApiBaseUrl === 'string' && rawApiBaseUrl.trim().length > 0
    ? rawApiBaseUrl.trim()
    : DEFAULT_API_BASE_URL;

if (import.meta.env.PROD && /^https?:\/\//i.test(apiBaseUrl) && apiBaseUrl.startsWith('http://')) {
  throw new Error('VITE_API_URL debe usar https en produccion.');
}

const rawIdentityValidationUrl = import.meta.env.VITE_ID_VALIDATION_URL;
const identityValidationUrl =
  typeof rawIdentityValidationUrl === 'string' && rawIdentityValidationUrl.trim().length > 0
    ? rawIdentityValidationUrl.trim()
    : '';

const mode = import.meta.env.MODE;
const rawVersion =
  import.meta.env.VITE_APP_VERSION ?? import.meta.env.VITE_COMMIT_SHA ?? undefined;

const sentryRelease =
  import.meta.env.VITE_SENTRY_RELEASE ??
  (rawVersion ? `frontend_tj@${rawVersion}` : `frontend_tj@${mode}`);

/**
 * Centraliza el acceso a las variables de entorno expuestas por Vite para facilitar
 * el despliegue en distintos entornos (desarrollo local, preview y produccion).
 */
export const env = {
  mode,
  isDev: import.meta.env.DEV,
  apiBaseUrl,
  defaultApiBaseUrl: DEFAULT_API_BASE_URL,
  identityValidationUrl,
  analyticsUrl: import.meta.env.VITE_ANALYTICS_URL ?? '',
  mapsUrl: import.meta.env.VITE_MAPS_URL ?? '',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN ?? '',
  sentryRelease,
  sentryEnvironment: mode,
};

export type AppEnv = typeof env;
