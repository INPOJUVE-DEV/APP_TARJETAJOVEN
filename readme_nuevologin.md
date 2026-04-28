# Flujo de activacion con Auth0

Este documento resume el flujo vigente en la app.

## Variables relevantes

- `VITE_API_BASE_URL`
- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE`
- `VITE_AUTH0_REDIRECT_URI`
- `VITE_AUTH0_LOGOUT_REDIRECT_URI`

## Paso a paso

1. El usuario captura numero de tarjeta y CURP en `/activar`.
2. Frontend normaliza la CURP y llama:

```http
POST /api/v1/cardholders/verify-activation
```

3. Si la API responde `can_activate: true`, el frontend abre Auth0.
4. Al completar la activacion o el login en Auth0, el frontend obtiene el `id_token` raw y llama:

```http
POST /api/v1/cardholders/complete-activation
```

5. Con la sesion ya vinculada, el frontend consulta:

```http
GET /api/v1/me
```

## Comportamiento legacy

- `/registro` redirige a `/activar`.
- `/registro/tarjeta-fisica` y `/registro/tarjeta-fisica/crear-usuario` redirigen a `/activar`.
- No se usan OTP, password local ni registro directo contra API_TJ.
