import { Link } from 'react-router-dom';
import AppBrand from './AppBrand';
import './Hero.css';

const heroSignals = ['Acceso seguro', 'Cobertura estatal', 'Beneficios vigentes'];

const Hero = () => {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__content">
        <AppBrand className="hero__brand" caption="Programa institucional" />
        <p className="hero__eyebrow">Tarjeta Joven</p>
        <h1 id="hero-title" className="hero__title">
          Beneficios y acceso digital para las juventudes de San Luis Potosí
        </h1>
        <p className="hero__subtitle">
          Si ya cuentas con tu Tarjeta Joven, activa tu acceso y consulta descuentos,
          comercios aliados y novedades del programa desde una sola app.
        </p>

        <div className="hero__actions" role="group" aria-label="Acciones principales">
          <Link className="primary-button hero__cta" to="/activar">
            Activar tarjeta
          </Link>
          <Link className="secondary-button hero__cta" to="/login">
            Iniciar sesión
          </Link>
        </div>

        <ul className="hero__signals" aria-label="Atributos del programa">
          {heroSignals.map((signal) => (
            <li key={signal}>{signal}</li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Hero;
