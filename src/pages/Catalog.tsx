import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import BenefitCard from '../components/BenefitCard';
import FilterChips from '../components/FilterChips';
import MerchantModal from '../components/MerchantModal';
import {
  Benefit,
  useLazyGetCatalogQuery,
} from '../features/catalog/catalogSlice';
import { track } from '../lib/analytics';

const skeletonArray = Array.from({ length: 6 }, (_, index) => index);
const MAX_SEARCH_LENGTH = 120;

const Catalog = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [municipalities, setMunicipalities] = useState<string[]>([]);
  const [selectedBenefit, setSelectedBenefit] = useState<Benefit | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAwaiting, setIsAwaiting] = useState(true);

  const [fetchCatalog, { data, isLoading, isFetching, isError }] = useLazyGetCatalogQuery();

  useEffect(() => {
    if (page === 1) {
      setIsAwaiting(true);
    }

    fetchCatalog({
      categoria: selectedCategories.length ? selectedCategories.join(',') : undefined,
      municipio: selectedMunicipalities.length ? selectedMunicipalities.join(',') : undefined,
      q: appliedQuery || undefined,
      page,
    });
  }, [selectedCategories, selectedMunicipalities, appliedQuery, page, fetchCatalog]);

  useEffect(() => {
    if (!data) {
      if (page === 1 && !isFetching) {
        setBenefits([]);
        setIsAwaiting(false);
      }
      return;
    }

    if (page === 1) {
      setBenefits(data.data);
    } else {
      setBenefits((previous) => [...previous, ...data.data]);
    }

    if (data.meta?.filters?.categories) {
      setCategories(data.meta.filters.categories);
    }

    if (data.meta?.filters?.municipalities) {
      setMunicipalities(data.meta.filters.municipalities);
    }

    if (!isFetching) {
      setIsAwaiting(false);
    }
  }, [data, page, isFetching]);

  useEffect(() => {
    if (isError && !isFetching) {
      setIsAwaiting(false);
    }
  }, [isError, isFetching]);

  const hasMore = useMemo(() => {
    if (!data?.meta) {
      return false;
    }

    if (typeof data.meta.nextPage === 'number') {
      return data.meta.nextPage > data.meta.page;
    }

    if (typeof data.meta.totalPages === 'number') {
      return data.meta.page < data.meta.totalPages;
    }

    return false;
  }, [data]);

  const handleCategoryChange = (categoriesValue: string[]) => {
    setSelectedCategories(categoriesValue);
    setPage(1);
    setBenefits([]);
    setIsAwaiting(true);
    track('filter', {
      origin: 'catalog',
      type: 'category',
      value: categoriesValue.length ? categoriesValue.join(',') : 'all',
    });
  };

  const handleMunicipalityChange = (municipalitiesValue: string[]) => {
    setSelectedMunicipalities(municipalitiesValue);
    setPage(1);
    setBenefits([]);
    setIsAwaiting(true);
    track('filter', {
      origin: 'catalog',
      type: 'municipality',
      value: municipalitiesValue.length ? municipalitiesValue.join(',') : 'all',
    });
  };

  const handleSearch = () => {
    const trimmed = query.trim().slice(0, MAX_SEARCH_LENGTH);
    setAppliedQuery(trimmed);
    setPage(1);
    setBenefits([]);
    setIsAwaiting(true);
    if (trimmed) {
      track('search', {
        origin: 'catalog',
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
    setPage(1);
    setBenefits([]);
    setIsAwaiting(true);
    track('filter', {
      origin: 'catalog',
      action: 'reset',
    });
  };

  const openModal = (benefit: Benefit) => {
    setSelectedBenefit(benefit);
    setIsModalOpen(true);
    track('open_merchant', {
      origin: 'catalog',
      id: benefit.id,
      name: benefit.name,
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBenefit(undefined);
  };

  return (
    <main className="catalog-page">
      <h1 className="catalog-page__title">Catálogo de beneficios</h1>

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

      <section className="catalog-page__list" aria-live="polite" role="list">
        {(isLoading || (isFetching && page === 1) || (isAwaiting && page === 1)) && (
          <div className="catalog-page__skeletons" aria-hidden="true">
            {skeletonArray.map((item) => (
              <div key={item} className="benefit-card benefit-card--skeleton" />
            ))}
          </div>
        )}

        {!isAwaiting && !isLoading && !isFetching && benefits.length === 0 && data && !isError && (
          <div className="catalog-page__empty">
            <div className="catalog-page__empty-illustration" aria-hidden="true">
              <span role="img" aria-label="Sin resultados">
                🔍
              </span>
            </div>
            <p>No se encontraron resultados</p>
          </div>
        )}

        <LayoutGroup>
          <AnimatePresence mode="popLayout">
            {benefits.map((benefit) => (
              <BenefitCard
                key={benefit.id}
                benefit={benefit}
                onOpen={openModal}
                isSelected={selectedBenefit?.id === benefit.id}
              />
            ))}
          </AnimatePresence>
        </LayoutGroup>

        {isError && (
          <p className="catalog-page__error">Ocurrió un error al cargar el catálogo.</p>
        )}
      </section>

      {hasMore && (
        <button
          type="button"
          className="catalog-page__load-more"
          onClick={() => setPage((current) => current + 1)}
          disabled={isFetching}
        >
          {isFetching ? 'Cargando…' : 'Cargar más'}
        </button>
      )}

      <MerchantModal open={isModalOpen} benefit={selectedBenefit} onClose={closeModal} />
    </main>
  );
};

export default Catalog;
