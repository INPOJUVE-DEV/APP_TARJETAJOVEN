import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'icons/logo.svg'],
      manifest: {
        name: 'Tarjeta Joven',
        short_name: 'Tarjeta Joven',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#055a1c',
        description:
          'Consulta beneficios, credenciales digitales y servicios para jóvenes desde cualquier dispositivo.',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '256x256',
            type: 'image/x-icon',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document' || request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
            },
          },
          {
            urlPattern: ({ request }) =>
              request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'asset-cache',
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'image' || request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: ({ url }) =>
              ['/api/v1/catalog', '/api/v1/convenios', '/api/v1/benefits'].includes(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'catalog-cache',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8081',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@sentry/browser': resolve(projectDir, 'src/vendor/sentry-browser.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    css: true,
  }
});
