import './Login.css';

const AuthCallback = () => {
  return (
    <main className="login" aria-busy="true" aria-live="polite">
      <section className="login__card">
        <h1>Completando acceso seguro</h1>
        <p>Estamos validando tu sesion con Auth0 y te redirigiremos en un momento.</p>
      </section>
    </main>
  );
};

export default AuthCallback;
