# frontend_tj

Frontend del proyecto Tarjeta Joven construido con React, TypeScript y Vite. La aplicacion consume el backend oficial y expone las funcionalidades principales del programa para las personas usuarias.

## Requisitos previos
- Node.js 22.x.
- npm 10 o superior (incluido con Node 22).

## Instalacion
```bash
npm install
```

## Configuracion de entorno
1. Copia el archivo `.env.example` a `.env` si aun no existe.
2. Ajusta las variables segun el entorno objetivo:
   - `VITE_API_URL`: URL base del backend. En desarrollo local usa `http://localhost:8080/api/v1`. Tambien puedes definir `/api/v1` para aprovechar el proxy que expone Vite y evitar configuraciones de CORS.
   - `VITE_MAPS_URL`: URL publica de Google MyMaps que se muestra en la vista de mapa.
   - `VITE_ANALYTICS_URL`: endpoint HTTP al que se envian los eventos de analitica. Dejalo vacio para deshabilitar el envio (se mantendra el log en localStorage).
   - `VITE_SENTRY_DSN`: DSN publico del proyecto en Sentry para capturar errores en frontend.
   - `VITE_SENTRY_RELEASE`: identificador de release que veras en Sentry. Si no se define se tomara `VITE_APP_VERSION` o `VITE_COMMIT_SHA` (con el prefijo `frontend_tj@`) y, en ultima instancia, el `mode` de Vite.
   - `VITE_APP_VERSION` / `VITE_COMMIT_SHA`: valores opcionales que se propagan a Sentry y ayudan a identificar la version desplegada.

El archivo `src/config/env.ts` centraliza la lectura de estas variables, define valores por defecto seguros para desarrollo y facilita su consulta desde cualquier modulo.

Las peticiones se envian con `credentials: include` y cabeceras `Authorization` cuando hay una sesion activa. Si el backend responde con un `401` la sesion local se limpia de forma automatica.

## Autenticacion
- `useAuth` administra los tokens (`accessToken`, `refreshToken`), persiste el estado en `localStorage` y expone `login`, `logout`, `authenticateWithTokens` y `refreshProfile`. La funcion `login` delega en `authApi.login` (`src/lib/api/auth.ts`), que envia `{ username, password }` a `POST /api/v1/auth/login`, normalizando el usuario con `trim()` antes de solicitar el perfil en `GET /api/v1/me`. Ante respuestas `401` limpia los tokens persistidos y borra la sesion local.
- El formulario de `src/pages/Login.tsx` captura nombre de usuario y contrasena, valida que el usuario tenga al menos tres caracteres y que la contrasena tenga al menos 8 caracteres, y muestra estados de carga o errores segun la respuesta del backend.
- `useOTP` continua disponible para flujos que requieran envio y verificacion de codigos OTP mediante los endpoints `POST /api/v1/auth/otp/send` y `POST /api/v1/auth/otp/verify`.

## Flujo "Ya tengo tarjeta fisica"
- Desde la pantalla de login se expone el boton **Ya tengo tarjeta fisica**, que lleva a `src/pages/CardholderLookup.tsx`. Esa vista (ruta `/registro/tarjeta-fisica`) valida el CURP contra `POST /api/v1/cardholders/lookup`.
- Si la CURP existe, se navega al paso 2 (`/registro/tarjeta-fisica/crear-usuario`, componente `CardholderAccountSetup`) para capturar usuario y contrasena y llamar a `POST /api/v1/cardholders/{curp}/account`.
- Cuando la CURP no existe se redirige automaticamente al formulario de registro (`/registro`) mostrando una snackbar informativa.
- Los requisitos del backend para estos endpoints estan descritos en `docs/api-cardholders.md`.

## Desarrollo y verificacion
- `npm run dev`: levanta el servidor de desarrollo en `http://localhost:3000` con proxy hacia `http://localhost:8080` para rutas que comienzan con `/api`.
- `npm run build`: compila el proyecto para produccion (ejecuta `tsc` y `vite build`). Este comando se ejecuto tras los ultimos cambios.
- `npm run preview`: sirve la build generada para validacion local.

