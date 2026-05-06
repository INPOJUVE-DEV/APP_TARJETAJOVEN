import { FormEvent, useEffect, useMemo, useState } from 'react';
import { track } from '../lib/analytics';
import './Help.css';

type HelpCategory = 'program' | 'discounts' | 'support';

type FAQ = {
  id: string;
  category: HelpCategory;
  question: string;
  answer: string;
  details?: string[];
  links?: { label: string; url: string }[];
  tags?: string[];
};

const categories: { id: HelpCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'program', label: 'Programa' },
  { id: 'discounts', label: 'Descuentos' },
  { id: 'support', label: 'Soporte técnico' },
];

const faqs: FAQ[] = [
  {
    id: 'activation',
    category: 'program',
    question: '¿Quién puede activar la Tarjeta Joven desde la app?',
    answer: 'Personas que ya tienen una tarjeta física y necesitan vincular su acceso digital.',
    details: [
      'La app valida número de tarjeta y CURP.',
      'Después creas tu acceso con correo y contraseña.',
    ],
    tags: ['activacion', 'curp', 'tarjeta'],
  },
  {
    id: 'new-registration',
    category: 'program',
    question: '¿Puedo darme de alta por primera vez desde esta app?',
    answer: 'No. El alta oficial ya no se realiza desde la app.',
    details: [
      'Si aún no formas parte del programa, consulta los canales oficiales de Tarjeta Joven.',
      'La app solo ofrece activación de tarjeta y login para cuentas ya vinculadas.',
    ],
    tags: ['registro', 'alta'],
  },
  {
    id: 'digital-card',
    category: 'program',
    question: '¿La tarjeta es digital o física?',
    answer: 'Tu credencial digital se vincula a la tarjeta física y te sirve para mostrar beneficios.',
    details: ['Una vez vinculada, puedes entrar a tu perfil y mostrar tu QR.'],
    tags: ['credencial', 'perfil'],
  },
  {
    id: 'discounts-how',
    category: 'discounts',
    question: '¿Cómo uso un descuento en un aliado?',
    answer: 'Busca el comercio en el catálogo o en el mapa y presenta tu credencial digital al pagar.',
    details: ['Algunos beneficios tienen restricciones de horario o sucursal.'],
    tags: ['beneficios', 'mapa', 'catalogo'],
  },
  {
    id: 'password',
    category: 'support',
    question: 'Olvidé mi acceso. ¿Qué hago?',
    answer: 'Usa la opción de recuperación de contraseña desde la pantalla de login.',
    details: [
      'Recibirás un enlace para restablecer tu acceso si el correo existe y está habilitado.',
      'Si tu tarjeta aún no está vinculada, primero activa tu cuenta.',
    ],
    tags: ['password', 'recuperacion', 'acceso'],
  },
  {
    id: 'support',
    category: 'support',
    question: 'Necesito ayuda adicional, ¿con quién hablo?',
    answer: 'Usa los canales oficiales del programa o escribe desde la sección de ayuda institucional.',
    links: [
      {
        label: 'Mesa de ayuda Tarjeta Joven',
        url: 'https://www.instagram.com/inpojuve?igsh=MW9uc3E2eTkxcWU1bg==',
      },
    ],
    tags: ['contacto', 'soporte'],
  },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const Help = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | HelpCategory>('all');
  const [lastTrackedQuery, setLastTrackedQuery] = useState('');
  const [isOffline, setIsOffline] = useState(() => {
    if (typeof navigator === 'undefined') {
      return false;
    }

    return !navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStatusChange = () => {
      setIsOffline(!navigator.onLine);
    };

    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  const normalizedTerm = useMemo(() => normalizeText(searchTerm.trim()), [searchTerm]);
  const hasActiveFilters = activeCategory !== 'all' || normalizedTerm.length > 0;

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      if (activeCategory !== 'all' && faq.category !== activeCategory) {
        return false;
      }

      if (!normalizedTerm) {
        return true;
      }

      const searchable = [faq.question, faq.answer, ...(faq.details ?? []), ...(faq.tags ?? [])]
        .map((value) => normalizeText(value))
        .join(' ');

      return searchable.includes(normalizedTerm);
    });
  }, [activeCategory, normalizedTerm]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();

    if (!trimmed || trimmed === lastTrackedQuery) {
      return;
    }

    track('search', {
      origin: 'help',
      query: trimmed,
      category: activeCategory,
      results: filteredFaqs.length,
    });
    setLastTrackedQuery(trimmed);
  };

  const handleCategoryChange = (category: 'all' | HelpCategory) => {
    if (category === activeCategory) {
      return;
    }

    setActiveCategory(category);
    setLastTrackedQuery('');
    track('filter', {
      origin: 'help',
      category,
    });
  };

  const handleReset = () => {
    if (!hasActiveFilters) {
      return;
    }

    setSearchTerm('');
    setActiveCategory('all');
    setLastTrackedQuery('');
    track('filter', {
      origin: 'help',
      action: 'reset',
    });
  };

  return (
    <main className="help-page" aria-labelledby="help-title">
      <header className="page-header">
        <p className="page-header__eyebrow">Soporte institucional</p>
        <h1 id="help-title" className="page-header__title">
          Centro de ayuda
        </h1>
        <p className="page-header__summary">
          Resuelve dudas sobre activación, beneficios y soporte técnico con una
          experiencia más clara y consistente con el resto de la app.
        </p>
      </header>

      {isOffline && (
        <div className="status-panel help-page__offline" role="status">
          <p>Sin conexión. Mostramos la información guardada.</p>
        </div>
      )}

      <form className="help-page__search surface-card" onSubmit={handleSearchSubmit}>
        <label htmlFor="help-search" className="help-page__search-label">
          ¿Qué necesitas saber?
        </label>
        <div className="help-page__search-bar">
          <input
            id="help-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Escribe palabras clave como activación o soporte."
            aria-describedby="help-search-hint"
          />
          <button type="submit" className="primary-button help-page__search-button">
            Buscar
          </button>
          <button
            type="button"
            className="secondary-button help-page__reset-button"
            onClick={handleReset}
            aria-label="Limpiar búsqueda"
            disabled={!hasActiveFilters}
          >
            Limpiar
          </button>
        </div>
        <p id="help-search-hint" className="help-page__hint">
          La lista se actualiza al escribir. Presiona Buscar para guardar la consulta.
        </p>
      </form>

      <div className="help-page__categories" role="group" aria-label="Filtrar preguntas frecuentes">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`help-page__category${activeCategory === category.id ? ' help-page__category--active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
            aria-pressed={activeCategory === category.id}
          >
            {category.label}
          </button>
        ))}
      </div>

      <section className="help-page__results surface-card" aria-live="polite">
        {filteredFaqs.length === 0 ? (
          <div className="empty-state help-page__empty" role="status">
            <p>No encontramos coincidencias. Cambia las palabras o prueba otra categoría.</p>
          </div>
        ) : (
          <ul className="help-page__list" role="list">
            {filteredFaqs.map((faq) => (
              <li key={faq.id} className="help-page__item">
                <details className="help-page__details">
                  <summary className="help-page__question">{faq.question}</summary>
                  <div className="help-page__answer">
                    <p>{faq.answer}</p>
                    {faq.details && (
                      <ul className="help-page__bullets">
                        {faq.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    )}
                    {faq.links && (
                      <div className="help-page__links">
                        {faq.links.map((link) => (
                          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
};

export default Help;
