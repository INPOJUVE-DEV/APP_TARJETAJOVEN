import { QRCodeSVG } from 'qrcode.react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <h1 id="profile-title" className="profile-page__sr-only">
        Perfil de tu Tarjeta Joven
      </h1>

      <section className="profile-card" aria-labelledby="profile-credential-title">
        <div className="profile-card__background" aria-hidden="true" />
        <div className="profile-card__content">
          <div className="profile-card__qr">
            <QRCodeSVG
              className="profile-card__qr-code"
              value={qrValue}
              level="M"
              includeMargin
              bgColor="#ffffff"
              fgColor="#101a16"
              role="img"
              aria-label={`Codigo QR asignado ${qrValue}`}
              title={qrValue}
            />
            <span className="profile-card__qr-value">{qrValue}</span>
          </div>
          <div className="profile-card__details">
            <h2 id="profile-credential-title">Tarjeta Joven</h2>
            <dl className="profile-card__list">
              <div className="profile-card__item">
                <dt>Nombre</dt>
                <dd>{displayName}</dd>
              </div>
              <div className="profile-card__item">
                <dt>Edad</dt>
                <dd>{displayAge} anios</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <div
        className="profile-banner"
        role="img"
        aria-label="Imagen representativa de Tarjeta Joven"
      />
      <button
        type="button"
        className="profile-logout"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        {isLoggingOut ? 'Cerrando sesion...' : 'Cerrar sesion'}
      </button>
    </main>
  );
};

export default Profile;
