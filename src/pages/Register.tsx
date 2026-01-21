import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import InputFile from '../components/InputFile';
import Snackbar, { SnackbarMessage } from '../components/Snackbar';
import { cardholderApi } from '../lib/api/cardholders';
import { identityValidationApi } from '../lib/api/identityValidation';
import { isApiError } from '../lib/apiClient';
import { normalizeCurp } from '../lib/curp';
import { isSecurePassword, isValidEmail } from '../lib/validators';
import './Register.css';

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_MAX_LENGTH = 254;
const STREET_MAX_LENGTH = 80;
const COLONY_MAX_LENGTH = 80;
const HOUSE_NUMBER_MAX_LENGTH = 10;
const POSTAL_CODE_REGEX = /^\d{5}$/;
const HOUSE_NUMBER_REGEX = /^[0-9]{1,5}[A-Z0-9\-]{0,4}$/;
const fileAccept = '.jpg,.jpeg,.png,.pdf';

const stepTitles = ['Validacion de identidad', 'Confirma tus datos', 'Crea tu cuenta'];

type IdentityData = {
  nombres: string;
  apellidos: string;
  fechaNacimiento: string;
  curp: string;
  calle: string;
  numero: string;
  cp: string;
  colonia: string;
};

type AccountData = {
  username: string;
  password: string;
  aceptaTerminos: boolean;
};

type FileFieldState = {
  file: File | null;
  error: string;
};

type DocumentFilesState = {
  front: FileFieldState;
  back: FileFieldState;
};

type AddressErrors = {
  calle: string;
  numero: string;
  cp: string;
  colonia: string;
};

type AccountErrors = {
  username: string;
  password: string;
  aceptaTerminos: string;
};

type AddressField = keyof Pick<IdentityData, 'calle' | 'numero' | 'cp' | 'colonia'>;

const createInitialDocumentState = (): DocumentFilesState => ({
  front: { file: null, error: '' },
  back: { file: null, error: '' },
});

const emptyAddressErrors: AddressErrors = {
  calle: '',
  numero: '',
  cp: '',
  colonia: '',
};

const emptyAccountErrors: AccountErrors = {
  username: '',
  password: '',
  aceptaTerminos: '',
};

