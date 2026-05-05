import { motion } from 'framer-motion';
import { Benefit } from '../features/catalog/catalogTypes';

interface BenefitCardProps {
  benefit: Benefit;
  onOpen: (benefit: Benefit) => void;
  isSelected?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 1 },
  visible: { opacity: 1, y: 0, scale: 1 },
  selected: { opacity: 1, y: 0, scale: 1.01 },
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const BenefitCard = ({ benefit, onOpen, isSelected }: BenefitCardProps) => {
  const initials = getInitials(benefit.name);

  return (
    <motion.article
      layout
      variants={cardVariants}
      initial="hidden"
      animate={isSelected ? 'selected' : 'visible'}
      exit="hidden"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.995 }}
      className="benefit-card"
      role="button"
      aria-pressed={Boolean(isSelected)}
      tabIndex={0}
      data-selected={isSelected ? 'true' : undefined}
      onClick={() => onOpen(benefit)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(benefit);
        }
      }}
    >
      <div className="benefit-card__header">
        <div className="benefit-card__brand">
          <div className="benefit-card__thumbnail" aria-hidden="true">
            <span>{initials}</span>
          </div>
          <div className="benefit-card__info">
            <h3 className="benefit-card__title">{benefit.name}</h3>
            <p className="benefit-card__subtitle">{benefit.category}</p>
          </div>
        </div>
        <div className="benefit-card__discount" aria-label={`Descuento: ${benefit.discount}`}>
          <span className="benefit-card__discount-text">{benefit.discount}</span>
        </div>
      </div>
      <div className="benefit-card__meta">
        <span className="benefit-card__chip">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M2 6.5 8 2l6 4.5v6.5a1 1 0 0 1-1 1h-3.5v-3.5h-3V14H3a1 1 0 0 1-1-1z" />
          </svg>
          {benefit.category}
        </span>
        <span className="benefit-card__chip benefit-card__chip--muted">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M8 1a5 5 0 0 1 5 5c0 3.5-5 9-5 9S3 9.5 3 6a5 5 0 0 1 5-5zm0 6.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z" />
          </svg>
          {benefit.municipality}
        </span>
      </div>
    </motion.article>
  );
};

export default BenefitCard;
