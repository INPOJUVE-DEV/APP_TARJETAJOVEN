# Proyecto: Frontend Tarjeta Joven

Este repositorio contiene el código fuente inicial (frontend) para el programa Tarjeta Joven. Ha sido desarrollado bajo estrictas buenas prácticas y ahora es entregado para que un nuevo equipo o desarrollador asuma su mantenimiento y evolución continua.

---

> **Nota de Seguridad - Cumplimiento y Confidencialidad de Datos**
> Importante: Las bases fundacionales de esta aplicación y, en especial de su integración con la API, se estructuraron de manera alineada a principios contemplados en la norma **ISO 27001**, debido al tratamiento de información personal sensible de la juventud usuaria (identificaciones, domicilios, perfiles).
>
> A medida que la aplicación siga creciendo, es fundamental priorizar el uso de métodos de seguridad eficientes durante toda iteración (encriptación en transporte, JWT seguros, política de validación en los puntos de entrada, sanitización de campos y revocación de autenticación proactiva) para salvaguardar estos datos.

---

Este documento ha sido redactado bajo el framework [Diátaxis](https://diataxis.fr/), abarcando todas las áreas necesarias para tomar control total del desarrollo.

## 🚀 Guía de Inicio y Setup (Tutorial)

Sigue estos pasos para lograr una ejecución local próspera del frontend en tu máquina.

**Prerrequisitos:**
- [Node.js](https://nodejs.org/en) (v22.x recomendado)
- NPM (v10.x+)

**Pasos:**
1. Clona/Mueve este proyecto a tu entorno local.
2. Instala con el manejador de dependencias:
   ```bash
   npm install
   ```
3. Crea tu archivo de entorno clonando el ya existente:
   ```bash
   cp .env.example .env
   ```
4. Define las variables base (en particular `VITE_API_URL` que debe apuntar al backend que tengas levantado localmente, normalmente `http://localhost:8080/api/v1` o `http://localhost:9080/api/v1`).
5. Levanta el proyecto y míralo en acción:
   ```bash
   npm run dev
   ```
Visita `http://localhost:3000` en tu navegador de preferencia.

## 📖 Guías Prácticas (How-To Guides)

### ¿Cómo administrar el Flujo de Login y Credenciales?
- Todo radica en `useAuth()`. La lógica de sesión interactúa con `authApi.login`.
- Al realizarse la autenticación, se almacenan los tokens en un espacio persistente. Si en el futuro cualquier Endpoint regresa código `401 Unauthorized`, el Interceptor capturará el evento y purgará los tokens obligando al usuario a re-autenticar por política de seguridad ISO.

## 🧠 Explicación Técnica e Ingeniería (Explanation)

El concepto fundacional del desarrollo de esta app es construir una Interfaz interactiva para el acceso e inscripción a un programa de incentivos gubernamental/estatal, manejando información personal e institucional.

- **Stack Seleccionado**: React + TypeScript impulsado por Vite. Otorga tipado estricto, necesario para interfaces que administran información sensible y objetos de negocio complejos, evitando vulneraciones por manipulación inapropiada.
- **PWA (Progressive Web App)**: Empleando `vite-plugin-pwa`, la plataforma puede servirse localmente con perfiles `NetworkFirst` para los reportes de API y `CacheFirst` para contenidos inmutables, lo cual otorga agilidad cuando la red intermitente de la calle falle.
- **Seguridad**: Siguiendo pautas alineadas a la **ISO 27001**, en el frontend las sesiones de usuario mantienen control en LocalStorage, requiriendo tokens seguros. No hay _Business Secrets_ expuestos aquí (ni credenciales ni claves privadas); todo debe alimentarse a través del archivo de entorno controlado por el sysadmin durante la inyección en CI/CD.

## 📚 Arquitectura y Referencia Rápida (Reference)

### Mapa Central del Proyecto (`src/`)
- `/components` → Piezas de UI aisladas y reutilizables.
- `/pages` → Componentes controladores atados al esquema de rutas.
- `/lib/api` → Capa de red. Puntos de contacto con tu backend mediante Fetch/Axios y control de Sesión y CORS.
- `/config/env.ts` → Capa unificadora tipo Single Source of Truth para todas las variables ambientales globales.

### Variables de Entorno y Configuraciones
| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL del BackEnd (e.g. `/api/v1` aprovechando la regla proxy en Vite) |
| `VITE_MAPS_URL` | Endpoint provisto para integrar el iFrame de mapa geolocalizado |
| `VITE_ID_VALIDATION_URL` | Endpoint de terceros utilizado para KYC/OCR en identificaciones de registro. |

### Endpoints Cruciales del Backend Implementados
Para que el Frontend que heredas se comunique exitosamente, el backend expone esto con CORS habilitado (los payload se entregan como `application/json`):

*   **Auth**: `POST /auth/login`, `POST /auth/logout`, `POST /auth/otp/send`, `POST /auth/otp/verify`
*   **Usuarios**: `GET /me` (retorna el perfil del JWT suministrado)
*   **Catálogo**: `GET /catalog` (listado público con filtros de geolocalización)
*   **Registro**: `POST /register` (`multipart/form-data` para adjuntar imágenes identificatorias).

---
*Documento estructurado utilizando el standard Diátaxis. Desarrollado originalmente por los creadores de esta versión técnica de API y Frontend (Limpiado y reseteado para traspaso limpio libre de identificadores personales en versión base).*
