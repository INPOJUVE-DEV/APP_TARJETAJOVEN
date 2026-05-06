import { useEffect, useState } from 'react';
import { env } from '../config/env';
import { track } from '../lib/analytics';
import './Map.css';

const MAPS_URL = env.mapsUrl;

const MapPage = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    track('open_map');
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <main className="map-page" aria-labelledby="map-title">
      <section className="map-page__intro surface-card section-shell">
        <header className="page-header">
          <p className="page-header__eyebrow">Consulta territorial</p>
          <h1 id="map-title" className="page-header__title">
            Mapa de beneficios
          </h1>
          <p className="page-header__summary">
            Revisa comercios y ubicaciones relevantes del programa en una vista mas directa,
            pensada para entrar rapido y ubicarte sin distracciones.
          </p>
        </header>
      </section>

      {isOffline ? (
        <div className="status-panel map-page__offline" role="status">
          <p>Mapa no disponible sin conexion.</p>
          <p>Vuelve a conectarte para consultar ubicaciones y beneficios cercanos.</p>
        </div>
      ) : (
        <section className="map-page__viewer surface-card" aria-label="Mapa interactivo">
          {MAPS_URL ? (
            <iframe
              title="Mapa de comercios"
              src={MAPS_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="empty-state map-page__empty" role="status">
              <p>Configura la URL de Google MyMaps para visualizar el mapa.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
};

export default MapPage;
