import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cardholderApi } from '../lib/api/cardholders';
import { clearPendingActivation, getPendingActivation, persistPendingActivation } from '../lib/authFlow';
import { normalizeCurp, isValidCurp } from '../lib/curp';
import {
  ActivationErrorKind,
  getActivationErrorKind,
  getRequestErrorMessage,
  isSessionExpiredError,
} from '../lib/requestErrors';
import { useAuth } from '../lib/useAuth';
import { isSecurePassword, isValidEmail } from '../lib/validators';
import './Activation.css';

type ActivationUiState =
  | 'idle'
  | 'validating'
  | 'validated'
  | 'creating_access'
  | 'linking_account'
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
  const {
    signupWithCredentials,
    loginWithCredentials,
    refreshProfile,
    clearErrorMessage,
    logout,
  } = useAuth();

  const [tarjetaNumero, setTarjetaNumero] = useState('');
  const [curp, setCurp] = useState('');
  const [credentials, setCredentials] = useState<ActivationCredentials>(INITIAL_CREDENTIALS);
  const [activationState, setActivationState] = useState(() => getPendingActivation());
  const [uiState, setUiState] = useState<ActivationUiState>(() =>
    getPendingActivation() ? 'validated' : 'idle',
  );
  const [formErrors, setFormErrors] = useState<ActivationFormErrors>({});
  const [accessStepStarted, setAccessStepStarted] = useState(false);

  const normalizedTarjeta = useMemo(() => tarjetaNumero.trim().toUpperCase(), [tarjetaNumero]);
  const normalizedCurp = useMemo(() => normalizeCurp(curp), [curp]);
  const normalizedEmail = useMemo(() => credentials.email.trim().toLowerCase(), [credentials.email]);
  const isBusy = uiState === 'validating' || uiState === 'creating_access' || uiState === 'linking_account';

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
    if (uiState === 'linking_account' || uiState === 'success' || uiState === 'already_linked') {
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
      nextErrors.tarjetaNumero = 'Ingresa el numero de tarjeta.';
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
      nextErrors.password = 'Crea una contrasena.';
    } else if (!isSecurePassword(credentials.password)) {
      nextErrors.password = 'Usa al menos 8 caracteres, con mayuscula, minuscula y numero.';
    }

    if (!credentials.confirmPassword) {
      nextErrors.confirmPassword = 'Confirma tu contrasena.';
    } else if (credentials.confirmPassword !== credentials.password) {
      nextErrors.confirmPassword = 'Las contrasenas no coinciden.';
    }

    return nextErrors;
  };

  const applyActivationError = async (
    error: unknown,
    options?: { fallbackMessage?: string; clearAccessSession?: boolean },
  ) => {
    const errorKind = getActivationErrorKind(error);
    if (options?.clearAccessSession || isSessionExpiredError(error)) {
      await logout();
    }

    const nextState: Record<ActivationErrorKind, ActivationUiState> = {
      already_linked: 'already_linked',
      blocked: 'blocked',
      invalid: 'invalid',
      session_expired: 'error',
      error: 'error',
    };

    if (errorKind === 'invalid' || errorKind === 'blocked' || errorKind === 'error') {
      setAccessStepStarted(false);
    }

    setUiState(nextState[errorKind]);
    setFormErrors({
      general: getRequestErrorMessage(error, {
        fallbackMessage: options?.fallbackMessage,
        useGenericActivationError: true,
      }),
    });
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
      const response = await cardholderApi.verifyActivation({
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
      setAccessStepStarted(false);
      setUiState('validated');
      setFormErrors({
        general: 'Tarjeta validada correctamente. Ahora crea tu acceso con correo y contrasena.',
      });
    } catch (error) {
      clearPendingActivation();
      setActivationState(null);
      await applyActivationError(error, {
        fallbackMessage: 'No se pudo validar la tarjeta con los datos proporcionados.',
      });
    }
  };

  const handleStartSignup = () => {
    clearErrorMessage();
    setAccessStepStarted(true);
    setUiState('validated');
    setFormErrors({});
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
    setUiState('creating_access');

    try {
      await signupWithCredentials(normalizedEmail, credentials.password);
    } catch (signupError) {
      const message = signupError instanceof Error ? signupError.message : 'No pudimos crear tu acceso.';
      setUiState('validated');
      setAccessStepStarted(true);
      setFormErrors({
        ...(message.toLowerCase().includes('correo') ? { email: message } : { general: message }),
      });
      return;
    }

    try {
      const session = await loginWithCredentials(normalizedEmail, credentials.password);
      setUiState('linking_account');

      await cardholderApi.completeActivation({
        tarjetaNumero: activationState.tarjetaNumero,
        auth0IdToken: session.idToken,
      });

      clearPendingActivation();
      setActivationState(null);
      setUiState('success');
      setFormErrors({
        general: 'Cuenta vinculada correctamente. Estamos cargando tu perfil.',
      });
      await refreshProfile();
      navigate('/perfil', { replace: true });
    } catch (error) {
      clearPendingActivation();
      setActivationState(null);
      await applyActivationError(error, {
        fallbackMessage: 'No pudimos vincular tu cuenta. Intenta de nuevo.',
        clearAccessSession: true,
      });
    }
  };

  const handleResetActivation = async () => {
    clearPendingActivation();
    clearErrorMessage();
    setTarjetaNumero('');
    setCurp('');
    setCredentials(INITIAL_CREDENTIALS);
    setActivationState(null);
    setAccessStepStarted(false);
    setUiState('idle');
    clearFormErrors();
    await logout();
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
        return accessStepStarted
          ? 'Completa tu correo y contrasena para crear tu acceso.'
          : 'Tarjeta validada correctamente. Ahora crea tu acceso con correo y contrasena.';
      case 'creating_access':
        return 'Estamos creando tu acceso.';
      case 'linking_account':
        return 'Estamos vinculando tu cuenta con Tarjeta Joven.';
      case 'success':
        return 'Tu cuenta quedo vinculada correctamente.';
      case 'already_linked':
        return 'Esta tarjeta ya tiene una cuenta asociada. Inicia sesion para continuar.';
      case 'blocked':
        return 'Esta tarjeta no esta activa. Acude a soporte.';
      case 'invalid':
        return 'Los datos no coinciden. Verifica tu numero de tarjeta y CURP.';
      case 'error':
        return 'No pudimos completar la activacion. Revisa el mensaje y vuelve a intentarlo.';
      default:
        return 'Valida tus datos para continuar con tu activacion.';
    }
  })();

  return (
    <main className="activation" aria-labelledby="activation-title">
      <section className="activation__card">
        <p className="activation__step">Activacion guiada</p>
        <h1 id="activation-title">Activa tu Tarjeta Joven</h1>
        <p className="activation__description">
          Sigue estos pasos para validar tu tarjeta, crear tu acceso y entrar a tu perfil digital.
        </p>

        <ol className="activation__stepper" aria-label="Pasos de activacion">
          {[
            'Validar datos',
            'Crear acceso',
            'Vincular cuenta',
          ].map((stepLabel, index) => {
            const stepNumber = index + 1;
            const isActive = currentStep === stepNumber;
            const isComplete = currentStep > stepNumber || (uiState === 'success' && stepNumber === 3);

            return (
              <li
                key={stepLabel}
                className={`activation__stepper-item${isActive ? ' activation__stepper-item--active' : ''}${
                  isComplete ? ' activation__stepper-item--complete' : ''
                }`}
              >
                <span className="activation__stepper-index" aria-hidden="true">
                  {stepNumber}
                </span>
                <span>{stepLabel}</span>
              </li>
            );
          })}
        </ol>

        <div className={`activation__feedback activation__feedback--${uiState}`} role="status" aria-live="polite">
          <p>{statusText}</p>
          {formErrors.general && formErrors.general !== statusText && (
            <p className="activation__feedback-detail">{formErrors.general}</p>
          )}
        </div>

        {!activationState?.verified && (
          <form className="activation__form" onSubmit={handleValidateCardholder} noValidate>
            <div className="activation__field">
              <label htmlFor="tarjetaNumero">Numero de tarjeta</label>
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
              <p>Ya puedes crear tu acceso con correo y contrasena.</p>
            </div>

            {!accessStepStarted && uiState === 'validated' && (
              <button type="button" className="activation__submit" onClick={handleStartSignup}>
                Crear mi acceso
              </button>
            )}

            {accessStepStarted && (
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
                  <label htmlFor="password">Contrasena</label>
                  <input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(event) => updateCredential('password', event.target.value)}
                    placeholder="Crea una contrasena segura"
                    autoComplete="new-password"
                    disabled={isBusy}
                    required
                  />
                  <p className="activation__hint">
                    Usa minimo 8 caracteres, con mayuscula, minuscula y numero.
                  </p>
                  {formErrors.password && <p className="activation__error">{formErrors.password}</p>}
                </div>

                <div className="activation__field">
                  <label htmlFor="confirmPassword">Confirmar contrasena</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={credentials.confirmPassword}
                    onChange={(event) => updateCredential('confirmPassword', event.target.value)}
                    placeholder="Repite tu contrasena"
                    autoComplete="new-password"
                    disabled={isBusy}
                    required
                  />
                  {formErrors.confirmPassword && (
                    <p className="activation__error">{formErrors.confirmPassword}</p>
                  )}
                </div>

                <button type="submit" className="activation__submit" disabled={isBusy}>
                  {uiState === 'creating_access'
                    ? 'Creando acceso...'
                    : uiState === 'linking_account'
                    ? 'Vinculando cuenta...'
                    : 'Crear mi acceso'}
                </button>
              </form>
            )}
          </>
        )}

        <div className="activation__actions">
          <Link to="/login">Ir a login</Link>
          <Link to="/migrar-cuenta">Ya tenia una cuenta local</Link>
          {RECOVERABLE_STATES.includes(uiState) && (
            <button type="button" className="activation__reset" onClick={() => void handleResetActivation()}>
              Reiniciar activacion
            </button>
          )}
        </div>
      </section>
    </main>
  );
};

export default Activation;
