import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';
import './Profile.css';

const DEFAULT_PROFILE = {
  name: 'Itzel Martinez',
  age: 22,
  credits: 0,
  barcode: 'TJ-894512-2025',
};

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = useMemo(() => {
    const parts = [user?.nombre, user?.apellidos].filter(Boolean);
    return parts.length ? parts.join(' ') : DEFAULT_PROFILE.name;
  }, [user?.nombre, user?.apellidos]);

  const displayAge = useMemo(() => {
    if (typeof user?.edad === 'number' && !Number.isNaN(user.edad)) {
      return user.edad;
    }
    return DEFAULT_PROFILE.age;
  }, [user?.edad]);

  const qrValue = useMemo(
    () => user?.barcodeValue ?? DEFAULT_PROFILE.barcode,
    [user?.barcodeValue],
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
        <p className="profile-page__eyebrow">Mi credencial</p>
        <h1 id="profile-title">Tarjeta Joven</h1>
        <p>Presenta tu QR para validar beneficios con comercios aliados.</p>
      </header>

      <section className="profile-card" aria-labelledby="profile-credential-title">
        <div className="profile-card__content">
          <div className="profile-card__details">
            <div className="profile-card__heading">
              <span className="profile-card__status">Activa</span>
              <h2 id="profile-credential-title">Credencial digital</h2>
            </div>

            <dl className="profile-card__list">
              <div className="profile-card__item">
                <dt>Titular</dt>
                <dd>{displayName}</dd>
              </div>
              <div className="profile-card__item">
                <dt>Edad</dt>
                <dd>{displayAge} a&ntilde;os</dd>
              </div>
            </dl>
          </div>

          <aside className="profile-card__qr" aria-label="C&oacute;digo QR de tu credencial">
            <QRCodeSVG
              className="profile-card__qr-code"
              value={qrValue}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#101a16"
              role="img"
              aria-label="C&oacute;digo QR asignado a tu credencial"
            />
            <span>Escanear para validar</span>
          </aside>
        </div>
      </section>

      <Link className="profile-banner-link" to="/catalog" aria-label="Ver convenios disponibles">
        <span className="profile-banner-link__image" aria-hidden="true" />
      </Link>

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
