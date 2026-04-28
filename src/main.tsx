import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { store } from './store';
import './styles/theme.css';
import { initSentry } from './lib/sentry';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { AppAuthProvider } from './lib/AppAuthProvider';

initSentry();

registerSW({
  immediate: true,
  onRegistered(swRegistration) {
    if (swRegistration && swRegistration.update) {
      swRegistration.update().catch(() => {
        // Ignored: fallback to next autoUpdate cycle
      });
    }
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <AppAuthProvider>
          <App />
        </AppAuthProvider>
      </Provider>
    </BrowserRouter>
    <SpeedInsights />
  </React.StrictMode>
);
