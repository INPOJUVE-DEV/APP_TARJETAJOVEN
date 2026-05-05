# Frontend Tarjeta Joven

SPA en React + TypeScript para el frontend ciudadano de Tarjeta Joven. Esta version usa autenticacion local del backend y toma `docs/Front-beneficiarios` como fuente de verdad.

## Setup rapido

1. Instala dependencias:

```bash
npm install
```

2. Crea tu entorno local desde `.env.example`.

3. Configura como minimo:

```env
VITE_API_BASE_URL=http://127.0.0.1:8081/api/v1
# VITE_ENABLE_SPEED_INSIGHTS=false
```

4. Levanta la app:

```bash
npm run dev
```

## Flujo implementado

1. El usuario entra a `/login` o `/activar`.
2. Frontend usa `POST /api/v1/auth/login` para iniciar sesion local.
3. El refresh token vive en cookie `httpOnly`; el `accessToken` solo vive en memoria.
4. Si el token vence, el cliente intenta `POST /api/v1/auth/refresh` una sola vez.
5. La activacion valida `tarjeta_numero + curp` y luego completa alta con `email + password + password_confirmation`.
6. El recovery usa `POST /api/v1/auth/forgot-password` y `POST /api/v1/auth/reset-password`.
7. Perfil, catalogo, mapa, ajustes y ayuda quedan protegidos por sesion recuperable.

## Endpoints activos

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/cardholders/verify-activation`
- `POST /api/v1/cardholders/complete-activation`
- `GET /api/v1/me`
- `GET /api/v1/catalog`
- `GET /api/v1/catalog/:id`

## Pruebas

```bash
npm run build
npm run test:unit
npm run test:integration
npm run test:e2e-smoke
```

`test:e2e-smoke` apunta por defecto a `http://127.0.0.1:8081/api/v1`. Para ejecutar todos los escenarios reales necesitas estos fixtures:

```env
E2E_LOGIN_USERNAME=
E2E_LOGIN_PASSWORD=
E2E_ACTIVATION_CARD=
E2E_ACTIVATION_CURP=
E2E_ACTIVATION_EMAIL=
E2E_ACTIVATION_PASSWORD=
E2E_FORGOT_EMAIL=
E2E_RESET_TOKEN=
E2E_RESET_PASSWORD=
```

En CI, si faltan fixtures para un grupo, el smoke test falla.

## Notas de seguridad

- El frontend no usa Auth0 ni persiste refresh tokens en storage accesible por JS.
- La CURP solo se conserva de forma temporal para el paso de activacion.
- Los datos sensibles se excluyen de analytics y logs.
- La PWA no cachea `/me` ni endpoints autenticados de sesion.

## Despliegue en Netlify

- Este repo incluye `netlify.toml` para reenviar `/api/v1/*` al backend y mantener el frontend en mismo origen.
- Si usas Netlify, no habilites `VITE_ENABLE_SPEED_INSIGHTS`; ese script solo debe cargarse en Vercel.
