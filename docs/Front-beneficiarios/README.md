> Estado: vigente para el frontend ciudadano de este repositorio.

# Beneficiario Local Auth

Paquete completo para que el equipo de frontend implemente el flujo ciudadano con autenticacion local de `API_TJ`.

## Objetivo

Este paquete cubre:

- login local del beneficiario
- refresh token por cookie `httpOnly`
- logout
- activacion local por `tarjeta_numero + curp`
- recuperacion de contrasena
- contratos exactos del API
- manejo de errores, estados y reintentos
- checklist de integracion y QA

## Orden recomendado de lectura

1. [01-resumen-ejecutivo.md](./01-resumen-ejecutivo.md)
2. [02-contratos-api.md](./02-contratos-api.md)
3. [03-flujos-y-sesion.md](./03-flujos-y-sesion.md)
4. [04-ajustes-de-pantallas.md](./04-ajustes-de-pantallas.md)
5. [05-snippets-de-integracion.md](./05-snippets-de-integracion.md)
6. [06-checklist-qa-y-release.md](./06-checklist-qa-y-release.md)
7. [07-autenticacion-beneficiario-local.md](./07-autenticacion-beneficiario-local.md)

## Fuente de verdad

La fuente de verdad de frontend en este repositorio es:

- este paquete `docs/Front-beneficiarios`
- el codigo actual en `src/`
- `README.md` y `.env.example` del repo para setup y pruebas

`07-autenticacion-beneficiario-local.md` se conserva como resumen operativo corto y complemento del paquete.

## Matriz rapida para QA

| Ruta UI | Endpoint principal | Auth | Resultado esperado |
| --- | --- | --- | --- |
| `/login` | `POST /api/v1/auth/login` | No | inicia sesion y carga perfil |
| `/forgot-password` | `POST /api/v1/auth/forgot-password` | No | muestra mensaje neutro |
| `/reset-password?token=...` | `POST /api/v1/auth/reset-password` | No | actualiza contrasena y regresa a login |
| `/activar` paso 1 | `POST /api/v1/cardholders/verify-activation` | No | valida tarjeta y habilita alta |
| `/activar` paso 2 | `POST /api/v1/cardholders/complete-activation` | No | crea cuenta, abre sesion y entra |
| `/perfil` | `GET /api/v1/me` | Si | muestra credencial digital |
| `/catalog` | `GET /api/v1/catalog` | Si | lista beneficios autenticados |
| `/map` | `GET /api/v1/catalog` | Si | mapa y listado autenticados |
| `/settings` | n/a | Si | accesible solo con sesion |
| `/help` | n/a | Si | accesible solo con sesion |

## Decision clave

El frontend ciudadano ya no debe depender de Auth0.

El contrato vigente es:

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
