import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import AppBrand from '../components/AppBrand';
import { useAuth } from '../lib/useAuth';
import { isValidEmail } from '../lib/validators';
import './Login.css';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Ingresa tu correo.');
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError('Escribe un correo válido.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const nextMessage = await forgotPassword(normalizedEmail);
      setMessage(nextMessage);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No pudimos procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login" aria-labelledby="forgot-password-title">
      <AppBrand className="login__brand login__brand--top" caption="Recuperación de acceso" />

      <section className="login__card surface-card">
        <p className="login__eyebrow">Recuperación</p>
        <h1 id="forgot-password-title">Recupera tu acceso</h1>
        <p className="login__hint">
          Ingresa el correo que vinculaste a tu tarjeta. Si existe y está habilitado,
          te enviaremos instrucciones.
        </p>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className={`login__field${error ? ' is-invalid' : ''}`}>
            <label htmlFor="forgotEmail">Correo</label>
            <input
              id="forgotEmail"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value.toLowerCase());
                setError(null);
              }}
              placeholder="tu_correo@ejemplo.com"
              autoComplete="email"
              disabled={isSubmitting}
              required
            />
            {error && <p className="login__error">{error}</p>}
          </div>

          <button type="submit" className="primary-button login__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar instrucciones'}
          </button>

          <Link to="/login" className="secondary-button login__secondary">
            Volver a login
          </Link>

          <p className="login__status" role="status" aria-live="polite">
            {message}
          </p>
        </form>
      </section>
    </main>
  );
};

export default ForgotPassword;
