import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { isSecurePassword, isValidEmail } from '../lib/validators';
import './Login.css';

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MAX_LENGTH = 128;

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const { login, status: authStatus, errorMessage } = useAuth();
  const navigate = useNavigate();

  const isUsernameValid = useMemo(() => isValidEmail(username), [username]);
  const isPasswordValid = useMemo(() => isSecurePassword(password, PASSWORD_MIN_LENGTH), [password]);
  const canSubmit = isUsernameValid && isPasswordValid && authStatus !== 'loading';

  useEffect(() => {
    if (authStatus === 'authenticated') {
      setStatusMessage('Listo, entrando a tu perfil.');
      setFormError('');
      navigate('/perfil', { replace: true });
    }
  }, [authStatus, navigate]);

  useEffect(() => {
    if (errorMessage && authStatus !== 'authenticated') {
      setFormError(errorMessage);
    }
  }, [errorMessage, authStatus]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setStatusMessage('');

    if (!isUsernameValid) {
      setFormError('Escribe un correo electrónico válido.');
      return;
    }

    if (!isPasswordValid) {
      setFormError(
        'Tu contraseña debe tener mínimo 8 caracteres con mayúsculas, minúsculas y números.',
      );
      return;
    }

    try {
      const normalizedUsername = username.trim().toLowerCase();
      await login({
        username: normalizedUsername,
        password,
      });
      setStatusMessage('Ingreso exitoso. Cargando tus datos...');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No pudimos iniciar sesión. Intenta de nuevo.';
      setFormError(message);
    }
  };

  const handlePhysicalCardClick = () => {
    navigate('/registro/tarjeta-fisica');
  };

  return (
    <main className="login" aria-labelledby="login-title">
      <section className="login__card" aria-labelledby="login-form">
        <h1 id="login-title" className="visually-hidden">
          Inicia sesión con tu usuario
        </h1>
        <h2 id="login-form">Inicia sesión</h2>
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className={`login__field ${username && !isUsernameValid ? 'is-invalid' : ''}`}>
            <label htmlFor="username">Correo electrónico</label>
            <input
              id="username"
              type="email"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                setStatusMessage('');
              }}
              inputMode="email"
              placeholder="correo@dominio.com"
              autoComplete="username"
              maxLength={EMAIL_MAX_LENGTH}
              required
            />
            {!isUsernameValid && username && (
              <p className="login__error">Ingresa un correo válido.</p>
            )}
          </div>

          <div className={`login__field ${password && !isPasswordValid ? 'is-invalid' : ''}`}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setStatusMessage('');
              }}
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              placeholder="Escribe tu contraseña"
              autoComplete="current-password"
              required
            />
            {!isPasswordValid && password && (
              <p className="login__error">
                Debe tener mínimo 8 caracteres con mayúsculas, minúsculas y números.
              </p>
            )}
          </div>

          <button type="submit" className="login__submit" disabled={!canSubmit}>
            {authStatus === 'loading' ? 'Verificando...' : 'Iniciar sesión'}
          </button>
          <button type="button" className="login__secondary" onClick={handlePhysicalCardClick}>
            Ya tengo tarjeta física
          </button>
          <p className="login__status" role="status" aria-live="polite">
            {formError || statusMessage}
          </p>
        </form>
      </section>

      <footer className="login__footer">
        <p>¿Aún no tienes cuenta?</p>
        <Link to="/registro">Registrarme ahora</Link>
      </footer>
      <div className="login__brand" aria-hidden="true">
        <img src="/icons/logo.svg" alt="Tarjeta Joven" />
      </div>
    </main>
  );
};

export default Login;

