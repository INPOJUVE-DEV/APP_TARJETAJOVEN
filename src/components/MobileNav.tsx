import { NavLink, useLocation } from 'react-router-dom';
import './MobileNav.css';
import { useAuth } from '../lib/useAuth';

const items = [
  { to: '/perfil', label: 'Perfil' },
  { to: '/catalog', label: 'Catálogo' },
  { to: '/map', label: 'Mapa' },
  { to: '/settings', label: 'Ajustes' },
];

const MobileNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const hiddenRoutes = ['/login', '/registro', '/activar', '/activation', '/forgot-password', '/reset-password'];

  if (!isAuthenticated || hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="mobile-nav" aria-label="Navegación principal móvil">
      <ul className="mobile-nav__list">
        {items.map((item) => (
          <li key={item.to} className="mobile-nav__item">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`
              }
            >
              <span className="mobile-nav__label">{item.label}</span>
              <span className="mobile-nav__dot" aria-hidden="true" />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileNav;
