import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import './Profile.css';

const DEFAULT_PROFILE = {
  name: 'Itzel Martinez',
  age: 22,
  cardNumber: 'TJ-894512-2025',
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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setIsLoggingOut(false);
    }
  };

  return (
    <main className="profile-page" aria-labelledby="profile-title">
      <header className="profile-page__header">
        <p className="profile-page__eyebrow">Mi Tarjeta Joven</p>
        <h1 id="profile-title"></h1>
      </header>

      <section className="profile-card" aria-labelledby="profile-credential-title">
        <Link className="profile-card__hero" to="/catalog" aria-label="Explorar beneficios disponibles">
          
        </Link>

        <div className="profile-card__content">
          <div className="profile-card__details">
            <div className="profile-card__heading">
              <span className="profile-card__status">Activa</span>
            </div>

            <dl className="profile-card__list">
              <div className="profile-card__item">
                <dt>Titular</dt>
                <dd>{displayName}</dd>
              </div>
              <div className="profile-card__item">
                <dt>Número de tarjeta</dt>
                <dd>{displayCardNumber}</dd>
              </div>
              <div className="profile-card__item">
                <dt>Edad</dt>
                <dd>{displayAge} a&ntilde;os</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <footer className="profile-page__footer">
        <button
          type="button"
          className="profile-logout"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Cerrando sesi\u00f3n...' : 'Cerrar sesi\u00f3n'}
        </button>
      </footer>
    </main>
  );
};

export default Profile;
