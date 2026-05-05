import { ChangeEvent, FormEvent, useEffect, useId, useState } from 'react';

interface FilterChipsProps {
  categories: string[];
  municipalities: string[];
  selectedCategories: string[];
  selectedMunicipalities: string[];
  query: string;
  onCategoriesChange: (values: string[]) => void;
  onMunicipalitiesChange: (values: string[]) => void;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

const MAX_SEARCH_LENGTH = 120;

const FilterChips = ({
  categories,
  municipalities,
  selectedCategories,
  selectedMunicipalities,
  query,
  onCategoriesChange,
  onMunicipalitiesChange,
  onQueryChange,
  onSearch,
  onReset,
}: FilterChipsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const filterPanelsId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch();
  };

  const handleQueryInput = (event: ChangeEvent<HTMLInputElement>) => {
    onQueryChange(event.target.value.slice(0, MAX_SEARCH_LENGTH));
  };

  const handleMultiSelectChange = (
    event: ChangeEvent<HTMLSelectElement>,
    onChange: (values: string[]) => void,
  ) => {
    const nextValue = event.target.value;
    onChange(nextValue ? [nextValue] : []);
  };

  const selectedTags = [
    ...selectedCategories.map((value) => ({ value, type: 'category' as const })),
    ...selectedMunicipalities.map((value) => ({ value, type: 'municipality' as const })),
  ];
  const hasActiveFilters = selectedTags.length > 0 || query.trim().length > 0;
  const hasFilterOptions = categories.length > 0 || municipalities.length > 0;

  useEffect(() => {
    if (selectedTags.length > 0) {
      setIsExpanded(true);
    }
  }, [selectedTags.length]);

  const renderCombobox = (
    label: string,
    options: string[],
    selected: string[],
    onChange: (values: string[]) => void,
    dropdownId: string,
    emptyLabel: string,
  ) => (
    <fieldset className="catalog-filters__group">
      <legend className="catalog-filters__group-label">
        <span>{label}</span>
        <small>{selected.length > 0 ? selected[0] : `${options.length} opciones`}</small>
      </legend>
      <select
        id={dropdownId}
        className="catalog-filters__dropdown"
        value={selected[0] ?? ''}
        onChange={(event) => handleMultiSelectChange(event, onChange)}
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </fieldset>
  );

  return (
    <form className="catalog-filters" onSubmit={handleSubmit}>
      <div className="catalog-filters__toolbar">
        <div className="catalog-filters__search">
          <label htmlFor="catalog-search" className="sr-only">
            Buscar por nombre
          </label>
          <input
            id="catalog-search"
            type="search"
            placeholder="Buscar beneficios"
            value={query}
            onChange={handleQueryInput}
            className="catalog-filters__input"
            maxLength={MAX_SEARCH_LENGTH}
          />
          <button type="submit" className="catalog-filters__submit" aria-label="Buscar">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M10.5 3a7.5 7.5 0 0 1 5.92 12.1l3.24 3.24a1 1 0 0 1-1.42 1.42L15 16.52A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
            </svg>
          </button>
        </div>

        {(hasFilterOptions || hasActiveFilters) && (
          <div className="catalog-filters__controls">
          {hasFilterOptions && (
            <button
              type="button"
              className={`catalog-filters__toggle${isExpanded ? ' is-expanded' : ''}`}
              aria-expanded={isExpanded}
              aria-controls={filterPanelsId}
              onClick={() => setIsExpanded((current) => !current)}
              aria-label={isExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}
            >
              <span className="catalog-filters__toggle-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M4 7a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2h-14a1 1 0 0 1-1-1Zm3 5a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Zm3 5a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1Z" />
                </svg>
              </span>
            </button>
          )}

          {hasActiveFilters && (
            <button type="button" className="catalog-filters__reset" onClick={onReset}>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M6.7 5.3a1 1 0 0 1 1.4 0L12 9.17l3.9-3.88a1 1 0 1 1 1.4 1.42L13.42 10.6l3.88 3.9a1 1 0 0 1-1.42 1.4L12 12.03 8.1 15.9a1 1 0 1 1-1.4-1.42l3.88-3.88L6.7 6.7a1 1 0 0 1 0-1.4Z" />
              </svg>
              <span>Limpiar filtros</span>
            </button>
          )}
          </div>
        )}
      </div>

      {hasFilterOptions && (
        <div
          id={filterPanelsId}
          className={`catalog-filters__content${isExpanded ? ' is-expanded' : ''}`}
        >
          <div className="catalog-filters__panels">
            {categories.length > 0 &&
              renderCombobox(
                'Categor\u00edas',
                categories,
                selectedCategories,
                onCategoriesChange,
                'category-filter',
                'Todas las categor\u00edas',
              )}

            {municipalities.length > 0 &&
              renderCombobox(
                'Municipios',
                municipalities,
                selectedMunicipalities,
                onMunicipalitiesChange,
                'municipality-filter',
                'Todos los municipios',
              )}
          </div>
        </div>
      )}

      {selectedTags.length > 0 && (
        <div className="catalog-filters__selected" aria-live="polite">
          {selectedTags.map((tag) => (
            <button
              type="button"
              key={`${tag.type}-${tag.value}`}
              className="catalog-filters__selected-chip"
              onClick={() =>
                (tag.type === 'category' ? onCategoriesChange : onMunicipalitiesChange)([])
              }
              aria-label={`Quitar ${tag.value}`}
            >
              {tag.value}
              <span aria-hidden="true">&times;</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export default FilterChips;
