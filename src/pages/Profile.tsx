import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import './Profile.css';

const DEFAULT_PROFILE = {
  name: 'Juventud potosina',
  age: 22,
  cardNumber: 'TJ-894512-2025',
  municipality: 'San Luis Potosi',
};

const buildShortName = (nombre?: string | null, apellidos?: string | null) => {
  const firstName = nombre?.trim().split(/\s+/).filter(Boolean)[0] ?? '';
  const firstLastName = apellidos?.trim().split(/\s+/).filter(Boolean)[0] ?? '';
  const shortName = [firstName, firstLastName].filter(Boolean).join(' ').trim();

  return shortName || DEFAULT_PROFILE.name;
};

const Profile = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = useMemo(
    () => buildShortName(profile?.nombre, profile?.apellidos),
    [profile?.apellidos, profile?.nombre],
  );

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

  const normalizedStatus = typeof profile?.status === 'string' ? profile.status.trim().toLowerCase() : 'active';
  const showStatusBadge = normalizedStatus !== 'active';
  const statusLabel = normalizedStatus === 'inactive' ? 'Inactiva' : 'En revision';

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
      </header>

      <section className="profile-hero surface-card" aria-label="Resumen de tarjeta">
        <div className="profile-hero__copy">
          {showStatusBadge ? <span className="pill-badge">{statusLabel}</span> : null}
          <div className="profile-hero__actions">
            <Link to="/catalog" className="primary-button">
              Ver beneficios
            </Link>
          </div>
        </div>

        <div className="profile-hero__visual">
          <img src="/icons/profile-banner.svg" alt="Tarjeta Joven digital" className="profile-hero__image" />
        </div>

        <dl className="profile-hero__details">
          <div className="profile-hero__detail">
            <dt>Titular</dt>
            <dd>{displayName}</dd>
          </div>
          <div className="profile-hero__detail">
            <dt>Numero de tarjeta</dt>
            <dd>{displayCardNumber}</dd>
          </div>
          <div className="profile-hero__detail">
            <dt>Municipio</dt>
            <dd>{displayMunicipality}</dd>
          </div>
          <div className="profile-hero__detail">
            <dt>Edad</dt>
            <dd>{displayAge} anos</dd>
          </div>
        </dl>
      </section>

      <footer className="profile-page__footer">
        <button type="button" className="secondary-button profile-logout" onClick={handleLogout} disabled={isLoggingOut}>
          {isLoggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}
        </button>
      </footer>
    </main>
  );
};

export default Profile;
