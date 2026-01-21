import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Snackbar, { SnackbarMessage } from '../components/Snackbar';
import { cardholderApi, CardholderLookupResponse } from '../lib/api/cardholders';
import { normalizeCurp } from '../lib/curp';
import { isApiError } from '../lib/apiClient';
import { isSecurePassword, isValidEmail } from '../lib/validators';
import './CardholderAccountSetup.css';

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MAX_LENGTH = 128;

type LocationState = {
  lookup?: CardholderLookupResponse;
} | null;

const CardholderAccountSetup = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const lookup = (location.state as LocationState)?.lookup;

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!lookup) {
      navigate('/registro/tarjeta-fisica', { replace: true });
    }
  }, [lookup, navigate]);

  const isUsernameValid = useMemo(() => isValidEmail(username), [username]);
  const isPasswordValid = useMemo(() => isSecurePassword(password, PASSWORD_MIN_LENGTH), [password]);
  const isConfirmValid = useMemo(() => confirmPassword === password && confirmPassword.length > 0, [confirmPassword, password]);
  const canSubmit = isUsernameValid && isPasswordValid && isConfirmValid && !isSubmitting && !isCompleted;

  if (!lookup) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isUsernameValid || !isPasswordValid || !isConfirmValid) {
      setSnackbar({ message: 'Revisa la información capturada antes de continuar.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    setSnackbar(null);

    try {
      await cardholderApi.createAccount({
        curp: normalizeCurp(lookup.curp),
        username: username.trim().toLowerCase(),
        password,
      });
      setIsCompleted(true);
      setSnackbar({
        message: 'Listo. Tu cuenta ya está activa. Inicia sesión con tu nuevo usuario.',
        variant: 'success',
      });
    } catch (error) {
      const message =
        isApiError(error) && error.status === 409
          ? 'Esta tarjeta ya tiene usuario asignado. Recupera tu acceso desde el login.'
          : isApiError(error) && error.message
            ? error.message
            : 'No pudimos crear tu cuenta. Intenta de nuevo.';

      setSnackbar({ message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="cardholder-account" aria-labelledby="cardholder-account-title">
      <section className="cardholder-account__card">
        <p className="cardholder-account__step">Paso 2 de 2</p>
        <h1 id="cardholder-account-title">Crea tu cuenta digital</h1>
        <p className="cardholder-account__description">
          Confirma tus datos y define tu usuario y contraseña para entrar a Tarjeta Joven.
        </p>

        <div className="cardholder-account__summary" aria-live="polite">
          <p>
            <strong>Titular:</strong> {lookup.nombres} {lookup.apellidos}
          </p>
          <p>
            <strong>CURP:</strong> {lookup.curp}
          </p>
          {lookup.municipio && (
            <p>
              <strong>Municipio:</strong> {lookup.municipio}
            </p>
          )}
        </div>

        <form className="cardholder-account__form" onSubmit={handleSubmit} noValidate>
          <div className={`cardholder-account__field ${username && !isUsernameValid ? 'is-invalid' : ''}`}>
            <label htmlFor="username">Correo electrónico</label>
            <input
              id="username"
              type="email"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="correo@dominio.com"
              inputMode="email"
              autoComplete="username"
              maxLength={EMAIL_MAX_LENGTH}
              disabled={isCompleted}
              required
            />
            <p className="cardholder-account__hint">Usa un correo activo; te avisaremos por ahí.</p>
          </div>

          <div className={`cardholder-account__field ${password && !isPasswordValid ? 'is-invalid' : ''}`}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder="********"
              autoComplete="new-password"
              disabled={isCompleted}
              required
            />
            <p className="cardholder-account__hint">
              Mínimo 8 caracteres con mayúsculas, minúsculas y números.
            </p>
          </div>

          <div className={`cardholder-account__field ${confirmPassword && !isConfirmValid ? 'is-invalid' : ''}`}>
            <label htmlFor="confirmPassword">Confirma tu contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="********"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              disabled={isCompleted}
              required
            />
            <p className="cardholder-account__hint">Debe coincidir con la contraseña anterior.</p>
          </div>

          <button type="submit" className="cardholder-account__submit" disabled={!canSubmit}>
            {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="cardholder-account__links">
          <Link to="/registro/tarjeta-fisica">Volver al paso anterior</Link>
          <Link to="/login">Ir al login</Link>
        </div>
      </section>
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onClose={() => setSnackbar(null)}
        />
      )}
    </main>
  );
};

export default CardholderAccountSetup;
