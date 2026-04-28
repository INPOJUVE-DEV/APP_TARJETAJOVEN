import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import './Login.css';

const Login = () => {
  const { login, status, errorMessage, clearErrorMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [statusMessage, setStatusMessage] = useState('');

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

  const handleLogin = async () => {
    clearErrorMessage();
    setStatusMessage('');

    try {
      const result = await login();
      if (result.mode === 'redirect') {
        setStatusMessage('Abriendo el acceso seguro de Auth0...');
        return;
      }

      setStatusMessage('Acceso validado. Estamos cargando tu perfil.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'No pudimos iniciar sesion.');
    }
  };

  return (
    <main className="login" aria-labelledby="login-title">
      <section className="login__card" aria-labelledby="login-title">
        <h1 id="login-title">Inicia sesion con Auth0</h1>
        <p className="login__hint">
          Tu acceso ahora se valida con Auth0. Usa esta opcion si tu tarjeta ya esta vinculada a una
          cuenta segura.
        </p>

        <div className="login__form">
          <button type="button" className="login__submit" onClick={handleLogin} disabled={status === 'loading'}>
            {status === 'loading' ? 'Validando...' : 'Continuar con Auth0'}
          </button>
          <Link to="/activar" className="login__secondary">
            Activar mi tarjeta
          </Link>
          <Link to="/migrar-cuenta" className="login__secondary">
            Necesito migrar mi cuenta
          </Link>
          <p className="login__status" role="status" aria-live="polite">
            {errorMessage || statusMessage}
          </p>
        </div>
      </section>

      <footer className="login__footer">
        <p>¿Aun no vinculas tu tarjeta?</p>
        <Link to="/activar">Activarla ahora</Link>
      </footer>

      <div className="login__brand" aria-hidden="true">
        <img src="/icons/logo.svg" alt="Tarjeta Joven" />
      </div>
    </main>
  );
};

export default Login;
