import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Snackbar, { SnackbarMessage } from '../components/Snackbar';
import { cardholderApi } from '../lib/api/cardholders';
import { normalizeCurp, isValidCurp } from '../lib/curp';
import { isApiError } from '../lib/apiClient';
import './CardholderLookup.css';

const CardholderLookup = () => {
  const [curp, setCurp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const navigate = useNavigate();

  const normalizedCurp = useMemo(() => normalizeCurp(curp), [curp]);
  const isCurpValid = useMemo(() => isValidCurp(curp), [curp]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isCurpValid) {
      setSnackbar({
        message: 'Revisa tu CURP. Debe coincidir con el formato oficial.',
        variant: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    setSnackbar(null);

    try {
      const lookup = await cardholderApi.lookupCurp(normalizedCurp);

      if (lookup.hasAccount) {
        setSnackbar({
          message: 'Esta tarjeta ya tiene usuario activo. Inicia sesión o recupera tu acceso.',
          variant: 'info',
        });
        return;
      }

      navigate('/registro/tarjeta-fisica/crear-usuario', { state: { lookup } });
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        navigate('/registro', {
          state: {
            snackbar: {
              message: 'No encontramos tu CURP. Regístrate para solicitar tu tarjeta.',
              variant: 'info',
            },
          },
        });
        return;
      }

      const message =
        isApiError(error) && error.message ? error.message : 'No pudimos validar tu CURP. Inténtalo de nuevo.';
      setSnackbar({ message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="cardholder-lookup" aria-labelledby="cardholder-lookup-title">
      <section className="cardholder-lookup__card">
        <p className="cardholder-lookup__step">Paso 1 de 2</p>
        <h1 id="cardholder-lookup-title">Valida tu tarjeta física</h1>
        <p className="cardholder-lookup__description">
          Ingresa tu CURP para confirmar que ya cuentas con una Tarjeta Joven física activa.
        </p>

        <form className="cardholder-lookup__form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="curp">CURP</label>
          <input
            id="curp"
            type="text"
            value={curp}
            inputMode="text"
            placeholder="INGR000000HDFXXX00"
            onChange={(event) => setCurp(event.target.value.toUpperCase())}
            maxLength={18}
            pattern="[A-Z0-9]{18}"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            required
          />
          <p className="cardholder-lookup__hint">Escribe los 18 caracteres tal como aparecen en tu credencial.</p>
          {curp && !isCurpValid && (
            <p className="cardholder-lookup__error">Revisa tu CURP. Debe coincidir con el formato oficial.</p>
          )}
          <button type="submit" className="cardholder-lookup__submit" disabled={!isCurpValid || isSubmitting}>
            {isSubmitting ? 'Validando...' : 'Continuar'}
          </button>
        </form>

        <div className="cardholder-lookup__links">
          <Link to="/login">Volver al login</Link>
          <Link to="/registro">Quiero registrarme</Link>
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

export default CardholderLookup;
