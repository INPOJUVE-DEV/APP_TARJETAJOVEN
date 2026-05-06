import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import AppBrand from './AppBrand';
import { appNavigationItems } from './AppNavigation';
import MobileNav from './MobileNav';
import './AuthenticatedShell.css';

const AuthenticatedShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <div className="app-shell__topbar-inner">
          <NavLink to="/perfil" className="app-shell__brand-link" aria-label="Ir al perfil">
            <AppBrand compact className="app-shell__brand" caption="Área segura" />
          </NavLink>

          <nav className="app-shell__nav" aria-label="Navegación principal">
            {appNavigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `app-shell__nav-link${isActive ? ' app-shell__nav-link--active' : ''}`
                }
              >
                <span className="app-shell__nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <div className="app-shell__main">
        <div className="app-shell__content">{children}</div>
      </div>

      <MobileNav />
    </div>
  );
};

export default AuthenticatedShell;
