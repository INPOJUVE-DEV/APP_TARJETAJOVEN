import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import { AnimatePresence, motion } from 'framer-motion';
import { BenefitHighlight } from '../features/catalog/catalogHighlights';

interface BenefitHighlightModalProps {
  open: boolean;
  highlight?: BenefitHighlight;
  onClose: () => void;
  onViewBenefit: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const BenefitHighlightModal = ({
  open,
  highlight,
  onClose,
  onViewBenefit,
}: BenefitHighlightModalProps) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !highlight) {
    return null;
  }

  const descriptionId = highlight.summary || highlight.benefit.description
    ? 'benefit-highlight-description'
    : undefined;

  return createPortal(
    <AnimatePresence>
      {open && (
        <FocusTrap active={open} focusTrapOptions={{ allowOutsideClick: true }}>
          <motion.div
            className="benefit-highlight-modal"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.2 }}
            role="presentation"
            onClick={onClose}
          >
            <motion.div
              className="benefit-highlight-modal__panel"
              variants={panelVariants}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="benefit-highlight-title"
              aria-describedby={descriptionId}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="benefit-highlight-modal__header">
                <div className="benefit-highlight-modal__copy">
                  <p className="benefit-highlight-modal__eyebrow">Nuevo beneficio</p>
                  <h2 id="benefit-highlight-title" className="benefit-highlight-modal__title">
                    {highlight.headline ?? highlight.benefit.name}
                  </h2>
                </div>
                <button
                  type="button"
                  className="benefit-highlight-modal__close"
                  onClick={onClose}
                >
                  Cerrar
                </button>
              </header>

              <section className="benefit-highlight-modal__body">
                <div className="benefit-highlight-modal__hero" aria-hidden="true">
                  {highlight.imageUrl ? (
                    <img
                      src={highlight.imageUrl}
                      alt=""
                      className="benefit-highlight-modal__image"
                    />
                  ) : (
                    <div className="benefit-highlight-modal__art">
                      <span>{highlight.benefit.category}</span>
                      <strong>{highlight.benefit.discount}</strong>
                    </div>
                  )}
                </div>

                <div className="benefit-highlight-modal__details">
                  <div className="benefit-highlight-modal__meta">
                    <span>{highlight.benefit.category}</span>
                    <span>{highlight.benefit.municipality}</span>
                  </div>

                  {highlight.headline && (
                    <p className="benefit-highlight-modal__benefit-name">
                      {highlight.benefit.name}
                    </p>
                  )}

                  <p className="benefit-highlight-modal__discount">
                    {highlight.benefit.discount}
                  </p>

                  {(highlight.summary || highlight.benefit.description) && (
                    <p
                      id={descriptionId}
                      className="benefit-highlight-modal__summary"
                    >
                      {highlight.summary ?? highlight.benefit.description}
                    </p>
                  )}
                </div>
              </section>

              <footer className="benefit-highlight-modal__footer">
                <button
                  type="button"
                  className="benefit-highlight-modal__button benefit-highlight-modal__button--ghost"
                  onClick={onClose}
                >
                  Ahora no
                </button>
                <button
                  type="button"
                  className="benefit-highlight-modal__button benefit-highlight-modal__button--primary"
                  onClick={onViewBenefit}
                >
                  Ver beneficio
                </button>
              </footer>
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default BenefitHighlightModal;
