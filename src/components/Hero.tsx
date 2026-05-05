import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__content">
        <p className="hero__eyebrow">Tarjeta Joven</p>
        <h1 id="hero-title" className="hero__title">
          Beneficios y oportunidades para las juventudes
        </h1>
        <p className="hero__subtitle">
          Activa tu tarjeta, vincula tu acceso seguro y usa tu credencial digital para entrar a
          beneficios y actividades.
        </p>
        <div className="hero__actions" role="group" aria-label="Acciones principales">
          <Link className="hero__cta hero__cta--primary" to="/activar">
            Activar tarjeta
          </Link>
          <Link className="hero__cta hero__cta--outline" to="/login">
            Iniciar sesión
          </Link>
        </div>
      </div>
      <figure className="hero__figure">
        <img
          src="/icons/logo.svg"
          alt="Tarjeta Joven"
          className="hero__image"
        />
      </figure>
    </section>
  );
};

export default Hero;
