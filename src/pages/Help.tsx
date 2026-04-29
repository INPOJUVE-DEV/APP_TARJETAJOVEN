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
  { id: 'support', label: 'Soporte tecnico' },
];

const faqs: FAQ[] = [
  {
    id: 'activation',
    category: 'program',
    question: 'Quien puede activar la Tarjeta Joven desde la app?',
    answer: 'Personas que ya tienen una tarjeta fisica y necesitan vincular su acceso digital.',
    details: [
      'La app valida numero de tarjeta y CURP.',
      'Despues creas tu acceso con correo y contrasena.',
    ],
    tags: ['activacion', 'curp', 'tarjeta'],
  },
  {
    id: 'new-registration',
    category: 'program',
    question: 'Puedo darme de alta por primera vez desde esta app?',
    answer: 'No. El alta oficial ya no se realiza desde la app.',
    details: [
      'Si aun no formas parte del programa, consulta los canales oficiales de Tarjeta Joven.',
      'La app solo ofrece activacion de tarjeta y login para cuentas ya vinculadas.',
    ],
    tags: ['registro', 'alta'],
  },
  {
    id: 'digital-card',
    category: 'program',
    question: 'La tarjeta es digital o fisica?',
    answer: 'Tu credencial digital se vincula a la tarjeta fisica y te sirve para mostrar beneficios.',
    details: ['Una vez vinculada, puedes entrar a tu perfil y mostrar tu QR.'],
    tags: ['credencial', 'perfil'],
  },
  {
    id: 'discounts-how',
    category: 'discounts',
    question: 'Como uso un descuento en un aliado?',
    answer: 'Busca el comercio en el catalogo o en el mapa y presenta tu credencial digital al pagar.',
    details: ['Algunos beneficios tienen restricciones de horario o sucursal.'],
    tags: ['beneficios', 'mapa', 'catalogo'],
  },
  {
    id: 'password',
    category: 'support',
    question: 'Olvide mi acceso. Que hago?',
    answer: 'Inicia sesion con tu correo y contrasena desde la pantalla principal de acceso.',
    details: [
      'Si tu cuenta ya esta vinculada, usa el canal oficial de recuperacion de acceso.',
      'Si aun no esta vinculada, primero activa tu tarjeta.',
    ],
    tags: ['password', 'migracion', 'acceso'],
  },
  {
    id: 'support',
    category: 'support',
    question: 'Necesito ayuda adicional, con quien hablo?',
    answer: 'Usa los canales oficiales del programa o escribe desde la seccion de ayuda institucional.',
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
      <header className="help-page__header">
        <h1 id="help-title">Centro de ayuda</h1>
        <p className="help-page__intro">
          Resuelve dudas sobre activacion, beneficios y soporte tecnico en minutos.
        </p>
      </header>

      {isOffline && (
        <div className="help-page__offline" role="status">
          <span aria-hidden="true">!</span>
          <p>Sin conexion. Mostramos la informacion guardada.</p>
        </div>
      )}

      <form className="help-page__search" onSubmit={handleSearchSubmit}>
        <label htmlFor="help-search" className="help-page__search-label">
          Que necesitas saber?
        </label>
        <div className="help-page__search-bar">
          <input
            id="help-search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Escribe palabras clave como activacion o soporte."
            aria-describedby="help-search-hint"
          />
          <button type="submit" className="help-page__search-button">
            Buscar
          </button>
          <button
            type="button"
            className="help-page__reset-button"
            onClick={handleReset}
            aria-label="Limpiar busqueda"
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

      <section className="help-page__results" aria-live="polite">
        {filteredFaqs.length === 0 ? (
          <p className="help-page__empty" role="status">
            No encontramos coincidencias. Cambia las palabras o prueba otra categoria.
          </p>
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
