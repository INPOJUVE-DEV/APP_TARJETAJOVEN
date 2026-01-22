# API - Vinculacion de tarjeta fisica

Este documento describe los endpoints necesarios para habilitar el flujo **"Ya tengo tarjeta fisica"** en el frontend. La funcionalidad permite que una persona con tarjeta emitida, pero sin credenciales digitales, valide su CURP y cree un usuario/contrasena para ingresar a la plataforma.

## 1. `POST /api/v1/cardholders/lookup`

Valida que la CURP pertenezca a una tarjeta activa y devuelve los datos minimos para mostrar en la UI.

- **Auth**: No requiere token (flujo previo al login).
- **Body**:

```json
{
  "curp": "ABCD001122HDFRRN07"
}
```

- **Response 200**:

```json
{
  "curp": "ABCD001122HDFRRN07",
  "nombres": "Nombre ejemplo",
  "apellidos": "Apellidos ejemplo",
  "municipio": "Toluca",
  "hasAccount": false
}
```

- **Errores esperados**:
  - `404` cuando la CURP no existe o la tarjeta no esta activa. El frontend redirige al formulario de registro completo.
  - `409` si la CURP ya tiene credenciales generadas (`hasAccount: true` se recomienda en el cuerpo cuando aplique).
  - `422` si el formato del CURP es invalido.
  - Respuestas deben incluir `{"message":"texto descriptivo"}` para mostrarse en la UI.

## 2. `POST /api/v1/cardholders/{curp}/account`

Crea el usuario y la contrasena asociados a la tarjeta previamente verificada.

- **Auth**: No requiere token (flujo previo al login).
- **Body**:

```json
{
  "username": "persona@example.com",
  "password": "Contrasena_segura1"
}
```

- `username` debe ser un correo electronico valido y se normaliza en minusculas antes de almacenarse.
- `password` debe tener minimo 8 caracteres e incluir al menos una mayuscula, una minuscula y un numero.
- **Response 201**:

```json
{
  "message": "Cuenta creada. Ya puedes iniciar sesion."
}
```

- **Errores esperados**:
  - `400/422` si la contrasena no cumple las reglas (min. 8 caracteres, coincidencia con confirmacion).
  - `404` si el CURP no pasa la validacion previa (ej. se intento saltar el flujo).
  - `409` si ya existe un usuario asociado a esa CURP.

## 3. Reglas de negocio recomendadas

- Limitar intentos fallidos de validacion (rate-limit) para evitar abuso.
- Expirar la ventana de creacion de cuenta (por ejemplo 15 minutos despues del lookup exitoso) para impedir uso de datos stale.
- Registrar auditoria de quien genero las credenciales (CURP, IP, timestamp).
- Permitir reenvio de credenciales solo mediante flujo de recuperacion (no desde este endpoint).

## 4. Ajustes solicitados para el registro web (`POST /api/v1/cardholders`)

El formulario `/registro` ahora captura domicilio completo (calle, numero exterior y codigo postal) ademas de los documentos requeridos (INE, comprobante de domicilio y CURP digital) y la contrasena inicial. Para soportarlo necesitamos que el backend acepte y valide estos campos en el endpoint que crea la solicitud de tarjeta.

- **Body**: `multipart/form-data`. Las llaves de los archivos deben nombrarse `ine`, `comprobante` y `curpDoc`. Cada archivo debe aceptar JPG/PNG/PDF de maximo 2 MB.
- **Campos obligatorios** (todos `string` salvo los archivos):
  - `nombres`, `apellidos`, `fechaNacimiento` (formato `DD/MM/AAAA`), `curp`.
  - `calle` (minimo 2 caracteres sin dejarlo vacio).
  - `numero` (acepta `S/N` o bien de 1 a 5 digitos con sufijo alfanumerico opcional de hasta 4 caracteres).
  - `cp` (exactamente 5 digitos).
  - `colonia`.
  - `username` (correo electronico valido, se normaliza con `trim()` y en minusculas; debe ser unico y se utiliza en el login).
  - `password` (minimo 8 caracteres, debe incluir al menos una mayuscula, una minuscula y un numero; mismos requisitos que en `/cardholders/{curp}/account`).
  - `aceptaTerminos` (`true`/`false`).
- **Respuesta esperada**: `201` con `{"message":"Solicitud recibida","folio":"TJ-000123"}` para mostrar un folio al usuario (folio opcional pero deseable para seguimiento).
- **Errores**:
  - `400/422` cuando algun campo no pase las validaciones anteriores (incluir `message` descriptivo).
  - `409` si ya existe una solicitud activa o tarjeta para esa CURP, o si el `username` solicitado ya esta en uso.
  - `500` solo ante fallas inesperadas (el frontend mostrara un mensaje generico).

> Nota: El frontend ya esta enviando estos campos y espera una respuesta JSON con `message`. Mientras se aplican los ajustes la UI mostrara un error generico.
