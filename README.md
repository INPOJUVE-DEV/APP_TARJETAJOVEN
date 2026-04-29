# Frontend Tarjeta Joven

SPA en React + TypeScript para Tarjeta Joven. Esta version usa el flujo nuevo de activacion:

- validacion por `tarjeta_numero + CURP`
- creacion e inicio de sesion con correo y contrasena desde la app
- vinculacion contra API_TJ mediante `auth0_id_token`
- carga de perfil desde `GET /api/v1/me`

## Setup rapido

1. Instala dependencias:

```bash
npm install
```

2. Crea tu entorno local desde `.env.example`.

3. Configura como minimo:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.tarjetajoven.local
VITE_AUTH0_DB_CONNECTION=Username-Password-Authentication
VITE_AUTH0_REDIRECT_URI=http://localhost:3000/auth/callback
VITE_AUTH0_LOGOUT_REDIRECT_URI=http://localhost:3000/login
# VITE_ENABLE_SPEED_INSIGHTS=false
```

4. Levanta la app:

```bash
npm run dev
```

## Flujo implementado

1. El usuario entra a `/activar`.
2. Frontend llama `POST /api/v1/cardholders/verify-activation`.
3. Si valida, muestra una confirmacion intermedia y el boton `Crear mi acceso`.
4. El usuario crea su acceso con correo y contrasena desde la app.
5. Frontend obtiene un `id_token` y llama `POST /api/v1/cardholders/complete-activation`.
6. Obtiene perfil desde `GET /api/v1/me`.

## Endpoints activos

- `POST /api/v1/cardholders/verify-activation`
- `POST /api/v1/cardholders/complete-activation`
- `GET /api/v1/me`
- `GET /api/v1/catalog`

## Notas de seguridad

- La CURP no se guarda en `localStorage`, `sessionStorage` ni IndexedDB.
- El frontend no construye `auth0_user_id`.
- Los datos sensibles se excluyen de analytics y logs.
- La sesion persistida se controla desde una capa embebida del frontend.
- La PWA no cachea `/me` ni endpoints autenticados de activacion.

## Despliegue en Netlify

- Este repo incluye `netlify.toml` para reenviar `/api/v1/*` hacia Railway y mantener el frontend en mismo origen.
- En Netlify, deja `VITE_API_BASE_URL` vacio o configuralo como `/api/v1`.
- Si usas Netlify, no habilites `VITE_ENABLE_SPEED_INSIGHTS`; ese script solo debe cargarse en Vercel.
