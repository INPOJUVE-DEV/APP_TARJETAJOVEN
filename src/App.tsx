import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Main from './pages/Main';
import Login from './pages/Login';
import Catalog from './pages/Catalog';
import Profile from './pages/Profile';
import MapPage from './pages/Map';
import Settings from './pages/Settings';
import Help from './pages/Help';
import PreferencesInitializer from './features/preferences/PreferencesInitializer';
import Onboarding from './features/onboarding/Onboarding';
import A2HSBanner from './components/A2HSBanner';
import MobileNav from './components/MobileNav';
import { track } from './lib/analytics';
import Activation from './pages/Activation';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import ProcedurePoints from './pages/ProcedurePoints';

const App = () => {
  useEffect(() => {
    track('open_app');
  }, []);

  return (
    <>
      <PreferencesInitializer />
      <Onboarding />
      <A2HSBanner />
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/registro" element={<Navigate to="/activar" replace />} />
        <Route path="/activar" element={<Activation />} />
        <Route path="/activation" element={<Activation />} />
        <Route path="/puntos-de-tramite" element={<ProcedurePoints />} />
        <Route path="/migrar-cuenta" element={<Navigate to="/forgot-password" replace />} />
        <Route path="/registro/tarjeta-fisica" element={<Navigate to="/activar" replace />} />
        <Route path="/registro/tarjeta-fisica/crear-usuario" element={<Navigate to="/activar" replace />} />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute>
              <Catalog />
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <MapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute>
              <Help />
            </ProtectedRoute>
          }
        />
      </Routes>
      <MobileNav />
    </>
  );
};

export default App;
