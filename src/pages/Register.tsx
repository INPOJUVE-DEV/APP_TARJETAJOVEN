import { Link } from 'react-router-dom';
import './Login.css';
import './Activation.css';

const Register = () => {
  return (
    <main className="login" aria-labelledby="register-info-title">
      <section className="login__card">
        <p className="activation__step">Registro actualizado</p>
        <h1 id="register-info-title">El alta oficial ya no se realiza desde esta app</h1>
        <p className="login__hint">
          Si ya cuentas con una Tarjeta Joven fisica, usa la activacion con numero de tarjeta y CURP.
          Si tu cuenta ya fue vinculada antes, inicia sesion con tu correo y contrasena.
        </p>
        <div className="login__form">
          <Link to="/activar" className="login__submit">
            Activar con tarjeta
          </Link>
          <Link to="/login" className="login__secondary">
            Iniciar sesion
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Register;
