import { ChangeEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setTheme,
  Theme,
} from '../features/preferences/preferencesSlice';
import { AppDispatch, RootState } from '../store';
import './Settings.css';

const Settings = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { theme } = useSelector(
    (state: RootState) => state.preferences
  );

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(event.target.value as Theme));
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
            <h3>Tema</h3>
            <p>Cambia entre tema claro u oscuro sin recargar la p&aacute;gina.</p>
          </div>
          <select id="theme" className="settings-select" value={theme} onChange={handleThemeChange}>
            <option value="light">Claro</option>
            <option value="dark">Oscuro</option>
          </select>
        </div>
      </section>
    </main>
  );
};

export default Settings;
