import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/useAuth';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <main className="login" aria-busy="true" aria-live="polite">
        <section className="login__card">
          <h1>Validando sesión</h1>
          <p>Estamos recuperando tu acceso seguro.</p>
        </section>
      </main>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
