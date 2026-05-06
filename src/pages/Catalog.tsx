import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, LayoutGroup } from 'framer-motion';
import BenefitCard from '../components/BenefitCard';
import BenefitHighlightModal from '../components/BenefitHighlightModal';
import FilterChips from '../components/FilterChips';
import MerchantModal from '../components/MerchantModal';
import {
  useLazyGetCatalogHighlightsQuery,
  useLazyGetCatalogQuery,
} from '../features/catalog/catalogSlice';
import {
  BenefitHighlight,
  getBenefitHighlightSince,
  loadHighlightMarker,
  loadSessionHighlightMarker,
  saveBenefitHighlightSeen,
  shouldOpenBenefitHighlight,
} from '../features/catalog/catalogHighlights';
import { Benefit } from '../features/catalog/catalogTypes';
import { track } from '../lib/analytics';

const skeletonArray = Array.from({ length: 6 }, (_, index) => index);
const MAX_SEARCH_LENGTH = 120;
const PAGE_SIZE = 25;
const MAX_VISIBLE_PAGES = 5;

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2);
  const start = Math.max(Math.min(currentPage - halfWindow, totalPages - MAX_VISIBLE_PAGES + 1), 1);

  return Array.from({ length: MAX_VISIBLE_PAGES }, (_, index) => start + index);
};

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
  const [highlightBenefit, setHighlightBenefit] = useState<BenefitHighlight | undefined>();
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);
  const [isAwaiting, setIsAwaiting] = useState(true);

  const [fetchCatalog, { data, isLoading, isFetching, isError }] = useLazyGetCatalogQuery();
  const [fetchHighlights, { data: highlightsData }] = useLazyGetCatalogHighlightsQuery();

  useEffect(() => {
    const persistedSince =
      typeof window !== 'undefined' ? getBenefitHighlightSince(window.localStorage) : undefined;

    fetchHighlights({
      limit: 1,
      since: persistedSince,
    });
  }, [fetchHighlights]);

  useEffect(() => {
    setIsAwaiting(true);

    fetchCatalog({
      categoria: selectedCategories.length ? selectedCategories.join(',') : undefined,
      municipio: selectedMunicipalities.length ? selectedMunicipalities.join(',') : undefined,
      q: appliedQuery || undefined,
      page,
      pageSize: PAGE_SIZE,
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

    setBenefits(data.data);

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

  useEffect(() => {
    const candidate = highlightsData?.items[0];
    if (!candidate || typeof window === 'undefined') {
      return;
    }

    const persistedMarker = loadHighlightMarker(window.localStorage);
    const sessionMarker = loadSessionHighlightMarker(window.sessionStorage);

    if (!shouldOpenBenefitHighlight(candidate, persistedMarker, sessionMarker)) {
      return;
    }

    setHighlightBenefit(candidate);
    setIsHighlightModalOpen(true);
    track('open_new_benefit_modal', {
      origin: 'catalog',
      id: candidate.benefit.id,
      name: candidate.benefit.name,
      publishedAt: candidate.publishedAt,
    });
  }, [highlightsData]);

  const activeFilterCount = selectedCategories.length + selectedMunicipalities.length;
  const totalBenefits = data?.meta?.total ?? benefits.length;
  const currentPage = data?.meta?.page ?? page;
  const totalPages = data?.meta?.totalPages ?? 1;
  const visiblePages = useMemo(
    () => getVisiblePages(currentPage, totalPages),
    [currentPage, totalPages],
  );
  const firstVisibleItem = totalBenefits === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisibleItem = Math.min(currentPage * PAGE_SIZE, totalBenefits);

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page || nextPage < 1 || nextPage > totalPages || isFetching) {
      return;
    }

    setSelectedBenefit(undefined);
    setIsModalOpen(false);
    setBenefits([]);
    setPage(nextPage);
    setIsAwaiting(true);
    track('pagination', {
      origin: 'catalog',
      page: nextPage,
      pageSize: PAGE_SIZE,
    });
  };

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

  const markHighlightAsSeen = (highlight: BenefitHighlight | undefined) => {
    if (!highlight || typeof window === 'undefined') {
      return;
    }

    saveBenefitHighlightSeen(highlight, window.localStorage, window.sessionStorage);
  };

  const closeHighlightModal = () => {
    markHighlightAsSeen(highlightBenefit);
    setIsHighlightModalOpen(false);
    setHighlightBenefit(undefined);
  };

  const handleViewHighlightedBenefit = () => {
    if (!highlightBenefit) {
      return;
    }

    markHighlightAsSeen(highlightBenefit);
    setIsHighlightModalOpen(false);
    setHighlightBenefit(undefined);
    track('open_new_benefit_cta', {
      origin: 'catalog',
      id: highlightBenefit.benefit.id,
      name: highlightBenefit.benefit.name,
    });
    openModal(highlightBenefit.benefit);
  };

  return (
    <main className="catalog-page">
      <section className="catalog-hero" aria-labelledby="catalog-title">
        <div className="catalog-hero__copy">
          <p className="catalog-hero__eyebrow">Convenios activos</p>
          <h1 id="catalog-title" className="catalog-page__title">
            Cat&aacute;logo de beneficios
          </h1>
        </div>
        <div className="catalog-hero__meta" aria-live="polite">
          {activeFilterCount > 0 && (
            <span>
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro activo' : 'filtros activos'}
            </span>
          )}
          <span>
            {totalBenefits} {totalBenefits === 1 ? 'beneficio' : 'beneficios'}
          </span>
        </div>
      </section>

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
        {(isLoading || isFetching || isAwaiting) && (
          <div className="catalog-page__skeletons" aria-hidden="true">
            {skeletonArray.map((item) => (
              <div key={item} className="benefit-card benefit-card--skeleton" />
            ))}
          </div>
        )}

        {!isAwaiting && !isLoading && !isFetching && benefits.length === 0 && data && !isError && (
          <div className="catalog-page__empty">
            <div className="catalog-page__empty-illustration" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M10.5 3a7.5 7.5 0 0 1 5.92 12.1l3.24 3.24a1 1 0 0 1-1.42 1.42L15 16.52A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
              </svg>
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
          <p className="catalog-page__error">Ocurri&oacute; un error al cargar el cat&aacute;logo.</p>
        )}
      </section>

      {totalPages > 1 && (
        <nav className="catalog-pagination" aria-label="Paginaci&oacute;n del cat&aacute;logo">
          <p className="catalog-pagination__summary" aria-live="polite">
            Mostrando {firstVisibleItem}-{lastVisibleItem} de {totalBenefits}
          </p>
          <div className="catalog-pagination__controls">
            <button
              type="button"
              className="catalog-pagination__button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || isFetching}
            >
              Anterior
            </button>

            <div className="catalog-pagination__pages">
              {visiblePages[0] > 1 && <span aria-hidden="true">...</span>}
              {visiblePages.map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  className="catalog-pagination__page"
                  aria-current={pageNumber === currentPage ? 'page' : undefined}
                  onClick={() => handlePageChange(pageNumber)}
                  disabled={isFetching}
                >
                  {pageNumber}
                </button>
              ))}
              {visiblePages[visiblePages.length - 1] < totalPages && <span aria-hidden="true">...</span>}
            </div>

            <button
              type="button"
              className="catalog-pagination__button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || isFetching}
            >
              Siguiente
            </button>
          </div>
        </nav>
      )}

      <BenefitHighlightModal
        open={isHighlightModalOpen}
        highlight={highlightBenefit}
        onClose={closeHighlightModal}
        onViewBenefit={handleViewHighlightedBenefit}
      />
      <MerchantModal open={isModalOpen} benefit={selectedBenefit} onClose={closeModal} />
    </main>
  );
};

export default Catalog;