const Register = () => {
  const [identityData, setIdentityData] = useState<IdentityData | null>(null);
  const [accountData, setAccountData] = useState<AccountData>({
    username: '',
    password: '',
    aceptaTerminos: false,
  });
  const [documents, setDocuments] = useState<DocumentFilesState>(() => createInitialDocumentState());
  const [addressErrors, setAddressErrors] = useState<AddressErrors>(emptyAddressErrors);
  const [accountErrors, setAccountErrors] = useState<AccountErrors>(emptyAccountErrors);
  const [allowAddressEdit, setAllowAddressEdit] = useState(false);
  const [acceptsPrivacy, setAcceptsPrivacy] = useState(false);
  const [privacyTouched, setPrivacyTouched] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [snackbar, setSnackbar] = useState<SnackbarMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileResetKey, setFileResetKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const locationSnackbar = (location.state as { snackbar?: SnackbarMessage } | null)?.snackbar;

  useEffect(() => {
    if (locationSnackbar) {
      setSnackbar(locationSnackbar);
      navigate(location.pathname, { replace: true, state: undefined });
    }
  }, [locationSnackbar, location.pathname, navigate]);

  const validateText = (value: string) => value.trim().length >= 2;
  const validatePostalCode = (value: string) => POSTAL_CODE_REGEX.test(value.trim());
  const validateStreetNumber = (value: string) => {
    const normalized = value.trim();
    if (!normalized) {
      return false;
    }
    if (normalized.toUpperCase() === 'S/N') {
      return true;
    }
    const compact = normalized.replace(/\s+/g, '').toUpperCase();
    return HOUSE_NUMBER_REGEX.test(compact);
  };

  const validateFile = (file: File | null) => {
    if (!file) {
      return 'Este archivo es obligatorio.';
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return 'Formato no valido. Usa JPG, PNG o PDF.';
    }

    if (file.size > 2 * 1024 * 1024) {
      return 'Maximo 2 MB por archivo.';
    }

    return '';
  };

  const handleFileChange = (key: keyof DocumentFilesState, file: File | null) => {
    setStatusMessage('');
    setDocuments((prev) => {
      const errorMessage = file ? validateFile(file) : 'Este archivo es obligatorio.';
      return {
        ...prev,
        [key]: { file: errorMessage ? null : file, error: errorMessage },
      };
    });
  };

  const handleAddressChange = (field: AddressField, value: string) => {
    if (!identityData) {
      return;
    }

    setStatusMessage('');
    setIdentityData({
      ...identityData,
      [field]: value,
    });
  };

  const handleAccountChange = <K extends keyof AccountData>(field: K, value: AccountData[K]) => {
    setStatusMessage('');
    setAccountErrors(emptyAccountErrors);
    setAccountData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetAll = () => {
    setIdentityData(null);
    setAccountData({ username: '', password: '', aceptaTerminos: false });
    setDocuments(createInitialDocumentState());
    setAddressErrors(emptyAddressErrors);
    setAccountErrors(emptyAccountErrors);
    setAllowAddressEdit(false);
    setAcceptsPrivacy(false);
    setPrivacyTouched(false);
    setFileResetKey((value) => value + 1);
    setCurrentStep(0);
  };

  const handleDocumentUpload = async () => {
    const frontFile = documents.front.file;
    const backFile = documents.back.file;
    const frontError = validateFile(frontFile);
    const backError = validateFile(backFile);

    setDocuments((prev) => ({
      front: { file: frontError ? null : frontFile, error: frontError },
      back: { file: backError ? null : backFile, error: backError },
    }));
    setPrivacyTouched(true);

    if (frontError || backError) {
      setStatusMessage('Adjunta los archivos obligatorios.');
      return;
    }

    if (!acceptsPrivacy) {
      setStatusMessage('Debes aceptar el Aviso de privacidad.');
      return;
    }

    if (!frontFile || !backFile) {
      setStatusMessage('Adjunta las imagenes de la INE.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Validando INE...');
    setSnackbar(null);

    try {
      const response = await identityValidationApi.verifyIne({
        ineFront: frontFile,
        ineBack: backFile,
        acceptsPrivacy,
      });

      setIdentityData({
        nombres: response.nombres,
        apellidos: response.apellidos,
        fechaNacimiento: response.fechaNacimiento,
        curp: response.curp,
        calle: response.calle,
        numero: response.numero,
        cp: response.cp,
        colonia: response.colonia,
      });
      setAllowAddressEdit(false);
      setAddressErrors(emptyAddressErrors);
      setStatusMessage('Informacion detectada. Revisa los datos antes de continuar.');
      setCurrentStep(1);
    } catch (error) {
      const message =
        isApiError(error) && error.message
          ? error.message
          : error instanceof Error
            ? error.message
            : 'No pudimos validar tu INE. Intenta de nuevo.';
      setStatusMessage(message);
      setSnackbar({ message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmIdentityStep = () => {
    if (!identityData) {
      setStatusMessage('Primero sube tu INE.');
      return;
    }

    if (allowAddressEdit) {
      const nextErrors: AddressErrors = {
        calle: validateText(identityData.calle) ? '' : 'Escribe la calle donde vives.',
        numero: validateStreetNumber(identityData.numero) ? '' : 'Ingresa un numero exterior valido (usa S/N si aplica).',
        cp: validatePostalCode(identityData.cp) ? '' : 'El codigo postal debe tener 5 digitos.',
        colonia: validateText(identityData.colonia) ? '' : 'Escribe tu colonia.',
      };

      setAddressErrors(nextErrors);

      if (Object.values(nextErrors).some(Boolean)) {
        setStatusMessage('Corrige tu domicilio para continuar.');
        return;
      }
    } else {
      setAddressErrors(emptyAddressErrors);
    }

    setStatusMessage('');
    setCurrentStep(2);
  };

  const handleAccountSubmit = async () => {
    if (!identityData) {
      setStatusMessage('Valida tu identidad antes de crear la cuenta.');
      return;
    }

    const nextErrors: AccountErrors = {
      username: isValidEmail(accountData.username) ? '' : 'Escribe un correo valido.',
      password: isSecurePassword(accountData.password, PASSWORD_MIN_LENGTH)
        ? ''
        : 'Tu contrasena debe tener minimo 8 caracteres con mayusculas, minusculas y numeros.',
      aceptaTerminos: accountData.aceptaTerminos ? '' : 'Acepta los Terminos de uso y el Aviso de privacidad.',
    };

    setAccountErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      setStatusMessage('Revisa los campos marcados.');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Creando tu cuenta...');
    setSnackbar(null);

    try {
      await cardholderApi.submitRegistration({
        nombres: identityData.nombres,
        apellidos: identityData.apellidos,
        fechaNacimiento: identityData.fechaNacimiento,
        curp: normalizeCurp(identityData.curp),
        calle: identityData.calle,
        numero: identityData.numero,
        cp: identityData.cp,
        colonia: identityData.colonia,
        username: accountData.username.trim().toLowerCase(),
        password: accountData.password,
        aceptaTerminos: accountData.aceptaTerminos,
      });

      setSnackbar({
        message: 'Recibimos tu registro. Te contactaremos al validar tus documentos.',
        variant: 'success',
      });
      setStatusMessage('Listo. Te avisaremos por correo cuando activemos tu Tarjeta Joven.');
      resetAll();
    } catch (error) {
      const message =
        isApiError(error) && error.message ? error.message : 'No pudimos crear tu cuenta. Intenta nuevamente.';
      setStatusMessage(message);
      setSnackbar({ message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep === 0) {
      await handleDocumentUpload();
      return;
    }

    if (currentStep === 1) {
      confirmIdentityStep();
      return;
    }

    await handleAccountSubmit();
  };

  const goBack = () => {
    if (currentStep === 0) {
      return;
    }
    setStatusMessage('');
    setCurrentStep((step) => Math.max(step - 1, 0));
  };

  const progress = ((currentStep + 1) / stepTitles.length) * 100;
  const privacyError = privacyTouched && !acceptsPrivacy ? 'Debes aceptar el Aviso de privacidad.' : '';

  const getSubmitLabel = () => {
    if (currentStep === 0) {
      return isSubmitting ? 'Validando INE...' : 'Enviar documentos';
    }
    if (currentStep === 1) {
      return 'Confirmar y continuar';
    }
    return isSubmitting ? 'Creando cuenta...' : 'Crear mi cuenta';
  };

  const isSubmitDisabled = currentStep === 1 ? !identityData : isSubmitting;

  const renderDocumentStep = () => (
    <fieldset className="register__fieldset">
      <legend>Validacion de identidad</legend>
      <InputFile
        key={`ine-front-${fileResetKey}`}
        label="INE - frente"
        accept={fileAccept}
        required
        helperText="JPG, PNG o PDF. Maximo 2 MB."
        error={documents.front.error}
        onFileSelect={(file) => handleFileChange('front', file)}
      />
      <InputFile
        key={`ine-back-${fileResetKey}`}
        label="INE - reverso"
        accept={fileAccept}
        required
        helperText="JPG, PNG o PDF. Maximo 2 MB."
        error={documents.back.error}
        onFileSelect={(file) => handleFileChange('back', file)}
      />
      <div className={`register__checkbox ${privacyError ? 'is-invalid' : ''}`}>
        <input
          id="privacyAcceptance"
          name="privacyAcceptance"
          type="checkbox"
          checked={acceptsPrivacy}
          onChange={(event) => {
            setPrivacyTouched(true);
            setStatusMessage('');
            setAcceptsPrivacy(event.target.checked);
          }}
          required
        />
        <label htmlFor="privacyAcceptance">
          Acepto el <a href="#privacidad">Aviso de privacidad</a> para validar mi identidad.
        </label>
      </div>
      {privacyError && <p className="register__error">{privacyError}</p>}
    </fieldset>
  );

  const renderReviewStep = () => (
    <fieldset className="register__fieldset">
      <legend>Confirma tus datos</legend>
      {!identityData ? (
        <p>Sube tus documentos para mostrar la informacion detectada.</p>
      ) : (
        <>
          <div className="register__grid">
            <div className="register__field">
              <label htmlFor="nombres">Nombre(s)</label>
              <input id="nombres" type="text" value={identityData.nombres} disabled />
            </div>
            <div className="register__field">
              <label htmlFor="apellidos">Apellidos</label>
              <input id="apellidos" type="text" value={identityData.apellidos} disabled />
            </div>
            <div className="register__field">
              <label htmlFor="fechaNacimiento">Fecha de nacimiento</label>
              <input id="fechaNacimiento" type="text" value={identityData.fechaNacimiento} disabled />
            </div>
            <div className="register__field">
              <label htmlFor="curp">CURP</label>
              <input id="curp" type="text" value={identityData.curp} disabled />
            </div>
          </div>
          <div className="register__checkbox">
            <input
              id="allowAddressEdit"
              name="allowAddressEdit"
              type="checkbox"
              checked={allowAddressEdit}
              onChange={(event) => {
                setAllowAddressEdit(event.target.checked);
                setAddressErrors(emptyAddressErrors);
                setStatusMessage('');
              }}
            />
            <label htmlFor="allowAddressEdit">Quiero corregir mi domicilio</label>
          </div>
          <div className="register__grid">
            <div className={`register__field ${allowAddressEdit && addressErrors.calle ? 'is-invalid' : ''}`}>
              <label htmlFor="calle">Calle</label>
              <input
                id="calle"
                name="calle"
                type="text"
                value={identityData.calle}
                onChange={(event) => handleAddressChange('calle', event.target.value)}
                maxLength={STREET_MAX_LENGTH}
                disabled={!allowAddressEdit}
              />
              {allowAddressEdit && addressErrors.calle && <p className="register__error">{addressErrors.calle}</p>}
            </div>
            <div className={`register__field ${allowAddressEdit && addressErrors.numero ? 'is-invalid' : ''}`}>
              <label htmlFor="numero">Numero exterior</label>
              <input
                id="numero"
                name="numero"
                type="text"
                value={identityData.numero}
                onChange={(event) => handleAddressChange('numero', event.target.value)}
                maxLength={HOUSE_NUMBER_MAX_LENGTH}
                disabled={!allowAddressEdit}
              />
              {allowAddressEdit && addressErrors.numero && <p className="register__error">{addressErrors.numero}</p>}
            </div>
            <div className={`register__field ${allowAddressEdit && addressErrors.cp ? 'is-invalid' : ''}`}>
              <label htmlFor="cp">Codigo postal</label>
              <input
                id="cp"
                name="cp"
                type="text"
                inputMode="numeric"
                maxLength={5}
                pattern="[0-9]{5}"
                value={identityData.cp}
                onChange={(event) => handleAddressChange('cp', event.target.value)}
                disabled={!allowAddressEdit}
              />
              {allowAddressEdit && addressErrors.cp && <p className="register__error">{addressErrors.cp}</p>}
            </div>
            <div className={`register__field ${allowAddressEdit && addressErrors.colonia ? 'is-invalid' : ''}`}>
              <label htmlFor="colonia">Colonia</label>
              <input
                id="colonia"
                name="colonia"
                type="text"
                value={identityData.colonia}
                onChange={(event) => handleAddressChange('colonia', event.target.value)}
                maxLength={COLONY_MAX_LENGTH}
                disabled={!allowAddressEdit}
              />
              {allowAddressEdit && addressErrors.colonia && <p className="register__error">{addressErrors.colonia}</p>}
            </div>
          </div>
          <p>Confirma que los datos sean correctos antes de continuar.</p>
        </>
      )}
    </fieldset>
  );

  const renderAccountStep = () => (
    <fieldset className="register__fieldset">
      <legend>Crea tu cuenta</legend>
      {!identityData && <p>Valida tu INE antes de crear la cuenta.</p>}
      <div className={`register__field ${accountErrors.username ? 'is-invalid' : ''}`}>
        <label htmlFor="username">Correo electronico</label>
        <input
          id="username"
          name="username"
          type="email"
          value={accountData.username}
          onChange={(event) => handleAccountChange('username', event.target.value)}
          placeholder="correo@dominio.com"
          inputMode="email"
          autoComplete="username"
          maxLength={EMAIL_MAX_LENGTH}
          required
        />
        {accountErrors.username && <p className="register__error">{accountErrors.username}</p>}
      </div>
      <div className={`register__field ${accountErrors.password ? 'is-invalid' : ''}`}>
        <label htmlFor="password">Contrasena</label>
        <input
          id="password"
          name="password"
          type="password"
          value={accountData.password}
          onChange={(event) => handleAccountChange('password', event.target.value)}
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={PASSWORD_MAX_LENGTH}
          placeholder="********"
          autoComplete="new-password"
          required
        />
        {accountErrors.password && <p className="register__error">{accountErrors.password}</p>}
      </div>
      <div className={`register__checkbox ${accountErrors.aceptaTerminos ? 'is-invalid' : ''}`}>
        <input
          id="aceptaTerminos"
          name="aceptaTerminos"
          type="checkbox"
          checked={accountData.aceptaTerminos}
          onChange={(event) => handleAccountChange('aceptaTerminos', event.target.checked)}
          required
        />
        <label htmlFor="aceptaTerminos">
          Acepto los <a href="#terminos">Terminos de uso</a> y el <a href="#privacidad">Aviso de privacidad</a>.
        </label>
      </div>
      {accountErrors.aceptaTerminos && <p className="register__error">{accountErrors.aceptaTerminos}</p>}
    </fieldset>
  );

  const renderCurrentStep = () => {
    if (currentStep === 0) return renderDocumentStep();
    if (currentStep === 1) return renderReviewStep();
    return renderAccountStep();
  };

  return (
    <main className="register" aria-labelledby="register-title">
      <header className="register__header">
        <h1 id="register-title">Registrate en Tarjeta Joven</h1>
        <p>Sube tu INE, confirma tus datos y crea tu cuenta digital en minutos.</p>
      </header>
      {snackbar && (
        <Snackbar
          message={snackbar.message}
          variant={snackbar.variant}
          onClose={() => setSnackbar(null)}
        />
      )}
      <form className="register__form" onSubmit={handleSubmit} noValidate>
        <div className="register__progress" aria-live="polite">
          <div className="register__progress-bar">
            <div className="register__progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="register__steps">
            {stepTitles.map((title, index) => (
              <div
                key={title}
                className={`register__step${index === currentStep ? ' register__step--active' : ''}${
                  index < currentStep ? ' register__step--completed' : ''
                }`}
              >
                <span className="register__step-indicator">{index + 1}</span>
                <p>{title}</p>
              </div>
            ))}
          </div>
        </div>
        {renderCurrentStep()}
        <div className="register__actions">
          <button type="button" className="register__back" onClick={goBack} disabled={currentStep === 0}>
            Anterior
          </button>
          <div className="register__actions-right">
            <button type="submit" className="register__submit" disabled={isSubmitDisabled}>
              {getSubmitLabel()}
            </button>
            <p className="register__status" role="status" aria-live="polite">
              {statusMessage}
            </p>
          </div>
        </div>
      </form>
    </main>
  );
};

export default Register;
