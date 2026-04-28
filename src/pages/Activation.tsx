import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Snackbar, { SnackbarMessage } from '../components/Snackbar';
import { cardholderApi } from '../lib/api/cardholders';
import { clearPendingActivation, getPendingActivation, ActivationState } from '../lib/authFlow';
import { normalizeCurp, isValidCurp } from '../lib/curp';
import {
  getRequestErrorMessage,
  isAccountAlreadyLinkedError,
  isSessionExpiredError,
} from '../lib/requestErrors';
import { useAuth } from '../lib/useAuth';
import './Activation.css';

type ActivationUiState =
  | 'idle'
  | 'loading'
  | 'verified'
  | 'auth_pending'
  | 'completing'
  | 'success'
  | 'already_linked'
  | 'error';

const Activation = () => {
  const navigate = useNavigate();
  const {
    hasIdentitySession,
    isAuth0Ready,
    signupAfterActivation,
    getIdToken,
    refreshProfile,
    clearErrorMessage,
  } = useAuth();

  const [tarjetaNumero, setTarjetaNumero] = useState('');
  const [curp, setCurp] = useState('');
  const [activationState, setActivationState] = useState<ActivationState | null>(() => getPendingActivation());
  const [uiState, setUiState] = useState<ActivationUiState>(() =>
    getPendingActivation() ? 'auth_pending' : 'idle',
  );
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const completionStartedRef = useRef(false);

  const normalizedTarjeta = useMemo(() => tarjetaNumero.trim().toUpperCase(), [tarjetaNumero]);
  const normalizedCurp = useMemo(() => normalizeCurp(curp), [curp]);
  const isCurpValid = useMemo(() => isValidCurp(curp), [curp]);
  const canValidate =
    normalizedTarjeta.length > 0 &&
    isCurpValid &&
    uiState !== 'loading' &&
    uiState !== 'auth_pending' &&
    uiState !== 'completing';

  const finishProfileLoad = useCallback(async () => {
    await refreshProfile();
    navigate('/perfil', { replace: true });
  }, [navigate, refreshProfile]);

  const completeActivation = useCallback(
    async (state: ActivationState, idToken: string) => {
      setUiState('completing');
      clearErrorMessage();

      try {
        await cardholderApi.completeActivation({
          tarjetaNumero: state.tarjetaNumero,
          auth0IdToken: idToken,
        });
        clearPendingActivation();
        setActivationState(null);
        setUiState('success');
        setSnackbar({
          message: 'Cuenta vinculada correctamente. Estamos cargando tu perfil.',
          variant: 'success',
        });
        await finishProfileLoad();
      } catch (error) {
        if (isAccountAlreadyLinkedError(error)) {
          clearPendingActivation();
          setUiState('already_linked');
          setSnackbar({
            message: 'Esta tarjeta ya tiene una cuenta asociada.',
            variant: 'info',
          });
          return;
        }

        if (isSessionExpiredError(error)) {
          clearPendingActivation();
          setActivationState(null);
        }

        setUiState('error');
        setSnackbar({
          message: getRequestErrorMessage(error, {
            fallbackMessage: 'No pudimos completar la vinculacion. Intenta de nuevo.',
          }),
          variant: 'error',
        });
      }
    },
    [clearErrorMessage, finishProfileLoad],
  );

  useEffect(() => {
    const pendingActivation = getPendingActivation();
    if (!pendingActivation) {
      return;
    }

    setActivationState(pendingActivation);
    setTarjetaNumero(pendingActivation.tarjetaNumero);
  }, []);

  useEffect(() => {
    const pendingActivation = getPendingActivation();
    if (!pendingActivation) {
      return;
    }

    if (!isAuth0Ready) {
      setUiState('auth_pending');
      return;
    }

    if (!hasIdentitySession || completionStartedRef.current) {
      return;
    }

    completionStartedRef.current = true;
    setUiState('completing');

    void (async () => {
      try {
        const idToken = await getIdToken();
        if (!idToken) {
          throw new Error('No pudimos obtener tu token de identidad.');
        }

        await completeActivation(pendingActivation, idToken);
      } catch (error) {
        clearPendingActivation();
        setActivationState(null);
        setUiState('error');
        setSnackbar({
          message: getRequestErrorMessage(error, {
            fallbackMessage: 'No pudimos completar la activacion. Intenta de nuevo.',
          }),
          variant: 'error',
        });
      } finally {
        completionStartedRef.current = false;
      }
    })();
  }, [completeActivation, getIdToken, hasIdentitySession, isAuth0Ready]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedTarjeta) {
      setSnackbar({
        message: 'Ingresa el numero de tarjeta.',
        variant: 'error',
      });
      return;
    }

    if (!isCurpValid) {
      setSnackbar({
        message: 'Revisa tu CURP. Debe coincidir con el formato oficial.',
        variant: 'error',
      });
      return;
    }

    setUiState('loading');
    setSnackbar(null);
    clearErrorMessage();

    try {
      const response = await cardholderApi.verifyActivation({
        tarjetaNumero: normalizedTarjeta,
        curp: normalizedCurp,
      });

      if (!response.can_activate) {
        throw new Error('No se pudo validar la tarjeta con los datos proporcionados.');
      }

      const nextActivationState: ActivationState = {
        tarjetaNumero: normalizedTarjeta,
        verified: true,
      };

      setActivationState(nextActivationState);
      setCurp('');
      setUiState('verified');

      const signupResult = await signupAfterActivation(normalizedTarjeta);
      if (signupResult.mode === 'redirect' || !signupResult.idToken) {
        setUiState('auth_pending');
        return;
      }

      await completeActivation(nextActivationState, signupResult.idToken);
    } catch (error) {
      clearPendingActivation();
      setActivationState(null);
      setUiState(isAccountAlreadyLinkedError(error) ? 'already_linked' : 'error');
      setSnackbar({
        message: getRequestErrorMessage(error, {
          fallbackMessage: 'No se pudo validar la tarjeta con los datos proporcionados.',
          useGenericActivationError: true,
        }),
        variant: isAccountAlreadyLinkedError(error) ? 'info' : 'error',
      });
    }
  };

  const handleStartOver = () => {
    clearPendingActivation();
    completionStartedRef.current = false;
    setTarjetaNumero('');
    setCurp('');
    setActivationState(null);
    setUiState('idle');
    setSnackbar(null);
    clearErrorMessage();
  };

  const statusText = (() => {
    switch (uiState) {
      case 'loading':
        return 'Validando tarjeta y CURP...';
      case 'verified':
        return 'Datos validados. Abriendo Auth0 para crear tu acceso.';
      case 'auth_pending':
        return 'Estamos esperando que completes el acceso seguro con Auth0.';
      case 'completing':
        return 'Vinculando tu cuenta con Tarjeta Joven...';
      case 'success':
        return 'Cuenta vinculada.';
      case 'already_linked':
        return 'Esta tarjeta ya tiene una cuenta asociada.';
      case 'error':
        return 'Revisa el mensaje y vuelve a intentarlo.';
      default:
        return '';
    }
  })();

  return (
    <main className="activation" aria-labelledby="activation-title">
      <section className="activation__card">
        <p className="activation__step">Activacion segura</p>
        <h1 id="activation-title">Activa tu Tarjeta Joven</h1>
        <p className="activation__description">
          Ingresa tu numero de tarjeta y tu CURP para validar tu cuenta y vincularla con Auth0.
        </p>

        <form className="activation__form" onSubmit={handleSubmit} noValidate>
          <div className="activation__field">
            <label htmlFor="tarjetaNumero">Numero de tarjeta</label>
            <input
              id="tarjetaNumero"
              type="text"
              value={tarjetaNumero}
              onChange={(event) => setTarjetaNumero(event.target.value.toUpperCase())}
              placeholder="TJ-000123"
              autoCapitalize="characters"
              autoCorrect="off"
              autoComplete="off"
              disabled={uiState === 'loading' || uiState === 'auth_pending' || uiState === 'completing'}
              required
            />
          </div>

          <div className="activation__field">
            <label htmlFor="curp">CURP</label>
            <input
              id="curp"
              type="text"
              value={curp}
              onChange={(event) => setCurp(event.target.value.toUpperCase())}
              placeholder="INGR000000HDFXXX00"
              maxLength={18}
              pattern="[A-Z0-9]{18}"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              disabled={uiState === 'loading' || uiState === 'auth_pending' || uiState === 'completing'}
              required
            />
            <p className="activation__hint">La CURP se usa solo durante esta validacion y no se almacena.</p>
            {curp && !isCurpValid && (
              <p className="activation__error">Revisa tu CURP. Debe coincidir con el formato oficial.</p>
            )}
          </div>

          <button type="submit" className="activation__submit" disabled={!canValidate}>
            {uiState === 'loading' ? 'Validando...' : 'Validar datos'}
          </button>
        </form>

        {activationState?.verified && (
          <div className="activation__summary" aria-live="polite">
            <p>
              <strong>Tarjeta validada:</strong> {activationState.tarjetaNumero}
            </p>
          </div>
        )}

        {statusText && (
          <p className="activation__status" role="status" aria-live="polite">
            {statusText}
          </p>
        )}

        <div className="activation__actions">
          <Link to="/login">Ir a login</Link>
          <Link to="/migrar-cuenta">Ya tenia una cuenta local</Link>
          {(uiState === 'error' || uiState === 'already_linked' || uiState === 'auth_pending') && (
            <button type="button" className="activation__reset" onClick={handleStartOver}>
              Reiniciar activacion
            </button>
          )}
        </div>
      </section>

      {snackbar && (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onClose={() => setSnackbar(null)}
        />
      )}
    </main>
  );
};

export default Activation;
