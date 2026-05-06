import { FormEvent, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, Theme } from '../features/preferences/preferencesSlice';
import { useAuth } from '../lib/useAuth';
import { isValidEmail } from '../lib/validators';
import { AppDispatch, RootState } from '../store';
import './Settings.css';

const themeOptions: Array<{
  value: Theme;
  title: string;
  description: string;
}> = [
  {
    value: 'light',
    title: 'Claro',
    description: 'Superficies luminosas y contraste institucional para uso diurno.',
  },
  {
    value: 'dark',
    title: 'Oscuro',
    description: 'Paleta profunda en verde con menor fatiga visual en ambientes oscuros.',
  },
];

const Settings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useSelector((state: RootState) => state.preferences);
  const { forgotPassword, profile } = useAuth();
  const [passwordEmail, setPasswordEmail] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordStatus, setPasswordStatus] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  useEffect(() => {
    if (profile?.email && !passwordEmail) {
      setPasswordEmail(profile.email);
    }
  }, [passwordEmail, profile?.email]);

  const handleThemeChange = (nextTheme: Theme) => {
    dispatch(setTheme(nextTheme));
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = passwordEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      setPasswordError('Ingresa el correo de tu cuenta.');
      setPasswordStatus(null);
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setPasswordError('Escribe un correo valido.');
      setPasswordStatus(null);
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordError(null);
    setPasswordStatus(null);

    try {
      const responseMessage = await forgotPassword(normalizedEmail);
      setPasswordStatus(responseMessage);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : 'No pudimos iniciar el cambio de contrasena.',
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <main className="settings-page" aria-labelledby="settings-title">
      <header className="page-header">
        <p className="page-header__eyebrow">Preferencias</p>
        <h1 id="settings-title" className="page-header__title">
          Configuración
        </h1>
        <p className="page-header__summary">
          Ajusta tu experiencia visual sin salir de la aplicación y mantén una lectura
          cómoda en cualquier contexto.
        </p>
      </header>

      <section className="settings-section surface-card section-shell" aria-labelledby="preferences-title">
        <div className="settings-section__header">
          <h2 id="preferences-title">Tema</h2>
          <p>Selecciona la presentación que mejor se adapte a tu entorno de uso.</p>
        </div>

        <div className="settings-theme-grid" role="radiogroup" aria-label="Tema">
          {themeOptions.map((option) => {
            const isActive = theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={`settings-theme-card${isActive ? ' settings-theme-card--active' : ''}`}
                onClick={() => handleThemeChange(option.value)}
                aria-pressed={isActive}
              >
                <span className="settings-theme-card__badge">{option.title}</span>
                <strong>{option.title}</strong>
                <p>{option.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-section surface-card section-shell" aria-labelledby="password-title">
        <div className="settings-section__header">
          <h2 id="password-title">Cambio de contrasena</h2>
          <p>Te enviaremos un enlace seguro para definir una nueva contrasena desde tu correo.</p>
        </div>

        <form className="settings-password-form" onSubmit={handlePasswordSubmit} noValidate>
          <div className={`settings-field${passwordError ? ' is-invalid' : ''}`}>
            <label htmlFor="settingsPasswordEmail">Correo de la cuenta</label>
            <input
              id="settingsPasswordEmail"
              type="email"
              value={passwordEmail}
              onChange={(event) => {
                setPasswordEmail(event.target.value);
                setPasswordError(null);
                setPasswordStatus(null);
              }}
              placeholder="tu_correo@ejemplo.com"
              autoComplete="email"
              disabled={isSubmittingPassword}
              required
            />
            <p className="settings-field__hint">
              Usa el correo vinculado a tu Tarjeta Joven para recibir el enlace de actualizacion.
            </p>
            {passwordError ? <p className="settings-field__error">{passwordError}</p> : null}
          </div>

          <button type="submit" className="primary-button settings-password-form__submit" disabled={isSubmittingPassword}>
            {isSubmittingPassword ? 'Enviando...' : 'Enviar enlace de cambio'}
          </button>

          <p className="settings-status" role="status" aria-live="polite">
            {passwordStatus}
          </p>
        </form>
      </section>
    </main>
  );
};

export default Settings;
