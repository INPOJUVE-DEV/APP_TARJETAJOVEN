# Flujo de activacion embebido

Este documento resume el flujo vigente en la app.

## Variables relevantes

- `VITE_API_BASE_URL`
- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE`
- `VITE_AUTH0_DB_CONNECTION`
- `VITE_AUTH0_REDIRECT_URI`
- `VITE_AUTH0_LOGOUT_REDIRECT_URI`

## Paso a paso

1. El usuario captura numero de tarjeta y CURP en `/activar`.
2. Frontend normaliza la CURP y llama:

```http
POST /api/v1/cardholders/verify-activation
```

3. Si la API responde `can_activate: true`, la app muestra una pantalla intermedia y el boton `Crear mi acceso`.
4. El usuario crea su acceso con correo y contrasena dentro de la app.
5. La app autentica la sesion y obtiene el `id_token` para llamar:

```http
POST /api/v1/cardholders/complete-activation
```

6. Con la sesion ya vinculada, el frontend consulta:

```http
GET /api/v1/me
```

## Comportamiento legacy

- `/registro` redirige a `/activar`.
- `/registro/tarjeta-fisica` y `/registro/tarjeta-fisica/crear-usuario` redirigen a `/activar`.
- No se usan OTP, password local ni registro directo contra API_TJ.
