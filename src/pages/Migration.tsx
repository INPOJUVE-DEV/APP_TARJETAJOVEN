import { Link } from 'react-router-dom';
import './Login.css';
import './Activation.css';

const Migration = () => {
  return (
    <main className="login" aria-labelledby="migration-title">
      <section className="login__card">
        <p className="activation__step">Migracion de acceso</p>
        <h1 id="migration-title">Tu acceso ya es digital</h1>
        <p className="login__hint">
          Si tu cuenta aun no esta vinculada, activa tu tarjeta para crear tu acceso con correo y
          contraseña. Si ya lo hiciste, intenta iniciar sesión de nuevo.
        </p>
        <div className="login__form">
          <Link to="/activar" className="login__submit">
            Activar mi cuenta
          </Link>
          <Link to="/login" className="login__secondary">
            Intentar iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Migration;
