import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InstitutionalHeader from '../components/InstitutionalHeader';
import { getAuthSession } from '../lib/authSession';
import { useAuth } from '../lib/useAuth';
import './Profile.css';

const DEFAULT_PROFILE = {
  name: 'Juventud potosina',
  cardNumber: 'TJ-894512-2025',
  municipality: 'San Luis Potosi',
};

const getFirstWord = (value?: string | null) => value?.trim().split(/\s+/).filter(Boolean)[0] ?? '';

const getPrimaryLastName = (apellido?: string | null) => apellido?.trim().split(/\s+/).filter(Boolean)[0] ?? '';

const buildShortName = (nombre?: string | null, apellidos?: string | null) => {
  const firstName = getFirstWord(nombre);
  const firstLastName = getPrimaryLastName(apellidos);
  const shortName = [firstName, firstLastName].filter(Boolean).join(' ').trim();

  return shortName || DEFAULT_PROFILE.name;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const pickString = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const getSessionShortName = () => {
  const nombreCompleto = getAuthSession().user?.nombreCompleto;
  if (!nombreCompleto) {
    return null;
  }

  const words = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  const firstName = words[0] ?? '';
  const firstLastName = words[1] ?? '';
  const shortName = [firstName, firstLastName].filter(Boolean).join(' ').trim();

  return shortName || null;
};

const resolveDisplayName = (profile: unknown) => {
  const profileRecord = asRecord(profile);
  const titular = asRecord(profileRecord?.titular);
  const cardholder = asRecord(profileRecord?.cardholder);
  const beneficiary = asRecord(profileRecord?.beneficiario);

  const rawFirstName = pickString(
    titular?.nombre,
    titular?.nombres,
    titular?.nombre_titular,
    titular?.nombres_titular,
    profileRecord?.titularNombre,
    profileRecord?.titularNombres,
    profileRecord?.nombreTitular,
    profileRecord?.nombresTitular,
    profileRecord?.titular_nombre,
    profileRecord?.titular_nombres,
    profileRecord?.nombre_titular,
    profileRecord?.nombres_titular,
    cardholder?.nombre,
    cardholder?.nombres,
    beneficiary?.nombre,
    beneficiary?.nombres,
    profileRecord?.nombre,
    profileRecord?.nombres,
  );

  const rawLastName = pickString(
    titular?.primerApellido,
    titular?.apellido,
    titular?.apellidos,
    titular?.primer_apellido,
    titular?.apellido_paterno,
    profileRecord?.titularPrimerApellido,
    profileRecord?.primerApellidoTitular,
    profileRecord?.titularApellido,
    profileRecord?.titularApellidos,
    profileRecord?.titular_primer_apellido,
    profileRecord?.primer_apellido_titular,
    profileRecord?.titular_apellido,
    profileRecord?.titular_apellidos,
    profileRecord?.apellido_paterno_titular,
    cardholder?.primerApellido,
    cardholder?.apellido,
    cardholder?.apellidos,
    beneficiary?.primerApellido,
    beneficiary?.apellido,
    beneficiary?.apellidos,
    profileRecord?.primerApellido,
    profileRecord?.apellido,
    profileRecord?.apellidos,
  );

  const profileShortName = buildShortName(rawFirstName, rawLastName);
  if (profileShortName !== DEFAULT_PROFILE.name) {
    return profileShortName;
  }

  return getSessionShortName() ?? DEFAULT_PROFILE.name;
};

const Profile = () => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = useMemo(() => {
    if (profile?.nombreCompleto?.trim()) {
      return profile.nombreCompleto.trim();
    }

    return resolveDisplayName(profile);
  }, [profile]);

  const displayAge = useMemo(() => {
    if (typeof profile?.edad === 'number' && !Number.isNaN(profile.edad)) {
      return profile.edad;
    }

    return null;
  }, [profile]);

  const displayCardNumber = useMemo(
    () => profile?.tarjetaNumero ?? DEFAULT_PROFILE.cardNumber,
    [profile?.tarjetaNumero],
  );

  const displayMunicipality = DEFAULT_PROFILE.municipality;

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
      <InstitutionalHeader
        className="profile-page__header"
        eyebrow="Mi Tarjeta Joven"
        title={`Hola, ${displayName}`}
        titleId="profile-title"
        summary=""
      />

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
          {displayAge !== null ? (
            <div className="profile-hero__detail">
              <dt>Edad</dt>
              <dd>{displayAge} anos</dd>
            </div>
          ) : null}
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
