const http = require('http');
const { URL } = require('url');

const PORT = Number(process.env.MOCK_NEW_LOGIN_PORT ?? 4100);

const identityResponse = {
  nombre: 'MARIA GUADALUPE',
  apellido_paterno: 'SANCHEZ',
  apellido_materno: 'PEREZ',
  curp: 'SAPM900101MBCNRR06',
  discapacidad: false,
  id_ine: '0000000000123',
  municipio: 'Tijuana',
  seccional: '0456',
  calle: 'Av. Siempre Viva',
  numero_ext: '742',
  numero_int: '3B',
  colonia: 'Centro',
};

const submissions = [];
const mockUser = {
  id: 'user-001',
  nombre: 'MARIA GUADALUPE',
  apellidos: 'SANCHEZ PEREZ',
  curp: 'SAPM900101MBCNRR06',
  email: 'pruebas@tarjetajoven.local',
  municipio: 'Tijuana',
  telefono: '6640000000',
};
const mockCredentials = {
  username: 'pruebas@tarjetajoven.local',
  password: 'Prueba123',
};
const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
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
    horario: 'Todos los d\u00edas, 8:00 a 20:00',
    descripcion: 'V\u00e1lido en bebidas preparadas y alimentos. No acumulable con otras promociones.',
    lat: 32.5149,
    lng: -117.0116,
  },
  {
    id: 'conv-003',
    nombre: 'Libreria Horizonte',
    categoria: 'Educaci\u00f3n',
    municipio: 'Mexicali',
    descuento: '10% en libros y material escolar',
    direccion: 'Calz. Independencia 2100, Mexicali',
    horario: 'Lunes a sabado, 10:00 a 19:00',
    descripcion: 'Aplica en compras en tienda f\u00edsica presentando identificaci\u00f3n y tarjeta.',
    lat: 32.6519,
    lng: -115.4683,
  },
  {
    id: 'conv-004',
    nombre: 'Gimnasio Activa BC',
    categoria: 'Deporte',
    municipio: 'Ensenada',
    descuento: 'Inscripcion gratis y 20% en mensualidad',
    direccion: 'Av. Ruiz 780, Zona Centro, Ensenada',
    horario: 'Lunes a viernes, 6:00 a 22:00',
    descripcion: 'Beneficio disponible para nuevas inscripciones.',
    lat: 31.8667,
    lng: -116.5964,
  },
  {
    id: 'conv-005',
    nombre: 'Optica Mirada Joven',
    categoria: 'Salud',
    municipio: 'Tecate',
    descuento: '30% en examen de la vista',
    direccion: 'Benito Juarez 145, Zona Centro, Tecate',
    horario: 'Lunes a sabado, 9:00 a 18:00',
    descripcion: 'Incluye diagnostico basico y ajuste de armazon.',
    lat: 32.5672,
    lng: -116.6251,
  },
  {
    id: 'conv-006',
    nombre: 'Transporte Escolar Norte',
    categoria: 'Movilidad',
    municipio: 'Playas de Rosarito',
    descuento: '12% en rutas universitarias',
    direccion: 'Blvd. Benito Juarez 310, Rosarito',
    horario: 'Lunes a viernes, 7:00 a 18:00',
    descripcion: 'Sujeto a disponibilidad de ruta y cupo.',
    lat: 32.3426,
    lng: -117.0612,
  },
];

const extraCatalogCategories = ['Alimentos', 'Educaci\u00f3n', 'Deporte', 'Salud', 'Movilidad', 'Entretenimiento'];
const extraCatalogMunicipalities = ['Tijuana', 'Mexicali', 'Ensenada', 'Tecate', 'Playas de Rosarito'];

for (let index = 7; index <= 32; index += 1) {
  const category = extraCatalogCategories[(index - 7) % extraCatalogCategories.length];
  const municipality = extraCatalogMunicipalities[(index - 7) % extraCatalogMunicipalities.length];

  catalogItems.push({
    id: `conv-${String(index).padStart(3, '0')}`,
    nombre: `Convenio Joven ${String(index).padStart(2, '0')}`,
    categoria: category,
    municipio: municipality,
    descuento: `${10 + (index % 5) * 5}% de beneficio`,
    direccion: `Sucursal ${index}, ${municipality}`,
    horario: 'Lunes a viernes, 9:00 a 18:00',
    descripcion: `Beneficio mock para validar paginaci\u00f3n y filtros en ${category}.`,
    lat: 32.5 + (index % 5) * 0.01,
    lng: -117 + (index % 6) * 0.01,
  });
}

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

