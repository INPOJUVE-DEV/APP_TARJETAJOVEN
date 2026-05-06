import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import headerBrand from '../../Cabecera.png';
import { appNavigationItems } from './AppNavigation';
import MobileNav from './MobileNav';
import './AuthenticatedShell.css';

const AuthenticatedShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="app-shell">
      <header className="app-shell__topbar">
        <div className="app-shell__topbar-inner">
          <div className="app-shell__topbar-start">
            <NavLink to="/perfil" className="app-shell__brand-link" aria-label="Ir al perfil">
              <img src={headerBrand} alt="Tarjeta Joven" className="app-shell__header-image" />
            </NavLink>
          </div>

          <nav className="app-shell__nav" aria-label="Navegacion principal">
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
