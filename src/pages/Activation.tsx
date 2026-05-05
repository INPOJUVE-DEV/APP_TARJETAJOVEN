import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearPendingActivation, getPendingActivation, persistPendingActivation } from '../lib/authFlow';
import { normalizeCurp, isValidCurp } from '../lib/curp';
import {
  ActivationErrorKind,
  getActivationErrorKind,
  getRequestErrorMessage,
} from '../lib/requestErrors';
import { useAuth } from '../lib/useAuth';
import {
  isSecurePassword,
  isValidEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordsMatch,
} from '../lib/validators';
import './Activation.css';

type ActivationUiState =
  | 'idle'
  | 'validating'
  | 'validated'
  | 'creating_account'
  | 'success'
  | 'already_linked'
  | 'blocked'
  | 'invalid'
  | 'error';

type ActivationCredentials = {
  email: string;
  password: string;
  confirmPassword: string;
};

type ActivationFormErrors = {
  tarjetaNumero?: string;
  curp?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

const INITIAL_CREDENTIALS: ActivationCredentials = {
  email: '',
  password: '',
  confirmPassword: '',
};

const RECOVERABLE_STATES: ActivationUiState[] = [
  'validated',
  'already_linked',
  'blocked',
  'invalid',
  'error',
  'success',
];

const Activation = () => {
  const navigate = useNavigate();
  const { verifyActivation, completeActivation, clearErrorMessage } = useAuth();

  const [tarjetaNumero, setTarjetaNumero] = useState('');
  const [curp, setCurp] = useState('');
  const [credentials, setCredentials] = useState<ActivationCredentials>(INITIAL_CREDENTIALS);
  const [activationState, setActivationState] = useState(() => getPendingActivation());
  const [uiState, setUiState] = useState<ActivationUiState>(() =>
    getPendingActivation() ? 'validated' : 'idle',
  );
  const [formErrors, setFormErrors] = useState<ActivationFormErrors>({});

  const normalizedTarjeta = useMemo(() => tarjetaNumero.trim().toUpperCase(), [tarjetaNumero]);
  const normalizedCurp = useMemo(() => normalizeCurp(curp), [curp]);
  const normalizedEmail = useMemo(() => credentials.email.trim().toLowerCase(), [credentials.email]);
  const isBusy = uiState === 'validating' || uiState === 'creating_account';

  useEffect(() => {
    const pendingActivation = getPendingActivation();
    if (!pendingActivation) {
      return;
    }

    setActivationState(pendingActivation);
    setTarjetaNumero(pendingActivation.tarjetaNumero);
    setUiState('validated');
  }, []);

  const clearFormErrors = () => {
    setFormErrors({});
  };

  const currentStep = (() => {
    if (uiState === 'success') {
      return 3;
    }

    if (activationState?.verified) {
      return 2;
    }

    return 1;
  })();

  const validateCardholderFields = () => {
    const nextErrors: ActivationFormErrors = {};

    if (!normalizedTarjeta) {
      nextErrors.tarjetaNumero = 'Ingresa el número de tarjeta.';
    }

    if (!normalizedCurp) {
      nextErrors.curp = 'Ingresa tu CURP.';
    } else if (normalizedCurp.length > 18 || !isValidCurp(normalizedCurp, { strict: true })) {
      nextErrors.curp = 'Revisa tu CURP. Debe coincidir con el formato oficial.';
    }

    return nextErrors;
  };

  const validateCredentialsFields = () => {
    const nextErrors: ActivationFormErrors = {};

    if (!normalizedEmail) {
      nextErrors.email = 'Ingresa tu correo.';
    } else if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = 'Escribe un correo valido.';
    }

    if (!credentials.password) {
      nextErrors.password = 'Crea una contraseña.';
    } else if (!isSecurePassword(credentials.password)) {
      nextErrors.password = `Usa entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres, con mayuscula, minuscula y numero.`;
    }

    if (!credentials.confirmPassword) {
      nextErrors.confirmPassword = 'Confirma tu contraseña.';
    } else if (!passwordsMatch(credentials.password, credentials.confirmPassword)) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    return nextErrors;
  };

  const applyActivationError = (
    error: unknown,
    options?: {
      fallbackMessage?: string;
      resetVerification?: boolean;
    },
  ) => {
    const errorKind = getActivationErrorKind(error);
    const nextState: Record<ActivationErrorKind, ActivationUiState> = {
      already_linked: 'already_linked',
      blocked: 'blocked',
      invalid: 'invalid',
      session_expired: 'error',
      error: 'error',
    };

    if (options?.resetVerification) {
      clearPendingActivation();
      setActivationState(null);
      setCredentials(INITIAL_CREDENTIALS);
    }

    setUiState(nextState[errorKind]);
    setFormErrors({
      general: getRequestErrorMessage(error, {
        fallbackMessage: options?.fallbackMessage,
        useGenericActivationError: true,
      }),
    });
  };

  const applyCredentialApiErrors = (error: unknown) => {
    const apiMessage = getRequestErrorMessage(error, {
      fallbackMessage: 'No pudimos completar la activacion. Intenta de nuevo.',
    });
    const normalizedMessage = apiMessage.toLowerCase();

    if (normalizedMessage.includes('password_confirmation') || normalizedMessage.includes('coincid')) {
      setFormErrors({ confirmPassword: apiMessage });
      return true;
    }

    if (normalizedMessage.includes('password')) {
      setFormErrors({ password: apiMessage });
      return true;
    }

    if (normalizedMessage.includes('email') || normalizedMessage.includes('correo')) {
      setFormErrors({ email: apiMessage });
      return true;
    }

    return false;
  };

  const handleValidateCardholder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateCardholderFields();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    setUiState('validating');
    clearFormErrors();
    clearErrorMessage();

    try {
      const response = await verifyActivation({
        tarjetaNumero: normalizedTarjeta,
        curp: normalizedCurp,
      });

      if (!response.can_activate) {
        throw Object.assign(new Error('No fue posible validar la tarjeta.'), { status: 422 });
      }

      const nextActivationState = {
        tarjetaNumero: normalizedTarjeta,
        verified: true,
      };

      persistPendingActivation(nextActivationState);
      setActivationState(nextActivationState);
      setCurp('');
      setCredentials(INITIAL_CREDENTIALS);
      setUiState('validated');
      setFormErrors({
        general: 'Tarjeta validada correctamente. Ahora crea tu acceso con correo y contraseña.',
      });
    } catch (error) {
      clearPendingActivation();
      setActivationState(null);
      applyActivationError(error, {
        fallbackMessage: 'No se pudo validar la tarjeta con los datos proporcionados.',
      });
    }
  };

  const handleCompleteActivation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activationState?.verified) {
      return;
    }

    const nextErrors = validateCredentialsFields();
    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    clearErrorMessage();
    setFormErrors({});
    setUiState('creating_account');

    try {
      await completeActivation({
        tarjetaNumero: activationState.tarjetaNumero,
        email: normalizedEmail,
        password: credentials.password,
        passwordConfirmation: credentials.confirmPassword,
      });

      clearPendingActivation();
      setActivationState(null);
      setUiState('success');
      setFormErrors({
        general: 'Cuenta activada correctamente. Estamos cargando tu perfil.',
      });
      navigate('/perfil', { replace: true });
    } catch (error) {
      if (applyCredentialApiErrors(error)) {
        setUiState('validated');
        return;
      }

      const errorKind = getActivationErrorKind(error);
      applyActivationError(error, {
        fallbackMessage: 'No pudimos completar la activacion. Intenta de nuevo.',
        resetVerification: errorKind === 'blocked' || errorKind === 'invalid',
      });
    }
  };

  const handleResetActivation = () => {
    clearPendingActivation();
    clearErrorMessage();
    setTarjetaNumero('');
    setCurp('');
    setCredentials(INITIAL_CREDENTIALS);
    setActivationState(null);
    setUiState('idle');
    clearFormErrors();
  };

  const updateCredential = (field: keyof ActivationCredentials, value: string) => {
    setCredentials((current) => ({
      ...current,
      [field]: field === 'email' ? value.toLowerCase() : value,
    }));
    setFormErrors((current) => ({
      ...current,
      [field]: undefined,
      general: undefined,
    }));
  };

  const statusText = (() => {
    switch (uiState) {
      case 'validating':
        return 'Estamos validando tu tarjeta y tu CURP.';
      case 'validated':
        return 'Tarjeta validada correctamente. Ahora crea tu acceso con correo y contraseña.';
      case 'creating_account':
        return 'Estamos activando tu cuenta.';
      case 'success':
        return 'Tu cuenta quedo activada correctamente.';
      case 'already_linked':
        return 'Esta tarjeta ya tiene una cuenta asociada. Inicia sesión o recupera tu acceso.';
      case 'blocked':
        return 'Esta tarjeta no esta activa. Acude a soporte.';
      case 'invalid':
        return 'Los datos no coinciden. Verifica tu numero de tarjeta y CURP.';
      case 'error':
        return 'No pudimos completar la activacion. Revisa el mensaje y vuelve a intentarlo.';
      default:
        return '';
    }
  })();

  const progressValue = (currentStep / 3) * 100;
  const shouldShowFeedback = uiState !== 'idle' || Boolean(formErrors.general);

  return (
    <main className="activation" aria-labelledby="activation-title">
      <section className="activation__card">
        <p className="activation__step">Activacion guiada</p>
        <h1 id="activation-title">Activa tu Tarjeta Joven</h1>
        <p className="activation__description">
          Sigue estos pasos para validar tu tarjeta, crear tu acceso y entrar a tu perfil digital.
        </p>

        <div className="activation__progress" aria-label={`Paso ${currentStep} de 3`}>
          <div className="activation__progress-meta">
            <span>Paso {currentStep} de 3</span>
            <strong>{currentStep === 1 ? 'Validar datos' : currentStep === 2 ? 'Crear acceso' : 'Entrar'}</strong>
          </div>
          <div
            className="activation__progress-track"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={currentStep}
            aria-valuetext={`Paso ${currentStep} de 3`}
          >
            <span className="activation__progress-fill" style={{ width: `${progressValue}%` }} />
          </div>
        </div>

        {shouldShowFeedback && (
          <div className={`activation__feedback activation__feedback--${uiState}`} role="status" aria-live="polite">
            {statusText ? <p>{statusText}</p> : null}
            {formErrors.general && formErrors.general !== statusText && (
              <p className="activation__feedback-detail">{formErrors.general}</p>
            )}
          </div>
        )}

        {!activationState?.verified && (
          <form className="activation__form" onSubmit={handleValidateCardholder} noValidate>
            <div className="activation__field">
              <label htmlFor="tarjetaNumero">Número de tarjeta</label>
              <input
                id="tarjetaNumero"
                type="text"
                value={tarjetaNumero}
                onChange={(event) => {
                  setTarjetaNumero(event.target.value.toUpperCase());
                  if (formErrors.tarjetaNumero) {
                    setFormErrors((current) => ({ ...current, tarjetaNumero: undefined }));
                  }
                }}
                placeholder="TJ-000123"
                autoCapitalize="characters"
                autoCorrect="off"
                autoComplete="off"
                disabled={isBusy}
                required
              />
              {formErrors.tarjetaNumero && <p className="activation__error">{formErrors.tarjetaNumero}</p>}
            </div>

            <div className="activation__field">
              <label htmlFor="curp">CURP</label>
              <input
                id="curp"
                type="text"
                value={curp}
                onChange={(event) => {
                  setCurp(event.target.value.toUpperCase());
                  if (formErrors.curp) {
                    setFormErrors((current) => ({ ...current, curp: undefined }));
                  }
                }}
                placeholder="INGR000000HDFXXX00"
                maxLength={18}
                pattern="[A-Z0-9]{18}"
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                disabled={isBusy}
                required
              />
              <p className="activation__hint">La CURP solo se usa para validar tu tarjeta y no se almacena.</p>
              {formErrors.curp && <p className="activation__error">{formErrors.curp}</p>}
            </div>

            <button type="submit" className="activation__submit" disabled={isBusy}>
              {uiState === 'validating' ? 'Validando...' : 'Validar datos'}
            </button>
          </form>
        )}

        {activationState?.verified && (
          <>
            <div className="activation__summary" aria-live="polite">
              <p>
                <strong>Tarjeta validada:</strong> {activationState.tarjetaNumero}
              </p>
              <p>Ya puedes crear tu acceso con correo y contraseña.</p>
            </div>

            <form className="activation__form" onSubmit={handleCompleteActivation} noValidate>
              <div className="activation__field">
                <label htmlFor="email">Correo</label>
                <input
                  id="email"
                  type="email"
                  value={credentials.email}
                  onChange={(event) => updateCredential('email', event.target.value)}
                  placeholder="tu_correo@ejemplo.com"
                  autoComplete="email"
                  disabled={isBusy}
                  required
                />
                {formErrors.email && <p className="activation__error">{formErrors.email}</p>}
              </div>

              <div className="activation__field">
                <label htmlFor="password">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={credentials.password}
                  onChange={(event) => updateCredential('password', event.target.value)}
                  placeholder="Crea una contraseña segura"
                  autoComplete="new-password"
                  disabled={isBusy}
                  required
                />
                <p className="activation__hint">
                  Usa entre {PASSWORD_MIN_LENGTH} y {PASSWORD_MAX_LENGTH} caracteres, con mayuscula, minuscula y numero.
                </p>
                {formErrors.password && <p className="activation__error">{formErrors.password}</p>}
              </div>

              <div className="activation__field">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={credentials.confirmPassword}
                  onChange={(event) => updateCredential('confirmPassword', event.target.value)}
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  disabled={isBusy}
                  required
                />
                {formErrors.confirmPassword && (
                  <p className="activation__error">{formErrors.confirmPassword}</p>
                )}
              </div>

              <button type="submit" className="activation__submit" disabled={isBusy}>
                {uiState === 'creating_account' ? 'Activando cuenta...' : 'Crear mi acceso'}
              </button>
            </form>
          </>
        )}

        <div className="activation__actions">
          <Link to="/login">Ir a login</Link>
          <Link to="/forgot-password">Recuperar acceso</Link>
          {RECOVERABLE_STATES.includes(uiState) && (
            <button type="button" className="activation__reset" onClick={handleResetActivation}>
              Reiniciar activacion
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default Activation;
