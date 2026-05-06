import { ReactNode } from 'react';

export type AppNavigationItem = {
  icon: ReactNode;
  label: string;
  to: string;
};

const homeIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 3.2 3 10.4v10.4h6.4v-6.6h5.2v6.6H21V10.4Z" />
  </svg>
);

const profileIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-3.31 0-6 1.79-6 4v1h12v-1c0-2.21-2.69-4-6-4Z" />
  </svg>
);

const catalogIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H19v16H7.5A2.5 2.5 0 0 0 5 20.5Zm2.5-.5A1.5 1.5 0 0 0 6 5.5V18a3.48 3.48 0 0 1 1.5-.34H18V4Z" />
  </svg>
);

const mapIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M15 4.5 9 2 3 4.5v17L9 19l6 2.5 6-2.5v-17ZM9 17.28l-4 1.67V5.72l4-1.67Zm5 1.67-4-1.67V4.05l4 1.67Zm5-1.67-4 1.67V5.72l4-1.67Z" />
  </svg>
);

const activateIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm4.7 7.7-5.53 5.54a1 1 0 0 1-1.42 0L7.3 12.79l1.41-1.42 1.75 1.76 4.82-4.84Z" />
  </svg>
);

const settingsIcon = (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="m19.14 12.94.04-.44-.04-.44 2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.25 7.25 0 0 0-.76-.44l-.36-2.54A.5.5 0 0 0 14.77 4h-3.54a.5.5 0 0 0-.49.42l-.36 2.54a7.25 7.25 0 0 0-.76.44l-2.39-.96a.5.5 0 0 0-.6.22L4.71 9.98a.5.5 0 0 0 .12.64l2.03 1.58-.04.44.04.44-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.39-.96c.24.17.49.31.76.44l.36 2.54a.5.5 0 0 0 .49.42h3.54a.5.5 0 0 0 .49-.42l.36-2.54c.27-.13.52-.27.76-.44l2.39.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64ZM13 15.5A3.5 3.5 0 1 1 16.5 12 3.5 3.5 0 0 1 13 15.5Z" />
  </svg>
);

export const appNavigationItems: AppNavigationItem[] = [
  {
    to: '/perfil',
    label: 'Perfil',
    icon: profileIcon,
  },
  {
    to: '/catalog',
    label: 'Catalogo',
    icon: catalogIcon,
  },
  {
    to: '/map',
    label: 'Mapa',
    icon: mapIcon,
  },
  {
    to: '/settings',
    label: 'Ajustes',
    icon: settingsIcon,
  },
];

export const publicNavigationItems: AppNavigationItem[] = [
  {
    to: '/',
    label: 'Inicio',
    icon: homeIcon,
  },
  {
    to: '/activar',
    label: 'Activar',
    icon: activateIcon,
  },
  {
    to: '/login',
    label: 'Entrar',
    icon: profileIcon,
  },
  {
    to: '/aviso-de-privacidad',
    label: 'Aviso',
    icon: settingsIcon,
  },
];
