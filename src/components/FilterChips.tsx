import { ChangeEvent, FormEvent } from 'react';

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

const toggleValue = (value: string, list: string[], onChange: (values: string[]) => void) => {
  if (list.includes(value)) {
    onChange(list.filter((item) => item !== value));
    return;
  }
  onChange([...list, value]);
};

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
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    onChange(values);
  };

  const selectedTags = [
    ...selectedCategories.map((value) => ({ value, type: 'category' as const })),
    ...selectedMunicipalities.map((value) => ({ value, type: 'municipality' as const })),
  ];

  const renderChipList = (
    label: string,
    options: string[],
    selected: string[],
    onChange: (values: string[]) => void,
    dropdownId: string,
  ) => (
    <fieldset className="catalog-filters__group">
      <legend className="catalog-filters__group-label">
        <span>{label}</span>
        <small>
          {selected.length > 0 ? `${selected.length} activos` : `${options.length} opciones`}
        </small>
      </legend>
      <div className="catalog-filters__chips" role="group" aria-label={label}>
        {options.map((option) => {
          const isActive = selected.includes(option);
          return (
            <button
              type="button"
              key={option}
              className={`chip${isActive ? ' chip--active' : ''}`}
              onClick={() => toggleValue(option, selected, onChange)}
              aria-pressed={isActive}
            >
              {isActive && (
                <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                  <path d="M6.2 11.4 2.8 8l1.1-1.1 2.3 2.3 5.9-5.9L13.2 4Z" />
                </svg>
              )}
              {option}
            </button>
          );
        })}
      </div>

      <label htmlFor={dropdownId} className="catalog-filters__dropdown-label">
        {label}
      </label>
      <select
        id={dropdownId}
        multiple
        className="catalog-filters__dropdown"
        value={selected}
        onChange={(event) => handleMultiSelectChange(event, onChange)}
      >
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
      <div className="catalog-filters__search">
        <label htmlFor="catalog-search" className="sr-only">
          Buscar por nombre
        </label>
        <input
          id="catalog-search"
          type="search"
          placeholder="Buscar beneficio"
          value={query}
          onChange={handleQueryInput}
          className="catalog-filters__input"
          maxLength={MAX_SEARCH_LENGTH}
        />
        <button type="submit" className="catalog-filters__submit">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M10.5 3a7.5 7.5 0 0 1 5.92 12.1l3.24 3.24a1 1 0 0 1-1.42 1.42L15 16.52A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
          </svg>
          <span>Buscar</span>
        </button>
      </div>

      <div className="catalog-filters__panels">
        {categories.length > 0 &&
          renderChipList('Categor\u00edas', categories, selectedCategories, onCategoriesChange, 'category-filter')}

        {municipalities.length > 0 &&
          renderChipList(
            'Municipios',
            municipalities,
            selectedMunicipalities,
            onMunicipalitiesChange,
            'municipality-filter',
          )}
      </div>

      {selectedTags.length > 0 && (
        <div className="catalog-filters__selected" aria-live="polite">
          {selectedTags.map((tag) => (
            <button
              type="button"
              key={`${tag.type}-${tag.value}`}
              className="catalog-filters__selected-chip"
              onClick={() =>
                toggleValue(
                  tag.value,
                  tag.type === 'category' ? selectedCategories : selectedMunicipalities,
                  tag.type === 'category' ? onCategoriesChange : onMunicipalitiesChange,
                )
              }
              aria-label={`Quitar ${tag.value}`}
            >
              {tag.value}
              <span aria-hidden="true">&times;</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" className="catalog-filters__reset" onClick={onReset}>
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6.7 5.3a1 1 0 0 1 1.4 0L12 9.17l3.9-3.88a1 1 0 1 1 1.4 1.42L13.42 10.6l3.88 3.9a1 1 0 0 1-1.42 1.4L12 12.03 8.1 15.9a1 1 0 1 1-1.4-1.42l3.88-3.88L6.7 6.7a1 1 0 0 1 0-1.4Z" />
        </svg>
        <span>Limpiar filtros</span>
      </button>
    </form>
  );
};

export default FilterChips;