const normalizeForSearch = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const matchesFilter = (value, filter) => {
  if (!filter) {
    return true;
  }

  return filter
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .some((item) => normalizeForSearch(value) === normalizeForSearch(item));
};

const matchesSearch = (item, query) => {
  if (!query) {
    return true;
  }

  const haystack = [
    item.nombre,
    item.categoria,
    item.municipio,
    item.descuento,
    item.direccion,
    item.descripcion,
  ]
    .map(normalizeForSearch)
    .join(' ');

  return haystack.includes(normalizeForSearch(query));
};

const handleCatalogRequest = (req, res, requestUrl) => {
  const category = requestUrl.searchParams.get('categoria');
  const municipality = requestUrl.searchParams.get('municipio');
  const query = requestUrl.searchParams.get('q');
  const page = Math.max(Number(requestUrl.searchParams.get('page') ?? 1), 1);
  const pageSize = Math.max(Number(requestUrl.searchParams.get('pageSize') ?? 25), 1);

  const filteredItems = catalogItems.filter(
    (item) =>
      matchesFilter(item.categoria, category) &&
      matchesFilter(item.municipio, municipality) &&
      matchesSearch(item, query),
  );
  const total = filteredItems.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const start = (page - 1) * pageSize;
  const items = filteredItems.slice(start, start + pageSize);

  sendJson(req, res, 200, {
    items,
    total,
    page,
    pageSize,
    totalPages,
  });
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host}`);

  if (req.method === 'OPTIONS') {
    handleOptions(req, res);
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/mock-ine') {
    // Solo consumimos el cuerpo para liberar el socket; no es necesario parsear el multipart.
    try {
      await collectRequestBody(req);
    } catch {
      sendJson(req, res, 500, { message: 'Error al leer los archivos de prueba.' });
      return;
    }

    sendJson(req, res, 200, identityResponse);
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/v1/auth/login') {
    let parsed = null;

    try {
      const body = await collectRequestBody(req);
      const text = body.toString('utf8').trim();
      parsed = text ? JSON.parse(text) : {};
    } catch {
      sendJson(req, res, 400, { message: 'Payload JSON no valido.' });
      return;
    }

    const username = String(parsed.username ?? '').trim().toLowerCase();
    const password = String(parsed.password ?? '');

    if (username !== mockCredentials.username || password !== mockCredentials.password) {
      sendJson(req, res, 401, { message: 'Credenciales invalidas.' });
      return;
    }

    sendJson(req, res, 200, mockTokens);
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/v1/auth/logout') {
    res.writeHead(204, setCorsHeaders(req));
    res.end();
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/v1/me') {
    const authHeader = String(req.headers.authorization ?? '');
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token || token !== mockTokens.accessToken) {
      sendJson(req, res, 401, { message: 'No autorizado.' });
      return;
    }

    sendJson(req, res, 200, mockUser);
    return;
  }

  if (
    req.method === 'GET' &&
    ['/api/v1/catalog', '/catalog', '/api/v1/convenios', '/api/v1/benefits'].includes(
      requestUrl.pathname,
    )
  ) {
    handleCatalogRequest(req, res, requestUrl);
    return;
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/v1/cardholders') {
    let parsed = null;

    try {
      const body = await collectRequestBody(req);
      const text = body.toString('utf8').trim();
      parsed = text ? JSON.parse(text) : {};
    } catch {
      sendJson(req, res, 400, { message: 'Payload JSON no válido.' });
      return;
    }

    submissions.push({
      receivedAt: new Date().toISOString(),
      ...parsed,
    });

    sendJson(req, res, 201, {
      message: 'Registro simulado almacenado correctamente.',
      totalSubmissions: submissions.length,
    });
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/v1/cardholders') {
    sendJson(req, res, 200, submissions);
    return;
  }

  if (req.method === 'GET' && requestUrl.pathname === '/health') {
    sendJson(req, res, 200, { status: 'ok', submissions: submissions.length });
    return;
  }

  sendJson(req, res, 404, { message: 'Ruta no encontrada en el mock.' });
});

server.listen(PORT, () => {
  console.log(`Mock de nuevo registro escuchando en http://localhost:${PORT}`);
  console.log('Endpoints disponibles:');
  console.log(`  POST http://localhost:${PORT}/mock-ine`);
  console.log(`  POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`  POST http://localhost:${PORT}/api/v1/auth/logout`);
  console.log(`  GET  http://localhost:${PORT}/api/v1/me`);
  console.log(`  GET  http://localhost:${PORT}/api/v1/catalog`);
  console.log(`  POST http://localhost:${PORT}/api/v1/cardholders`);
  console.log(`  GET  http://localhost:${PORT}/api/v1/cardholders`);
});
