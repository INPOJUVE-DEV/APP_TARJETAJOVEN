import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import './Profile.css';

const DEFAULT_PROFILE = {
  name: 'Juventud potosina',
  age: 22,
  cardNumber: 'TJ-894512-2025',
  municipality: 'San Luis Potosí',
};

const Profile = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = useMemo(() => {
    const parts = [profile?.nombre, profile?.apellidos].filter(Boolean);
    return parts.length ? parts.join(' ') : DEFAULT_PROFILE.name;
  }, [profile?.nombre, profile?.apellidos]);

  const displayAge = useMemo(() => {
    if (typeof profile?.edad === 'number' && !Number.isNaN(profile.edad)) {
      return profile.edad;
    }
    return DEFAULT_PROFILE.age;
  }, [profile?.edad]);

  const displayCardNumber = useMemo(
    () => profile?.tarjetaNumero ?? DEFAULT_PROFILE.cardNumber,
    [profile?.tarjetaNumero],
  );

  const displayMunicipality = useMemo(
    () => profile?.municipio ?? DEFAULT_PROFILE.municipality,
    [profile?.municipio],
  );

  const statusLabel = profile?.status === 'active' || !profile?.status ? 'Activa' : 'En revisión';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="profile-page" aria-labelledby="profile-title">
      <header className="page-header profile-page__header">
        <p className="page-header__eyebrow">Mi Tarjeta Joven</p>
        <h1 id="profile-title" className="page-header__title">
          Hola, {displayName}
        </h1>
        <p className="page-header__summary">
          Tu cuenta ya está lista para consultar beneficios, revisar comercios aliados y
          mantener tu acceso institucional al día.
        </p>
      </header>

      <section className="profile-hero surface-card" aria-labelledby="profile-card-title">
        <div className="profile-hero__copy">
          <span className="pill-badge">{statusLabel}</span>
          <h2 id="profile-card-title">Tu credencial digital está vinculada correctamente</h2>
          <p>
            Usa tu perfil para identificarte dentro del programa y revisar la información
            principal de tu tarjeta sin salir de la app.
          </p>

          <div className="profile-hero__actions">
            <Link to="/catalog" className="primary-button">
              Ver beneficios
            </Link>
            <Link to="/map" className="secondary-button">
              Abrir mapa
            </Link>
          </div>
        </div>

        <dl className="profile-hero__details">
          <div className="profile-hero__detail">
            <dt>Titular</dt>
            <dd>{displayName}</dd>
          </div>
          <div className="profile-hero__detail">
            <dt>Número de tarjeta</dt>
            <dd>{displayCardNumber}</dd>
          </div>
          <div className="profile-hero__detail">
            <dt>Municipio</dt>
            <dd>{displayMunicipality}</dd>
          </div>
          <div className="profile-hero__detail">
            <dt>Edad</dt>
            <dd>{displayAge} años</dd>
          </div>
        </dl>
      </section>

      <section className="profile-grid" aria-label="Accesos rápidos">
        <article className="profile-panel surface-card">
          <p className="profile-panel__eyebrow">Catálogo</p>
          <h2>Explora descuentos y beneficios</h2>
          <p>Consulta promociones disponibles y revisa sus condiciones antes de visitarlas.</p>
          <Link to="/catalog" className="secondary-button profile-panel__link">
            Ir al catálogo
          </Link>
        </article>

        <article className="profile-panel surface-card">
          <p className="profile-panel__eyebrow">Mapa</p>
          <h2>Ubica comercios aliados</h2>
          <p>Encuentra sedes cercanas y puntos relevantes del programa en una sola vista.</p>
          <Link to="/map" className="secondary-button profile-panel__link">
            Ver mapa
          </Link>
        </article>

        <article className="profile-panel surface-card">
          <p className="profile-panel__eyebrow">Soporte</p>
          <h2>Resuelve dudas rápidas</h2>
          <p>Accede a preguntas frecuentes, soporte y opciones para administrar tu experiencia.</p>
          <div className="profile-panel__links">
            <Link to="/help" className="secondary-button profile-panel__link">
              Centro de ayuda
            </Link>
            <Link to="/settings" className="secondary-button profile-panel__link">
              Ajustes
            </Link>
          </div>
        </article>
      </section>

      <footer className="profile-page__footer">
        <button type="button" className="secondary-button profile-logout" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        </button>
      </footer>
    </main>
  );
};

export default Profile;
