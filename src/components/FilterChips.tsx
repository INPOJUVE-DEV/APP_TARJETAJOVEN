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
    <div className="catalog-filters__group">
      <p className="catalog-filters__group-label">{label}</p>
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
    </div>
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
          Buscar
        </button>
      </div>

      <div className="catalog-filters__panels">
        {categories.length > 0 &&
          renderChipList('Categorías', categories, selectedCategories, onCategoriesChange, 'category-filter')}

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
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}

      <button type="button" className="catalog-filters__reset" onClick={onReset}>
        Limpiar filtros
      </button>
    </form>
  );
};

export default FilterChips;
