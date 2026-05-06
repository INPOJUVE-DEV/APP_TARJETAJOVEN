import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppBrand from '../components/AppBrand';
import MobileNav from '../components/MobileNav';
import { publicNavigationItems } from '../components/AppNavigation';
import { useAuth } from '../lib/useAuth';
import { isValidEmail } from '../lib/validators';
import './Login.css';

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};

const Login = () => {
  const { login, status, errorMessage, clearErrorMessage, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<LoginErrors>({});

  const redirectTo = useMemo(() => {
    if (typeof location.state === 'object' && location.state && 'from' in location.state) {
      return String(location.state.from);
    }

    return '/perfil';
  }, [location.state]);

  useEffect(() => {
    if (status === 'authenticated') {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo, status]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors: LoginErrors = {};

    if (!normalizedEmail) {
      nextErrors.email = 'Ingresa tu correo.';
    } else if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = 'Escribe un correo válido.';
    }

    if (!password) {
      nextErrors.password = 'Ingresa tu contraseña.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    clearErrorMessage();
    setFormErrors({});
    setIsSubmitting(true);

    try {
      await login(normalizedEmail, password);
    } catch {
      setFormErrors((current) => ({
        ...current,
        general: 'No pudimos iniciar sesión. Revisa tus datos e intenta de nuevo.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMessage =
    (typeof location.state === 'object' &&
      location.state &&
      'successMessage' in location.state &&
      typeof location.state.successMessage === 'string'
      ? location.state.successMessage
      : null) ||
    formErrors.general ||
    errorMessage;

  return (
    <>
      <main className="login" aria-labelledby="login-title">
        <AppBrand className="login__brand login__brand--top" caption="Acceso digital seguro" />

        <section className="login__card surface-card" aria-labelledby="login-title">
          <p className="login__eyebrow">Acceso digital</p>
          <h1 id="login-title">Inicia sesión</h1>
          <p className="login__hint">
            Entra con el correo que vinculaste a tu Tarjeta Joven y tu contraseña local.
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
              <label htmlFor="loginPassword">Contraseña</label>
              <input
                id="loginPassword"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setFormErrors((current) => ({ ...current, password: undefined, general: undefined }));
                }}
                placeholder="Tu contraseña"
                autoComplete="current-password"
                disabled={!isAuthReady || isSubmitting || status === 'loading'}
                required
              />
              {formErrors.password && <p className="login__error">{formErrors.password}</p>}
            </div>

            <Link to="/forgot-password" className="login__inline-link">
              Olvidé mi contraseña
            </Link>

            <button
              type="submit"
              className="primary-button login__submit"
              disabled={!isAuthReady || isSubmitting || status === 'loading'}
            >
              {isSubmitting || status === 'loading' ? 'Ingresando...' : 'Entrar'}
            </button>

            <p className="login__status" role="status" aria-live="polite">
              {statusMessage}
            </p>
          </form>
        </section>

        <footer className="login__footer">
          <p>¿Aún no activas tu tarjeta?</p>
          <Link to="/activar">Comenzar activación</Link>
        </footer>
      </main>

      <MobileNav items={publicNavigationItems} />
    </>
  );
};

export default Login;
