# Checklist Frontend – Registro / Activación Tarjeta Joven

## 1. Flujo obligatorio

- [ ] Separar el registro en pasos:
  - [ ] Paso 1: validar tarjeta + CURP.
  - [ ] Paso 2: mostrar resultado de validación.
  - [ ] Paso 3: crear acceso con correo y contraseña.
  - [ ] Paso 4: vincular cuenta con API_TJ.
  - [ ] Paso 5: redirigir a perfil/home.

- [ ] No disparar Auth0 automáticamente después de validar.
- [ ] Mostrar botón explícito: **Crear mi acceso**.

---

## 2. Endpoints API_TJ

### Validación

POST /api/v1/cardholders/verify-activation

{
  "tarjeta_numero": "TJ-000123",
  "curp": "CURP_DEL_USUARIO"
}

### Activación

POST /api/v1/cardholders/complete-activation

{
  "tarjeta_numero": "TJ-000123",
  "auth0_id_token": "TOKEN_AUTH0"
}

---

## 3. Estados de UI requeridos

- idle
- validating
- validated
- creating_access
- linking_account
- success
- already_linked
- blocked
- invalid
- error

---

## 4. Mensajes UX

- Tarjeta validada correctamente.
  Ahora crea tu acceso con correo y contraseña.

- Esta tarjeta ya tiene una cuenta asociada.
  Inicia sesión para continuar.

- Los datos no coinciden. Verifica tu número de tarjeta y CURP.

- Esta tarjeta no está activa. Acude a soporte.

---

## 5. Validaciones frontend

- Número de tarjeta obligatorio.
- CURP obligatoria.
- CURP en mayúsculas.
- CURP máximo 18 caracteres.
- Validación de formato CURP.
- Bloquear doble submit.
- Limpiar CURP después de validar.

---

## 6. Seguridad

- No guardar CURP en localStorage.
- No guardar CURP en sessionStorage.
- No guardar CURP en IndexedDB.
- No enviar CURP a logs.
- No enviar CURP a analytics.
- No mostrar CURP después de validar.

---

## 7. Auth0

- Integrar flujo de registro/login.
- Obtener id_token.
- Enviar id_token a complete-activation.
- No generar auth0_user_id en frontend.
- No modificar tokens.
- Manejar cancelación de login.
- Manejar token expirado o inválido.

---

## 8. Lógica del componente

- Separar funciones:
  - handleValidateCardholder
  - handleStartSignup
  - handleCompleteActivation
  - handleResetActivation

- No ejecutar signup en el mismo submit de validación.
- Agregar pantalla intermedia tras validación.
- Mostrar resumen de tarjeta validada.
- Permitir reiniciar activación.

---

## 9. UI / UX

- Agregar stepper:
  1. Validar datos
  2. Crear acceso
  3. Vincular cuenta

- Mostrar loaders por paso.
- Mostrar errores junto a inputs.
- Usar mensajes simples (no técnicos).
- No mostrar “Auth0” al usuario.

---

## 10. Rutas

- /activation o /activar
- /login
- /perfil (post-activación)
- Manejo de callback Auth0

---

## 11. Manejo de errores HTTP

- 403 → datos incorrectos / no permitido
- 409 → tarjeta ya vinculada
- 422 → validación fallida
- 401 → token inválido
- 500 → error interno

---

## 12. Criterios de aceptación

- Usuario valida tarjeta + CURP.
- Usuario ve confirmación antes de crear acceso.
- Usuario crea cuenta con correo/contraseña.
- Cuenta se vincula correctamente.
- Redirección a perfil funciona.
- No se guarda CURP en cliente.
- No se usan endpoints legacy.
- UX clara y no técnica.
- Manejo correcto de errores.
- Flujo puede reiniciarse sin errores.
