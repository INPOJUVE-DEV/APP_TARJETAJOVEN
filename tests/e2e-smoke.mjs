const baseUrl = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:8081/api/v1';
const isCi = process.env.CI === 'true' || process.env.CI === '1';

const groups = {
  login: ['E2E_LOGIN_USERNAME', 'E2E_LOGIN_PASSWORD'],
  activation: [
    'E2E_ACTIVATION_CARD',
    'E2E_ACTIVATION_CURP',
    'E2E_ACTIVATION_EMAIL',
    'E2E_ACTIVATION_PASSWORD',
  ],
  recovery: ['E2E_FORGOT_EMAIL', 'E2E_RESET_TOKEN', 'E2E_RESET_PASSWORD'],
};

const readGroup = (name) => {
  const missing = groups[name].filter((key) => !process.env[key]);

  if (missing.length > 0) {
    if (isCi) {
      throw new Error(`Faltan variables para el grupo ${name}: ${missing.join(', ')}`);
    }

    console.log(`[e2e-smoke] Omitiendo ${name}; faltan variables: ${missing.join(', ')}`);
    return null;
  }

  return Object.fromEntries(groups[name].map((key) => [key, process.env[key]]));
};

let cookieJar = '';

const updateCookieJar = (response) => {
  const setCookieHeaders =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [response.headers.get('set-cookie')].filter(Boolean);

  if (!setCookieHeaders.length) {
    return;
  }

  const nextCookies = setCookieHeaders
    .map((cookie) => cookie.split(';', 1)[0])
    .filter(Boolean);

  if (nextCookies.length > 0) {
    cookieJar = nextCookies.join('; ');
  }
};

const request = async (path, options = {}) => {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (cookieJar) {
    headers.set('Cookie', cookieJar);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  updateCookieJar(response);

  const text = await response.text();
  let payload;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  return { response, payload };
};

const assertOk = async (label, path, options, expectedStatuses = [200, 201, 204]) => {
  const { response, payload } = await request(path, options);

  if (!expectedStatuses.includes(response.status)) {
    throw new Error(
      `${label} fallo con status ${response.status}: ${
        typeof payload === 'string' ? payload : JSON.stringify(payload)
      }`,
    );
  }

  console.log(`[e2e-smoke] OK ${label} -> ${response.status}`);
  return payload;
};

const runReachability = async () => {
  const { response } = await request('/auth/refresh', {
    method: 'POST',
  });

  if (![200, 401].includes(response.status)) {
    throw new Error(`La API local no respondio como se esperaba. Status recibido: ${response.status}`);
  }

  console.log(`[e2e-smoke] API alcanzable en ${baseUrl}`);
};

const runLoginFlow = async (config) => {
  cookieJar = '';

  const loginPayload = await assertOk('login', '/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: config.E2E_LOGIN_USERNAME,
      password: config.E2E_LOGIN_PASSWORD,
    }),
  });

  const accessToken = loginPayload.accessToken;
  if (!accessToken) {
    throw new Error('Login no devolvio accessToken.');
  }

  await assertOk(
    'me',
    '/me',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    [200],
  );

  await assertOk(
    'catalog',
    '/catalog',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    [200],
  );

  const refreshedPayload = await assertOk('refresh', '/auth/refresh', {
    method: 'POST',
  });

  const refreshedToken = refreshedPayload.accessToken;
  if (!refreshedToken) {
    throw new Error('Refresh no devolvio accessToken.');
  }

  await assertOk(
    'logout',
    '/auth/logout',
    {
      method: 'POST',
    },
    [204],
  );
};

const runActivationFlow = async (config) => {
  cookieJar = '';

  await assertOk('verify-activation', '/cardholders/verify-activation', {
    method: 'POST',
    body: JSON.stringify({
      tarjeta_numero: config.E2E_ACTIVATION_CARD,
      curp: config.E2E_ACTIVATION_CURP,
    }),
  });

  await assertOk('complete-activation', '/cardholders/complete-activation', {
    method: 'POST',
    body: JSON.stringify({
      tarjeta_numero: config.E2E_ACTIVATION_CARD,
      email: config.E2E_ACTIVATION_EMAIL,
      password: config.E2E_ACTIVATION_PASSWORD,
      password_confirmation: config.E2E_ACTIVATION_PASSWORD,
    }),
  });
};

const runRecoveryFlow = async (config) => {
  await assertOk('forgot-password', '/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email: config.E2E_FORGOT_EMAIL,
    }),
  });

  await assertOk('reset-password', '/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: config.E2E_RESET_TOKEN,
      password: config.E2E_RESET_PASSWORD,
      password_confirmation: config.E2E_RESET_PASSWORD,
    }),
  });
};

const main = async () => {
  await runReachability();

  const login = readGroup('login');
  const activation = readGroup('activation');
  const recovery = readGroup('recovery');

  if (login) {
    await runLoginFlow(login);
  }

  if (activation) {
    await runActivationFlow(activation);
  }

  if (recovery) {
    await runRecoveryFlow(recovery);
  }

  console.log('[e2e-smoke] Finalizado');
};

main().catch((error) => {
  console.error(`[e2e-smoke] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
