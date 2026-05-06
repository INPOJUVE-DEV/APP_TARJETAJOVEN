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

## Despliegue en Render

Este repo ya incluye `render.yaml` para desplegar como `Static Site` en la capa gratuita y reenviar `/api/v1/*` a Railway:

- frontend: Render `Static Site`
- backend: `https://apitj-production.up.railway.app/`
- API pública del frontend: `/api/v1`

### Configuracion recomendada

- En Render crea un servicio tipo `Static Site`.
- Conecta este repositorio.
- Si Render detecta el `render.yaml`, acepta esa configuracion.
- Si lo configuras manualmente, usa:

```txt
Build Command: npm run build
Publish Directory: dist
```

- En variables de entorno usa:

```env
VITE_API_BASE_URL=/api/v1
```

### Rewrites necesarias

Si no tomas la configuracion desde `render.yaml`, agrega estas reglas en Render Dashboard:

```txt
/api/v1/*   ->   https://apitj-production.up.railway.app/api/v1/*   (Rewrite)
/*          ->   /index.html                                        (Rewrite)
```

La primera mantiene el frontend en mismo origen para que login, refresh y cookies funcionen mejor. La segunda evita errores `404` al recargar rutas de React Router.

### Pasos de despliegue

1. Sube estos cambios a tu repositorio.
2. En Render entra a `New > Static Site`.
3. Selecciona el repo y la rama que quieres publicar.
4. Usa el `render.yaml` del repo o captura manualmente los valores anteriores.
5. Confirma que la variable `VITE_API_BASE_URL` quede en `/api/v1`.
6. Ejecuta el primer deploy.
7. Abre la URL `onrender.com` generada por Render.
8. Prueba login, refresco de sesion y las rutas internas de la SPA.

### Validacion importante con Railway

Si el backend en Railway emite cookies para refresh/login, evita fijar el atributo `Domain` al dominio de Railway. Lo ideal es dejar `Domain` vacio y usar cookies `Secure` para que la respuesta proxied por Render pueda establecer la cookie sobre el dominio del frontend.

### Nota sobre Vercel

No habilites `VITE_ENABLE_SPEED_INSIGHTS` en Render; ese script solo debe cargarse en Vercel.

## Despliegue en Netlify

- Este repo incluye `netlify.toml` para reenviar `/api/v1/*` al backend y mantener el frontend en mismo origen.
- Si usas Netlify, no habilites `VITE_ENABLE_SPEED_INSIGHTS`; ese script solo debe cargarse en Vercel.

## Despliegue en Vercel

- Este repo incluye `vercel.json` para reenviar `/api/v1/*` al backend de Railway y mantener el frontend en mismo origen.
- La regla `/:path* -> /index.html` conserva el fallback de la SPA para rutas como `/login`, `/perfil` o `/catalog`.
- Si ya existe un deploy roto en Vercel, necesitas redeploy para que estas reglas empiecen a aplicar.
