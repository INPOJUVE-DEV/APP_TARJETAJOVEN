const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8081/api/v1';

const normalizeEnvValue = (value: unknown) =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';

const normalizeBooleanEnvValue = (value: unknown) => {
  const normalized = normalizeEnvValue(value).toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
};

const rawApiBaseUrl =
  normalizeEnvValue(import.meta.env.VITE_API_BASE_URL) || normalizeEnvValue(import.meta.env.VITE_API_URL);
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

export const env = {
  mode,
  isDev: import.meta.env.DEV,
  apiBaseUrl,
  defaultApiBaseUrl: DEFAULT_API_BASE_URL,
  enableSpeedInsights: normalizeBooleanEnvValue(import.meta.env.VITE_ENABLE_SPEED_INSIGHTS),
  analyticsUrl: normalizeEnvValue(import.meta.env.VITE_ANALYTICS_URL),
  mapsUrl: normalizeEnvValue(import.meta.env.VITE_MAPS_URL),
  sentryDsn: normalizeEnvValue(import.meta.env.VITE_SENTRY_DSN),
  sentryRelease,
  sentryEnvironment: mode,
};

export type AppEnv = typeof env;
