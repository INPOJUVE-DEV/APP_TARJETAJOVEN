import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import { isValidEmail } from '../lib/validators';
import './Login.css';

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};

const Login = () => {
  const { loginWithCredentials, refreshProfile, status, errorMessage, clearErrorMessage, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<LoginErrors>({});

  useEffect(() => {
    if (status === 'authenticated') {
      navigate('/perfil', { replace: true });
    }
  }, [navigate, status]);

  useEffect(() => {
    if (status === 'unlinked') {
      navigate('/migrar-cuenta', {
        replace: true,
        state: { from: location.pathname },
      });
    }
  }, [location.pathname, navigate, status]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: LoginErrors = {};
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      nextErrors.email = 'Ingresa tu correo.';
    } else if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = 'Escribe un correo valido.';
    }

    if (!password) {
      nextErrors.password = 'Ingresa tu contrasena.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    clearErrorMessage();
    setFormErrors({});
    setIsSubmitting(true);

    try {
      await loginWithCredentials(normalizedEmail, password);
      const profile = await refreshProfile();
      if (profile) {
        navigate('/perfil', { replace: true });
      }
    } catch (error) {
      setFormErrors({
        general: error instanceof Error ? error.message : 'No pudimos iniciar sesion.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login" aria-labelledby="login-title">
      <section className="login__card" aria-labelledby="login-title">
        <p className="login__eyebrow">Acceso digital</p>
        <h1 id="login-title">Inicia sesion</h1>
        <p className="login__hint">
          Usa el correo y la contrasena con los que creaste tu acceso para entrar a tu perfil.
        </p>

        <form className="login__form" onSubmit={handleLogin} noValidate>
          <div className={`login__field${formErrors.email ? ' is-invalid' : ''}`}>
            <label htmlFor="loginEmail">Correo</label>
            <input
              id="loginEmail"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.toLowerCase());
                setFormErrors((current) => ({ ...current, email: undefined, general: undefined }));
              }}
              placeholder="tu_correo@ejemplo.com"
              autoComplete="email"
              disabled={!isAuthReady || isSubmitting || status === 'loading'}
              required
            />
            {formErrors.email && <p className="login__error">{formErrors.email}</p>}
          </div>

          <div className={`login__field${formErrors.password ? ' is-invalid' : ''}`}>
            <label htmlFor="loginPassword">Contrasena</label>
            <input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setFormErrors((current) => ({ ...current, password: undefined, general: undefined }));
              }}
              placeholder="Tu contrasena"
              autoComplete="current-password"
              disabled={!isAuthReady || isSubmitting || status === 'loading'}
              required
            />
            {formErrors.password && <p className="login__error">{formErrors.password}</p>}
          </div>

          <button type="submit" className="login__submit" disabled={!isAuthReady || isSubmitting || status === 'loading'}>
            {isSubmitting || status === 'loading' ? 'Validando...' : 'Entrar a mi perfil'}
          </button>

          <Link to="/activar" className="login__secondary">
            Activar mi tarjeta
          </Link>
          <Link to="/migrar-cuenta" className="login__secondary">
            Necesito ayuda con mi acceso
          </Link>

          <p className="login__status" role="status" aria-live="polite">
            {formErrors.general || errorMessage}
          </p>
        </form>
      </section>

      <footer className="login__footer">
        <p>Aun no activas tu tarjeta?</p>
        <Link to="/activar">Comenzar activacion</Link>
      </footer>

      <div className="login__brand" aria-hidden="true">
        <img src="/icons/logo.svg" alt="Tarjeta Joven" />
      </div>
    </main>
  );
};

export default Login;
