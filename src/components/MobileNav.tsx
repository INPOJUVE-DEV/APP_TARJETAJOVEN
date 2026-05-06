import { CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';
import { appNavigationItems, AppNavigationItem } from './AppNavigation';
import './MobileNav.css';

type MobileNavProps = {
  items?: AppNavigationItem[];
};

const MobileNav = ({ items = appNavigationItems }: MobileNavProps) => {
  const navStyle = {
    ['--mobile-nav-count' as '--mobile-nav-count']: String(items.length),
  } as CSSProperties;

  return (
    <nav className="mobile-nav" aria-label="Navegacion principal movil">
      <ul className="mobile-nav__list" style={navStyle}>
        {items.map((item) => (
          <li key={item.to} className="mobile-nav__item">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`
              }
            >
              <span className="mobile-nav__icon">{item.icon}</span>
              <span className="mobile-nav__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileNav;
