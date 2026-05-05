import { MouseEvent } from 'react';
import { Benefit } from '../features/catalog/catalogTypes';

interface MapCardProps {
  benefit: Benefit;
  isSelected: boolean;
  onSelect: (benefit: Benefit) => void;
}

const MapCard = ({ benefit, isSelected, onSelect }: MapCardProps) => {
  const handleSelect = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onSelect(benefit);
  };

  const googleMapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    benefit.name,
  )}`;

  return (
    <article
      className={`map-card${isSelected ? ' map-card--selected' : ''}`}
      aria-label={`Comercio ${benefit.name}`}
    >
      <button
        type="button"
        className="map-card__select"
        onClick={handleSelect}
        aria-pressed={isSelected}
      >
        <h3 className="map-card__title">{benefit.name}</h3>
        <p className="map-card__meta">
          <span className="map-card__chip">{benefit.category}</span>
          <span className="map-card__chip map-card__chip--muted">{benefit.municipality}</span>
        </p>
        {benefit.address && <p className="map-card__address">{benefit.address}</p>}
        {benefit.schedule && <p className="map-card__schedule">{benefit.schedule}</p>}
      </button>
      <div className="map-card__actions">
        <a
          className="map-card__link"
          href={googleMapsSearchUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver en Google Maps
        </a>
      </div>
    </article>
  );
};

export default MapCard;