Durante el desarrollo valida el flujo de catalogo y autenticacion apuntando el backend a `http://localhost:8080`. Comprueba que puedas iniciar sesion con un usuario valido y que al cerrar sesion se limpie el estado almacenado.

## Despliegue en Vercel
### Deploy automatizado mediante GitHub
1. Sube el proyecto a GitHub (por ejemplo a la rama `main`) y verifica que la configuracion en `vercel.json` y `package.json` este versionada.
2. En Vercel selecciona **Add New > Project** y elige **Import Git Repository**. Autoriza el acceso al repositorio si es la primera vez.
3. Cuando el asistente detecte el framework deja el preset `Vite`. Valida que el comando de build sea `npm run build` y el directorio de salida `dist` (se toman de `package.json` y `vercel.json` respectivamente).
4. En la seccion **Environment Variables** agrega los valores documentados en el apartado anterior (`VITE_API_URL`, `VITE_MAPS_URL`, `VITE_ANALYTICS_URL`, `VITE_SENTRY_DSN`, `VITE_SENTRY_RELEASE`, `VITE_APP_VERSION`, `VITE_COMMIT_SHA`). Puedes reutilizar un Environment Group para compartirlas entre `Production`, `Preview` y `Development`.
5. Define la rama de produccion (por ejemplo `main`) y habilita deploys previos automaticos para las demas ramas que necesites revisar.
6. Haz clic en **Deploy**. Vercel instalara dependencias, ejecutara `npm run build` y publicara la primera version productiva.
7. A partir de este punto cada `git push` generara un deploy de Preview y los cambios que lleguen a la rama de produccion ejecutaran un deploy productivo sin intervencion manual.

El archivo `vercel.json` ya incluye la configuracion de SPA (`index.html` como fallback) y secciona los rewrites para la API. Ajusta las reglas si deseas apuntar `/api` hacia otro dominio o si necesitas cabeceras adicionales.

### Deploy manual con CLI
1. Instala el CLI (`npm i -g vercel`) y autenticate con `vercel login`.
2. Configura las variables de entorno con `vercel env pull`/`vercel env add` o desde el panel web.
3. Ejecuta `vercel` para generar una Preview y `vercel --prod` cuando desees promover la build a produccion.

## Estructura principal
- `src/`: codigo fuente de la aplicacion.
- `public/`: archivos estaticos servidos sin procesamiento por Vite.
- `dist/`: salida generada despues de `npm run build` (no se versiona).

## Contribucion
Antes de abrir un Pull Request asegurate de:
- Probar los comandos principales (`npm run dev` y `npm run build`).
- Documentar cualquier nueva variable de entorno requerida.
- Anadir pruebas o pasos de verificacion manual cuando apliquen.

## Analisis de Endpoints para Backend

Esta seccion documenta los endpoints que el frontend consume, con el objetivo de guiar el desarrollo del backend.

### Consideraciones Generales

- **CORS (Cross-Origin Resource Sharing)**: El cliente esta configurado para ejecutarse en un dominio diferente al del backend (`http://localhost:3000` vs. `http://localhost:8080` en desarrollo). El backend **debe** habilitar CORS para el dominio del frontend. Especificamente, necesita:
  - Permitir los metodos `GET`, `POST`.
  - Permitir las cabeceras `Authorization` y `Content-Type`.
  - Habilitar el envio de credenciales (`credentials: true`), ya que el frontend envia las cookies de sesion.
- **Formato de Datos**: La comunicacion se realiza principalmente con formato **JSON**. El cliente envia `Content-Type: application/json` y espera recibir `Content-Type: application/json`. La unica excepcion es el endpoint de registro, que deberia aceptar `multipart/form-data`.
- **Autenticacion**: Las rutas protegidas deben esperar un token JWT en la cabecera `Authorization` con el formato `Bearer {token}`.
- **Respuestas de Error**: El frontend espera codigos de estado HTTP estandar. Una respuesta `401 Unauthorized` en cualquier endpoint protegido provocara que la sesion del usuario se limpie localmente. Los errores de validacion (`400 Bad Request`) deberian devolver un cuerpo JSON con una propiedad `message` que describa el error.

