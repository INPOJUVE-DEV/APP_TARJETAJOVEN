import { useEffect, useMemo, useState } from 'react';
import FilterChips from '../components/FilterChips';
import MapCard from '../components/MapCard';
import {
  Benefit,
  useLazyGetCatalogQuery,
} from '../features/catalog/catalogSlice';
import { env } from '../config/env';
import { track } from '../lib/analytics';
import './Map.css';

const MAPS_URL = env.mapsUrl;
const MAX_SEARCH_LENGTH = 120;

const MapPage = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [selectedBenefitId, setSelectedBenefitId] = useState<string | undefined>();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const [fetchCatalog, { data, isLoading, isFetching, isError }] = useLazyGetCatalogQuery();

  useEffect(() => {
    track('open_map');
  }, []);

  useEffect(() => {
    fetchCatalog({
      categoria: selectedCategories.length ? selectedCategories.join(',') : undefined,
      municipio: selectedMunicipalities.length ? selectedMunicipalities.join(',') : undefined,
      q: appliedQuery || undefined,
    });
  }, [selectedCategories, selectedMunicipalities, appliedQuery, fetchCatalog]);

  useEffect(() => {
    if (!data) {
      if (!isFetching) {
        setBenefits([]);
      }
      return;
    }

    setBenefits(data.data);

    if (data.meta?.filters?.categories) {
      setCategories(data.meta.filters.categories);
    }

    if (data.meta?.filters?.municipalities) {
      setMunicipalities(data.meta.filters.municipalities);
    }
  }, [data, isFetching]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const selectedBenefit = useMemo(
    () => benefits.find((benefit) => benefit.id === selectedBenefitId),
    [benefits, selectedBenefitId],
  );

  useEffect(() => {
    if (selectedBenefitId && !benefits.some((benefit) => benefit.id === selectedBenefitId)) {
      setSelectedBenefitId(undefined);
    }
  }, [benefits, selectedBenefitId]);

  const mapSrc = useMemo(() => {
    if (!MAPS_URL) {
      return '';
    }

    if (!selectedBenefit?.name) {
      return MAPS_URL;
    }

    try {
      const url = new URL(MAPS_URL);
      url.searchParams.set('q', selectedBenefit.name);
      return url.toString();
    } catch (error) {
      const separator = MAPS_URL.includes('?') ? '&' : '?';
      return `${MAPS_URL}${separator}q=${encodeURIComponent(selectedBenefit.name)}`;
    }
  }, [selectedBenefit?.name]);

  const handleCategoryChange = (categoriesValue: string[]) => {
    setSelectedCategories(categoriesValue);
    setSelectedBenefitId(undefined);
    track('filter', {
      origin: 'map',
      type: 'category',
      value: categoriesValue.length ? categoriesValue.join(',') : 'all',
    });
  };

  const handleMunicipalityChange = (municipalitiesValue: string[]) => {
    setSelectedMunicipalities(municipalitiesValue);
    setSelectedBenefitId(undefined);
    track('filter', {
      origin: 'map',
      type: 'municipality',
      value: municipalitiesValue.length ? municipalitiesValue.join(',') : 'all',
    });
  };

  const handleSearch = () => {
    const trimmed = query.trim().slice(0, MAX_SEARCH_LENGTH);
    setAppliedQuery(trimmed);
    if (trimmed) {
      track('search', {
        origin: 'map',
        query: trimmed,
        category: selectedCategories.join(',') || undefined,
        municipality: selectedMunicipalities.join(',') || undefined,
      });
    }
  };

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedMunicipalities([]);
    setQuery('');
    setAppliedQuery('');
    setSelectedBenefitId(undefined);
    track('filter', {
      origin: 'map',
      action: 'reset',
    });
  };

  const handleSelect = (benefit: Benefit) => {
    setSelectedBenefitId(benefit.id);
    track('open_merchant', {
      origin: 'map',
      id: benefit.id,
      name: benefit.name,
    });
  };

  return (
    <main className="map-page">
      <header className="map-page__header">
        <h1 className="map-page__title">Mapa de negocios</h1>
        <p className="map-page__subtitle">
          Explora los comercios aliados y descubre beneficios en tu municipio.
        </p>
      </header>

      <FilterChips
        categories={categories}
        municipalities={municipalities}
        selectedCategories={selectedCategories}
        selectedMunicipalities={selectedMunicipalities}
        query={query}
        onQueryChange={setQuery}
        onCategoriesChange={handleCategoryChange}
        onMunicipalitiesChange={handleMunicipalityChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {isOffline ? (
        <div className="map-page__offline" role="status">
          <span aria-hidden="true">📴</span>
          <p>Mapa no disponible sin conexión</p>
        </div>
      ) : (
        <section className="map-page__layout">
          <section className="map-page__panel" aria-label="Listado de comercios">
            {isLoading || isFetching ? (
              <p className="map-page__loading" role="status">
                Cargando negocios…
              </p>
            ) : benefits.length === 0 ? (
              <p className="map-page__empty" role="status">
                No hay comercios que coincidan con los filtros seleccionados.
              </p>
            ) : (
              <ul className="map-page__list" role="list">
                {benefits.map((benefit) => (
                  <li key={benefit.id} className="map-page__list-item">
                    <MapCard
                      benefit={benefit}
                      isSelected={selectedBenefitId === benefit.id}
                      onSelect={handleSelect}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="map-page__viewer" aria-label="Mapa interactivo">
            {mapSrc ? (
              <iframe
                key={mapSrc}
                title="Mapa de comercios"
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <p className="map-page__empty" role="status">
                Configura la URL de Google MyMaps para visualizar el mapa.
              </p>
            )}
          </section>
        </section>
      )}

      {isError && !isOffline && (
        <p className="map-page__error" role="alert">
          Ocurrió un error al cargar el catálogo de comercios.
        </p>
      )}
    </main>
  );
};

export default MapPage;
