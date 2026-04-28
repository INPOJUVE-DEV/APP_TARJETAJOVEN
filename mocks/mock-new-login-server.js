const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.MOCK_NEW_LOGIN_PORT ?? 4100);

const mockTokens = {
  accessToken: 'mock-access-token',
};

const validActivation = {
  tarjeta_numero: 'TJ-000123',
  curp: 'SAPM900101MBCNRR06',
};

const mockUser = {
  id: 'user-001',
  nombre: 'MARIA GUADALUPE',
  apellidos: 'SANCHEZ PEREZ',
  email: 'pruebas@tarjetajoven.local',
  municipio: 'Tijuana',
  telefono: '6640000000',
  barcodeValue: 'TJ-000123',
  cardholderSyncId: 'sync-001',
};

const catalogItems = [
  {
    id: 'conv-001',
    nombre: 'Cine Joven Centro',
    categoria: 'Entretenimiento',
    municipio: 'Tijuana',
    descuento: '2x1 en boletos de lunes a jueves',
    direccion: 'Av. Revolucion 1020, Zona Centro, Tijuana',
    horario: 'Lunes a jueves, 12:00 a 21:00',
    descripcion: 'Presenta tu Tarjeta Joven digital en taquilla antes de comprar tus boletos.',
    lat: 32.5336,
    lng: -117.0365,
  },
  {
    id: 'conv-002',
    nombre: 'Cafe Ruta 664',
    categoria: 'Alimentos',
    municipio: 'Tijuana',
    descuento: '15% de descuento en consumo',
    direccion: 'Blvd. Agua Caliente 4558, Aviacion, Tijuana',
    horario: 'Todos los dias, 8:00 a 20:00',
    descripcion: 'Valido en bebidas preparadas y alimentos.',
    lat: 32.5149,
    lng: -117.0116,
  },
];

const setCorsHeaders = (req, baseHeaders = {}) => {
  const origin = req.headers.origin;
  if (!origin) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': '*',
    };
  }

  return {
    ...baseHeaders,
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
};

const sendJson = (req, res, status, payload) => {
  res.writeHead(
    status,
    setCorsHeaders(req, {
      'Content-Type': 'application/json',
    }),
  );
  res.end(JSON.stringify(payload));
};

const handleOptions = (req, res) => {
  res.writeHead(
    204,
    setCorsHeaders(req, {
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }),
  );
  res.end();
};

const collectRequestBody = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });

const parseJsonBody = async (req, res) => {
  try {
    const body = await collectRequestBody(req);
    const text = body.toString('utf8').trim();
    return text ? JSON.parse(text) : {};
  } catch {
    sendJson(req, res, 400, { message: 'Payload JSON no valido.' });
    return null;
  }
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    handleOptions(req, res);
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/v1/cardholders/verify-activation') {
    const parsed = await parseJsonBody(req, res);
    if (!parsed) {
      return;
    }

    const tarjetaNumero = String(parsed.tarjeta_numero ?? '').trim().toUpperCase();
    const curp = String(parsed.curp ?? '').trim().toUpperCase();

    if (!tarjetaNumero || !curp) {
      sendJson(req, res, 422, { message: 'Los datos ingresados no son validos.' });
      return;
    }

    if (tarjetaNumero !== validActivation.tarjeta_numero || curp !== validActivation.curp) {
      sendJson(req, res, 422, { message: 'No se pudo validar la tarjeta con los datos proporcionados.' });
      return;
    }

    sendJson(req, res, 200, {
      can_activate: true,
      message: 'Validacion correcta',
    });
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/v1/cardholders/complete-activation') {
    const parsed = await parseJsonBody(req, res);
    if (!parsed) {
      return;
    }

    const tarjetaNumero = String(parsed.tarjeta_numero ?? '').trim().toUpperCase();
    const auth0IdToken = String(parsed.auth0_id_token ?? '').trim();

    if (!tarjetaNumero || !auth0IdToken) {
      sendJson(req, res, 422, { message: 'Los datos ingresados no son validos.' });
      return;
    }

    if (tarjetaNumero !== validActivation.tarjeta_numero) {
      sendJson(req, res, 409, { message: 'Esta tarjeta ya tiene una cuenta asociada.' });
      return;
    }

    sendJson(req, res, 200, {
      activated: true,
      message: 'Cuenta vinculada correctamente',
    });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/v1/me') {
    const authHeader = String(req.headers.authorization ?? '');
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || token !== mockTokens.accessToken) {
      sendJson(req, res, 401, { message: 'Tu sesion expiro. Inicia sesion nuevamente.' });
      return;
    }

    sendJson(req, res, 200, mockUser);
    return;
  }

  if (
    req.method === 'GET' &&
    ['/api/v1/catalog', '/catalog', '/api/v1/convenios', '/api/v1/benefits'].includes(requestUrl.pathname)
  ) {
    sendJson(req, res, 200, {
      items: catalogItems,
      total: catalogItems.length,
      page: 1,
      pageSize: catalogItems.length,
      totalPages: 1,
    });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(req, res, 200, { status: 'ok' });
    return;
  }

  sendJson(req, res, 404, { message: 'Ruta no encontrada en el mock.' });
});

server.listen(PORT, () => {
  console.log(`Mock de activacion escuchando en http://localhost:${PORT}`);
  console.log('Endpoints disponibles:');
  console.log(`  POST http://localhost:${PORT}/api/v1/cardholders/verify-activation`);
  console.log(`  POST http://localhost:${PORT}/api/v1/cardholders/complete-activation`);
  console.log(`  GET  http://localhost:${PORT}/api/v1/me`);
  console.log(`  GET  http://localhost:${PORT}/api/v1/catalog`);
});
