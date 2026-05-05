# Requerimientos de actualización – APP_TARJETAJOVEN

## 1. Contexto

API_TJ ya fue actualizada para el nuevo modelo de operación:

- El padrón mínimo vive en `cardholders_sync`.
- Los flujos nuevos usan `curp_hash`, no `cardholders.curp`.
- La creación local de cuenta por contraseña queda fuera del flujo nuevo.
- La activación de cuenta se hace con `tarjeta_numero + CURP`.
- El registro/login de usuario final se delega a Auth0.
- API_TJ valida el `auth0_id_token` y vincula el usuario local.
- Los endpoints legacy `/api/v1/cardholders/{curp}/account` y `/api/v1/register` quedan retirados del flujo nuevo.

Este documento define lo que debe modificarse en APP_TARJETAJOVEN para alinearse con API_TJ.

---

## 2. Objetivo del cambio

Actualizar la app para que:

1. deje de crear cuentas con contraseña local en API_TJ;
2. permita activar una cuenta mediante número de tarjeta y CURP;
3. use Auth0 para registro/login con correo y contraseña;
4. vincule la cuenta Auth0 con el tarjetahabiente en API_TJ;
5. consuma `/api/v1/me` sin depender de CURP local;
6. elimine dependencias de flujos legacy como OTP o registro directo.

---

## 3. Flujo nuevo de usuario final

### 3.1 Activación inicial

El usuario abre la app y selecciona activar cuenta.

La app solicita:

- número de tarjeta;
- CURP.

La app llama:

```http
POST /api/v1/cardholders/verify-activation
```

Request:

```json
{
  "tarjeta_numero": "TJ-000123",
  "curp": "CURP_DEL_USUARIO"
}
```

Respuesta esperada:

```json
{
  "can_activate": true,
  "message": "Validación correcta"
}
```

Si la validación falla, la app debe mostrar un mensaje genérico:

```txt
No se pudo validar la tarjeta con los datos proporcionados.
```

No debe indicar si falló CURP, tarjeta o estado del usuario.

---

### 3.2 Registro con Auth0

Si `verify-activation` responde exitosamente:

1. la app inicia flujo de Auth0;
2. el usuario registra correo y contraseña;
3. Auth0 devuelve `id_token`;
4. la app llama a API_TJ para vincular la cuenta.

Endpoint:

```http
POST /api/v1/cardholders/complete-activation
```

Request:

```json
{
  "tarjeta_numero": "TJ-000123",
  "auth0_id_token": "ID_TOKEN_DE_AUTH0"
}
```

Respuesta esperada:

```json
{
  "activated": true,
  "message": "Cuenta vinculada correctamente"
}
```

---

### 3.3 Login posterior

Después de activada la cuenta:

- el login del usuario final debe hacerse con Auth0;
- no debe usarse password local contra API_TJ;
- no debe usarse CURP como password;
- no debe usarse OTP legacy.

---

## 4. Endpoints que la app debe usar

### 4.1 `POST /api/v1/cardholders/verify-activation`

Uso:
- validar que el usuario tiene tarjeta física y que la CURP coincide.

Body:

```json
{
  "tarjeta_numero": "TJ-000123",
  "curp": "CURP_DEL_USUARIO"
}
```

La app debe:

- normalizar CURP antes de enviar;
- validar que la tarjeta no venga vacía;
- no guardar CURP en storage;
- no enviar datos adicionales.

---

### 4.2 `POST /api/v1/cardholders/complete-activation`

Uso:
- finalizar vínculo entre Auth0 y API_TJ.

Body:

```json
{
  "tarjeta_numero": "TJ-000123",
  "auth0_id_token": "ID_TOKEN_DE_AUTH0"
}
```

La app debe:

- obtener `auth0_id_token` desde Auth0;
- enviarlo directamente a API_TJ;
- no modificarlo;
- no enviar `auth0_user_id` manualmente;
- no confiar en datos autogenerados en frontend.

---

### 4.3 `GET /api/v1/me`

Uso:
- obtener perfil del usuario autenticado.

La app debe soportar que el perfil no incluya CURP.

Debe resolver usuario usando:

- token/sesión vigente;
- `auth0_user_id`;
- `cardholder_sync_id`;
- datos mínimos de usuario.

---

## 5. Endpoints que la app debe dejar de usar

### 5.1 Retirar creación local de cuenta

No usar:

```http
POST /api/v1/cardholders/{curp}/account
```

Ese endpoint queda fuera del flujo nuevo.

---

### 5.2 Retirar registro legacy

No usar:

```http
POST /api/v1/register
```

El registro de beneficiarios nuevos ya no se hace desde la app.

---

### 5.3 Retirar OTP legacy

No usar:

```http
POST /api/v1/auth/otp/send
POST /api/v1/auth/otp/verify
```

---

## 6. Pantallas requeridas

### 6.1 Pantalla de activación de cuenta

Campos:

- número de tarjeta;
- CURP;
- botón “Validar datos”.

Validaciones frontend:

- número de tarjeta obligatorio;
- CURP obligatoria;
- CURP en mayúsculas;
- formato básico de CURP;
- bloquear doble submit.

Estados UI:

- idle;
- loading;
- validación exitosa;
- error de validación;
- error de red.

---

### 6.2 Pantalla/flujo de registro Auth0

Después de validación exitosa:

- iniciar flujo Auth0;
- permitir registro con correo y contraseña;
- al obtener `id_token`, llamar `complete-activation`.

---

### 6.3 Pantalla de cuenta vinculada

Después de `complete-activation` exitoso:

