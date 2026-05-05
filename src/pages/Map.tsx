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
    <main className="map-page">
      <section className="map-page__hero" aria-labelledby="map-title">
        <div className="map-page__hero-copy">
          <p className="map-page__eyebrow">Tarjeta Joven</p>
          <h1 id="map-title" className="map-page__title">
            Mapa de beneficios
          </h1>
        </div>
        <div className="map-page__hero-media" aria-hidden="true" />
      </section>

      {isOffline ? (
        <div className="map-page__offline" role="status">
          <span aria-hidden="true">Mapa</span>
          <p>Mapa no disponible sin conexion</p>
        </div>
      ) : (
        <section className="map-page__viewer" aria-label="Mapa interactivo">
          {MAPS_URL ? (
            <iframe
              title="Mapa de comercios"
              src={MAPS_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <p className="map-page__empty" role="status">
              Configura la URL de Google MyMaps para visualizar el mapa.
            </p>
          )}
        </section>
      )}
    </main>
  );
};

export default MapPage;
