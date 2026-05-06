import { useDispatch, useSelector } from 'react-redux';
import { setTheme, Theme } from '../features/preferences/preferencesSlice';
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

  const handleThemeChange = (nextTheme: Theme) => {
    dispatch(setTheme(nextTheme));
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
    </main>
  );
};

export default Settings;
