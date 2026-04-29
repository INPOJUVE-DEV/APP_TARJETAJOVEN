const DEFAULT_API_BASE_URL = '/api/v1';

const normalizeEnvValue = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';

const rawApiBaseUrl = normalizeEnvValue(import.meta.env.VITE_API_BASE_URL) || normalizeEnvValue(import.meta.env.VITE_API_URL);
const apiBaseUrl = rawApiBaseUrl || DEFAULT_API_BASE_URL;

if (import.meta.env.PROD && /^https?:\/\//i.test(apiBaseUrl) && apiBaseUrl.startsWith('http://')) {
  throw new Error('VITE_API_BASE_URL debe usar https en produccion.');
}

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
  analyticsUrl: normalizeEnvValue(import.meta.env.VITE_ANALYTICS_URL),
  mapsUrl: normalizeEnvValue(import.meta.env.VITE_MAPS_URL),
  sentryDsn: normalizeEnvValue(import.meta.env.VITE_SENTRY_DSN),
  sentryRelease,
  sentryEnvironment: mode,
  auth0Domain: normalizeEnvValue(import.meta.env.VITE_AUTH0_DOMAIN),
  auth0ClientId: normalizeEnvValue(import.meta.env.VITE_AUTH0_CLIENT_ID),
  auth0Audience: normalizeEnvValue(import.meta.env.VITE_AUTH0_AUDIENCE),
  auth0DbConnection: normalizeEnvValue(import.meta.env.VITE_AUTH0_DB_CONNECTION),
  auth0RedirectUri:
    normalizeEnvValue(import.meta.env.VITE_AUTH0_REDIRECT_URI) ||
    (typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : ''),
  auth0LogoutRedirectUri:
    normalizeEnvValue(import.meta.env.VITE_AUTH0_LOGOUT_REDIRECT_URI) ||
    (typeof window !== 'undefined' ? `${window.location.origin}/login` : ''),
};

export type AppEnv = typeof env;
