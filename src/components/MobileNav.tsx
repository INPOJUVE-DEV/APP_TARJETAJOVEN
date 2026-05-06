import { NavLink } from 'react-router-dom';
import { appNavigationItems } from './AppNavigation';
import './MobileNav.css';

const MobileNav = () => {
  return (
    <nav className="mobile-nav" aria-label="Navegacion principal movil">
      <ul className="mobile-nav__list">
        {appNavigationItems.map((item) => (
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
