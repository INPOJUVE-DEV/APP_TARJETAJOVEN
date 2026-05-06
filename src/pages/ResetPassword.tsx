import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AppBrand from '../components/AppBrand';
import { useAuth } from '../lib/useAuth';
import {
  isSecurePassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordsMatch,
} from '../lib/validators';
import './Login.css';

const ResetPassword = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<{ password?: string; passwordConfirmation?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useMemo(() => new URLSearchParams(location.search).get('token') ?? '', [location.search]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: { password?: string; passwordConfirmation?: string; general?: string } = {};

    if (!token) {
      nextErrors.general = 'El enlace de recuperación no es válido o ya expiró.';
    }

    if (!password) {
      nextErrors.password = 'Ingresa una contraseña nueva.';
    } else if (!isSecurePassword(password)) {
      nextErrors.password = `Usa entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres, con mayúscula, minúscula y número.`;
    }

    if (!passwordConfirmation) {
      nextErrors.passwordConfirmation = 'Confirma tu contraseña.';
    } else if (!passwordsMatch(password, passwordConfirmation)) {
      nextErrors.passwordConfirmation = 'Las contraseñas no coinciden.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const successMessage = await resetPassword(token, password, passwordConfirmation);
      navigate('/login', {
        replace: true,
        state: {
          successMessage,
        },
      });
    } catch (requestError) {
      setErrors({
        general: requestError instanceof Error ? requestError.message : 'No pudimos actualizar tu contraseña.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login" aria-labelledby="reset-password-title">
      <AppBrand className="login__brand login__brand--top" caption="Actualización segura" />

      <section className="login__card surface-card">
        <p className="login__eyebrow">Nueva contraseña</p>
        <h1 id="reset-password-title">Restablece tu acceso</h1>
        <p className="login__hint">Crea una nueva contraseña para volver a entrar a tu cuenta.</p>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          <div className={`login__field${errors.password ? ' is-invalid' : ''}`}>
            <label htmlFor="resetPassword">Contraseña</label>
            <input
              id="resetPassword"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined, general: undefined }));
              }}
              autoComplete="new-password"
              disabled={isSubmitting}
              required
            />
            {errors.password && <p className="login__error">{errors.password}</p>}
          </div>

          <div className={`login__field${errors.passwordConfirmation ? ' is-invalid' : ''}`}>
            <label htmlFor="resetPasswordConfirmation">Confirmar contraseña</label>
            <input
              id="resetPasswordConfirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(event) => {
                setPasswordConfirmation(event.target.value);
                setErrors((current) => ({
                  ...current,
                  passwordConfirmation: undefined,
                  general: undefined,
                }));
              }}
              autoComplete="new-password"
              disabled={isSubmitting}
              required
            />
            {errors.passwordConfirmation && <p className="login__error">{errors.passwordConfirmation}</p>}
          </div>

          <button type="submit" className="primary-button login__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>

          <Link to="/login" className="secondary-button login__secondary">
            Volver a login
          </Link>

          <p className="login__status" role="status" aria-live="polite">
            {errors.general}
          </p>
        </form>
      </section>
    </main>
  );
};

export default ResetPassword;
