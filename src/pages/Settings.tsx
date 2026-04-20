import { ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setLanguage,
  setTheme,
  setNotificationsEnabled,
  Language,
  Theme,
} from '../features/preferences/preferencesSlice';
import { AppDispatch, RootState } from '../store';
import './Settings.css';

const Settings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { language, theme, notificationsEnabled } = useSelector(
    (state: RootState) => state.preferences
  );

  const handleLanguageChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch(setLanguage(event.target.value as Language));
  };

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(event.target.value as Theme));
  };

  const handleNotificationsChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setNotificationsEnabled(event.target.checked));
  };

  return (
    <main className="settings-page" aria-labelledby="settings-title">
      <header>
        <h1 id="settings-title">Configuraci&oacute;n</h1>
        <p>Ajusta tu experiencia sin salir de la aplicaci&oacute;n.</p>
      </header>

      <section className="settings-section" aria-labelledby="preferences-title">
        <h2 id="preferences-title">Preferencias generales</h2>

        <div className="settings-field">
          <div className="settings-field__info">
            <h3>Idioma</h3>
            <p>Selecciona el idioma en el que quieres ver la interfaz.</p>
          </div>
          <select
            id="language"
            className="settings-select"
            value={language}
            onChange={handleLanguageChange}
          >
            <option value="es">Espa&ntilde;ol</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="settings-field">
          <div className="settings-field__info">
            <h3>Tema</h3>
            <p>Cambia entre tema claro u oscuro sin recargar la p&aacute;gina.</p>
          </div>
          <select id="theme" className="settings-select" value={theme} onChange={handleThemeChange}>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="notifications-title">
        <h2 id="notifications-title">Notificaciones</h2>

        <div className="settings-field">
          <div className="settings-field__info">
            <h3>Recibir notificaciones</h3>
            <p>Te enviaremos alertas de beneficios y nuevos comercios.</p>
          </div>
          <label htmlFor="notifications" className="sr-only">
            Activar notificaciones
          </label>
          <input
            id="notifications"
            type="checkbox"
            className="settings-switch"
            checked={notificationsEnabled}
            onChange={handleNotificationsChange}
          />
        </div>
      </section>
    </main>
  );
};

export default Settings;