### Endpoints Identificados

A continuacion se detallan los endpoints extraidos del codigo fuente:

#### Modulo de Autenticacion (`/auth`)

1.  **`POST /auth/login`**
    *   **Descripcion**: Autentica a un usuario y devuelve tokens de acceso.
    *   **Request Body** (`application/json`):
        ```json
        {
          "username": "string",
          "password": "string"
        }
        ```
    *   **Response Body** (`application/json`):
        ```json
        {
          "accessToken": "string",
          "refreshToken": "string"
        }
        ```

2.  **`POST /auth/logout`**
    *   **Descripcion**: Invalida la sesion del usuario en el backend.
    *   **Autenticacion**: Requiere cabecera `Authorization: Bearer {token}`.
    *   **Request Body**: Vacio.
    *   **Response Body**: Vacio, con estado `200` o `204`.

3.  **`POST /auth/otp/send`**
    *   **Descripcion**: Envia un codigo de un solo uso (OTP) al usuario para recuperacion de cuenta o verificacion.
    *   **Request Body** (`application/json`):
        ```json
        {
          "curp": "string"
        }
        ```
    *   **Response Body**: Vacio, con estado `200`.

4.  **`POST /auth/otp/verify`**
    *   **Descripcion**: Verifica un codigo OTP y, si es valido, devuelve tokens de autenticacion.
    *   **Request Body** (`application/json`):
        ```json
        {
          "curp": "string",
          "otp": "string"
        }
        ```
    *   **Response Body** (`application/json`):
        ```json
        {
          "accessToken": "string",
          "refreshToken": "string"
        }
        ```

#### Modulo de Usuario (`/me`)

1.  **`GET /me`**
    *   **Descripcion**: Obtiene la informacion del perfil del usuario autenticado.
    *   **Autenticacion**: Requiere cabecera `Authorization: Bearer {token}`.
    *   **Response Body** (`application/json`):
        ```json
        {
          "id": "string",
          "nombre": "string",
          "apellidos": "string",
          "curp": "string",
          "email": "string | null",
          "municipio": "string | null",
          "telefono": "string | null"
        }
        ```

#### Modulo de Catalogo (`/catalog`)

1.  **`GET /catalog`**
    *   **Descripcion**: Obtiene la lista de beneficios o comercios.
    *   **Autenticacion**: Opcional. Puede ser publica.
    *   **Query Parameters**:
        *   `q` (string, opcional): Termino de busqueda.
        *   `categoria` (string, opcional): Filtrar por categoria.
        *   `municipio` (string, opcional): Filtrar por municipio.
        *   `page` (number, opcional): Numero de pagina para paginacion.
        *   `pageSize` (number, opcional): Tamano de la pagina.
    *   **Response Body** (`application/json`):
        ```json
        {
          "items": [
            {
              "id": "string",
              "nombre": "string",
              "categoria": "string",
              "municipio": "string",
              "descuento": "string",
              "direccion": "string | null",
              "horario": "string | null",
              "descripcion": "string | null",
              "lat": "number | null",
              "lng": "number | null"
            }
          ],
          "total": "number",
          "page": "number",
          "pageSize": "number",
          "totalPages": "number"
        }
        ```

#### Modulo de Registro (`/register`)

1.  **`POST /register`** (Endpoint asumido)
    *   **Descripcion**: Procesa una nueva solicitud de registro de usuario. El frontend no implementa la llamada, pero prepara los datos.
    *   **Request Body** (`multipart/form-data`):
        *   `nombres`: "string"
        *   `apellidos`: "string"
        *   `fechaNacimiento`: "string" (formato "DD/MM/AAAA")
        *   `curp`: "string"
        *   `colonia`: "string"
        *   `password`: "string"
        *   `ine`: Archivo (PDF, JPG, PNG)
        *   `comprobante`: Archivo (PDF, JPG, PNG)
        *   `curpDoc`: Archivo (PDF, JPG, PNG)
    *   **Response Body**: Se espera una respuesta `201` Created o `202` Accepted con un mensaje informativo.
