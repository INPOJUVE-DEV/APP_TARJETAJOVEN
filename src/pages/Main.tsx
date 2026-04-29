import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './Main.css';

const highlights = [
  {
    title: 'Descuentos al instante',
    description: 'Promos en cafes, bienestar y eventos aliados.',
  },
  {
    title: 'Programa mas seguro',
    description: 'Tu acceso se crea con correo y contrasena y se vincula directo con la API.',
  },
  {
    title: 'Credencial lista para usar',
    description: 'Activa tu tarjeta una vez y entra a tu perfil digital cuando lo necesites.',
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
