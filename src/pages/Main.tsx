import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import './Main.css';

const highlights = [
  {
    title: 'Descuentos vigentes',
    description: 'Consulta beneficios activos en las cuatro regiones del estado y sus condiciones.',
  },
  {
    title: 'Acceso confiable',
    description: 'Entra con tu cuenta vinculada y revisa tus beneficios sin pasos innecesarios.',
  },
  {
    title: 'Trámite acompañado',
    description: 'Si aún no tienes tarjeta, ubica tus puntos de atención y sigue el proceso oficial.',
  },
];

const Main = () => {
  return (
    <main className="main" aria-labelledby="main-title">
      <Hero />

      <section className="main__section surface-card section-shell" aria-labelledby="main-title">
        <header className="page-header main__header">
          <p className="page-header__eyebrow">Acceso institucional</p>
          <h2 id="main-title" className="page-header__title">
            Activa tu perfil para usar la Tarjeta Joven con claridad y seguridad
          </h2>
          <p className="page-header__summary">
            La app concentra tu ingreso, el catálogo de beneficios y la consulta de sedes
            para que el programa se sienta consistente desde el primer acceso.
          </p>
        </header>

        <div className="main__grid">
          {highlights.map((item) => (
            <article key={item.title} className="main__card surface-card">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}

          <article className="main__card surface-card">
            <h3>Puntos de trámite</h3>
            <p>
              Si ya cuentas con tu tarjeta física, activa tu acceso. Si aún no la tienes, consulta{' '}
              <Link to="/puntos-de-tramite" className="main__inline-link">
                aquí
              </Link>{' '}
              las sedes disponibles.
            </p>
          </article>
        </div>

        <div className="main__section-footer">
          <Link to="/puntos-de-tramite" className="secondary-button">
            Conoce más
          </Link>
        </div>
      </section>

      <section className="main__cta surface-card" aria-labelledby="cta-title">
        <div className="main__cta-copy">
          <p className="page-header__eyebrow">Siguiente paso</p>
          <h2 id="cta-title">Comienza hoy</h2>
          <p>
            Valida tu tarjeta con CURP, crea tu acceso y entra a una experiencia digital
            institucional unificada.
          </p>
        </div>

        <Link to="/activar" className="primary-button main__cta-button">
          Activar ahora
        </Link>
      </section>
    </main>
  );
};

export default Main;
