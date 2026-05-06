import { Link } from 'react-router-dom';
import AppBrand from '../components/AppBrand';
import privacyNoticeContent from '../../AvisoPriv.md?raw';
import './PrivacyNotice.css';

const renderBlock = (block: string, index: number) => {
  if (block.startsWith('### ')) {
    return <h3 key={index}>{block.slice(4).trim()}</h3>;
  }

  if (block.startsWith('## ')) {
    return <h2 key={index}>{block.slice(3).trim()}</h2>;
  }

  if (block.startsWith('# ')) {
    return <h1 key={index}>{block.slice(2).trim()}</h1>;
  }

  const lines = block
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.every((line) => line.startsWith('- '))) {
    return (
      <ul key={index}>
        {lines.map((line) => (
          <li key={line}>{line.slice(2).trim()}</li>
        ))}
      </ul>
    );
  }

  return <p key={index}>{lines.join(' ')}</p>;
};

const PrivacyNotice = () => {
  const blocks = privacyNoticeContent
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <main className="privacy-notice" aria-labelledby="privacy-notice-title">
      <AppBrand className="privacy-notice__brand" caption="Información institucional" />

      <section className="privacy-notice__card surface-card" aria-labelledby="privacy-notice-title">
        <div className="page-header">
          <p className="page-header__eyebrow">Transparencia</p>
          <h1 id="privacy-notice-title" className="page-header__title">
            Aviso de privacidad
          </h1>
        </div>

        <article className="privacy-notice__content">
          {blocks.length > 0 ? (
            blocks.map((block, index) => renderBlock(block, index))
          ) : (
            <p>No hay contenido disponible por el momento.</p>
          )}
        </article>

        <div className="privacy-notice__actions">
          <Link to="/activar" className="secondary-button">
            Volver a activación
          </Link>
        </div>
      </section>
    </main>
  );
};

export default PrivacyNotice;
