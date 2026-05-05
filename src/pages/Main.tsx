import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './Main.css';

const highlights = [
  {
    title: 'Descuentos sin limites',
    description: 'Promos en las cuatro regiones del estado y eventos aliados.',
  },
  {
    title: 'App segura',
    description: 'Mira y filtra nuestros mas de 200 convenios.',
  },
];

const Main = () => {
  return (
    <main className="main" aria-labelledby="main-title">
      <Hero />
      <section className="main__section" aria-labelledby="main-title">
        <div className="main__header">
          <h2 id="main-title">Por que activar tu Tarjeta Joven</h2>
          <p>Es tu identidad digital segura para acceder a servicios, descuentos y futuras integraciones.</p>
        </div>
        <div className="main__grid">
          {highlights.map((item) => (
            <article key={item.title} className="main__card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}

          <article className="main__card">
            <h3>Credencial lista para usar</h3>
            <p>
              Si ya cuentas con tu tarjeta fisica, activa tu cuenta. Si aun no la tienes, mira{' '}
              <Link to="/puntos-de-tramite" className="main__inline-link">
                aqui
              </Link>{' '}
              nuestros puntos de tramite.
            </p>
          </article>
        </div>
        <div className="main__section-footer">
          <Link to="/help" className="main__link">
            Conoce mas
          </Link>
        </div>
      </section>
      <section className="main__cta" aria-labelledby="cta-title">
        <div>
          <h2 id="cta-title">Comienza hoy</h2>
          <p>Valida tu tarjeta con CURP y crea tu acceso paso a paso desde la app.</p>
        </div>
        <Link to="/activar" className="main__cta-button">
          Activar ahora
        </Link>
      </section>
    </main>
  );
};

export default Main;
