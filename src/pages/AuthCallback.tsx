import './Login.css';

const AuthCallback = () => {
  return (
    <main className="login" aria-busy="true" aria-live="polite">
      <section className="login__card">
        <h1>Completando acceso</h1>
        <p>Estamos cerrando el proceso de acceso y te redirigiremos en un momento.</p>
      </section>
    </main>
  );
};

export default AuthCallback;