- mostrar confirmación;
- redirigir a home/perfil;
- cargar `/me`.

---

### 6.4 Pantalla de error para cuenta ya vinculada

Si API responde cuenta ya vinculada:

- informar que la tarjeta ya tiene cuenta asociada;
- sugerir iniciar sesión;
- no permitir reactivación.

---

## 7. Reglas de seguridad en frontend

### 7.1 CURP

La app no debe guardar CURP en:

- localStorage;
- sessionStorage;
- IndexedDB;
- logs;
- analytics;
- crash reports.

La CURP solo puede existir temporalmente en memoria durante la validación.

---

### 7.2 Token Auth0

La app debe manejar tokens siguiendo la configuración recomendada por Auth0 para SPA/PWA.

No debe:

- enviar `auth0_user_id` inventado;
- construir tokens manualmente;
- guardar tokens en lugares inseguros.

---

### 7.3 Número de tarjeta

El número de tarjeta puede usarse para activación, pero no debe mostrarse como dato sensible innecesario después de vincular la cuenta.

---

## 8. Manejo de errores

La app debe manejar como mínimo:

| Código | Caso |
|---|---|
| 200 | validación o vinculación exitosa |
| 401 | sesión/token inválido |
| 403 | acceso no autorizado |
| 409 | cuenta ya vinculada o duplicado |
| 410 | endpoint legacy retirado |
| 422 | datos inválidos |
| 500 | error interno |

Mensajes recomendados:

- `422`: “Los datos ingresados no son válidos.”
- `409`: “Esta tarjeta ya tiene una cuenta asociada.”
- `401`: “Tu sesión expiró. Inicia sesión nuevamente.”
- `500`: “No pudimos procesar la solicitud. Intenta más tarde.”

---

## 9. Variables de entorno frontend

Agregar o validar:

```env
VITE_API_BASE_URL=https://API_TJ_URL/api/v1
VITE_AUTH0_DOMAIN=...
VITE_AUTH0_CLIENT_ID=...
VITE_AUTH0_AUDIENCE=...
VITE_AUTH0_REDIRECT_URI=...
VITE_AUTH0_LOGOUT_REDIRECT_URI=...
```

---

## 10. Requerimientos técnicos

### 10.1 Cliente API

Actualizar cliente HTTP para:

- usar `VITE_API_BASE_URL`;
- manejar errores 409, 410 y 422;
- no reintentar automáticamente `complete-activation` si ya fue exitoso;
- no enviar CURP en logs.

---

### 10.2 Estado de activación

Mantener estado temporal:

```ts
type ActivationState = {
  tarjetaNumero: string;
  verified: boolean;
};
```

No guardar CURP en estado persistente.

---

### 10.3 Integración Auth0

Implementar proveedor Auth0 en la app.

Debe soportar:

- login;
- logout;
- callback;
- obtención de `id_token`;
- manejo de sesión;
- redirección post-login.

---

### 10.4 Compatibilidad con usuarios existentes

Definir comportamiento para usuarios legacy:

- si ya tienen cuenta local, deben poder seguir entrando temporalmente si API_TJ lo permite;
- si se fuerza migración, mostrar pantalla de migración a Auth0;
- no mezclar password local con Auth0 en el mismo flujo nuevo.

---

## 11. Pruebas requeridas

### 11.1 Activación

- tarjeta + CURP válidos;
- tarjeta inválida;
- CURP inválida;
- tarjeta inactiva/bloqueada;
- cuenta ya vinculada;
- doble submit.

---

### 11.2 Auth0

- registro exitoso;
- cancelación del registro;
- callback exitoso;
- token inválido;
- token expirado;
- logout.

---

### 11.3 Complete activation

- `auth0_id_token` válido;
- `auth0_id_token` inválido;
- tarjeta ya vinculada;
- verificación previa ausente o expirada.

---

### 11.4 Perfil

- `/me` con usuario Auth0 vinculado;
- `/me` sin CURP;
- sesión expirada;
- usuario sin vínculo.

---

### 11.5 Seguridad

- CURP no queda en localStorage;
- CURP no queda en sessionStorage;
- CURP no aparece en logs;
- no se llama endpoint legacy;
- no se usa `auth0_user_id` generado en frontend.

---

## 12. Criterios de aceptación

1. La app permite activar cuenta con `tarjeta_numero + CURP`.
2. La app registra/login de usuario final mediante Auth0.
3. La app llama `complete-activation` con `auth0_id_token`.
4. La app ya no usa `/cardholders/{curp}/account`.
5. La app ya no usa `/register`.
6. La app ya no usa OTP legacy.
7. La app carga `/me` sin depender de CURP.
8. La app no guarda CURP en storage.
9. La app maneja cuenta ya vinculada.
10. La app maneja endpoints legacy con `410 Gone`.

---

## 13. Fuera de alcance

No corresponde a APP_TARJETAJOVEN:

- sincronizar padrón desde Sys_IPJ;
- registrar beneficiarios oficiales;
- procesar staging de Unidad de Informática;
- generar `curp_hash`;
- firmar JWT sistema-a-sistema;
- administrar llaves públicas;
- enviar expedientes a Sys_IPJ.

---

## 14. Prioridad sugerida

1. Retirar consumo de endpoints legacy.
2. Agregar pantalla de activación.
3. Integrar Auth0.
4. Conectar `complete-activation`.
5. Ajustar `/me`.
6. Pruebas de seguridad.
7. QA completo del flujo de activación.
> Legacy: este documento describe un flujo con Auth0 que ya no aplica al frontend ciudadano actual.
> La fuente de verdad vigente es `docs/Front-beneficiarios/`.
