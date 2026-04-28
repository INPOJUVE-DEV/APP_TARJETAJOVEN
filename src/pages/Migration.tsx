import { Link } from 'react-router-dom';
import './Login.css';
import './Activation.css';

const Migration = () => {
  return (
    <main className="login" aria-labelledby="migration-title">
      <section className="login__card">
        <p className="activation__step">Migracion de acceso</p>
        <h1 id="migration-title">Tu cuenta ahora usa Auth0</h1>
        <p className="login__hint">
          El acceso con contrasena local ya no esta disponible en el flujo nuevo. Si tu cuenta aun no
          esta vinculada, activa tu tarjeta para crear o migrar tu acceso seguro.
        </p>
        <div className="login__form">
          <Link to="/activar" className="login__submit">
            Activar mi cuenta
          </Link>
          <Link to="/login" className="login__secondary">
            Intentar iniciar sesion
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Migration;
