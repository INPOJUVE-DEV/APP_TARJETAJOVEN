import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import FocusTrap from 'focus-trap-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Benefit } from '../features/catalog/catalogTypes';

interface MerchantModalProps {
  open: boolean;
  benefit?: Benefit;
  onClose: () => void;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const MerchantModal = ({ open, benefit, onClose }: MerchantModalProps) => {
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

  if (!open || !benefit) {
    return null;
  }

  const mapsQuery = benefit.latitude && benefit.longitude
    ? `${benefit.latitude},${benefit.longitude}`
    : benefit.address ?? benefit.name;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;

  const descriptionId = benefit.description ? 'merchant-modal-description' : undefined;

  return createPortal(
    <AnimatePresence>
      {open && (
        <FocusTrap active={open} focusTrapOptions={{ allowOutsideClick: true }}>
          <motion.div
            className="merchant-modal"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={overlayVariants}
            transition={{ duration: 0.2 }}
            role="presentation"
            onClick={onClose}
          >
            <motion.div
              className="merchant-modal__panel"
              variants={panelVariants}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="merchant-modal-title"
              aria-describedby={descriptionId}
              onClick={(event) => event.stopPropagation()}
            >
              <header className="merchant-modal__header">
                <h2 id="merchant-modal-title" className="merchant-modal__title">
                  {benefit.name}
                </h2>
                <button type="button" onClick={onClose} className="merchant-modal__close">
                  Cerrar
                </button>
              </header>

              <section className="merchant-modal__body">
                {benefit.discount && (
                  <p className="merchant-modal__highlight">{benefit.discount}</p>
                )}
                {benefit.description && (
                  <p id={descriptionId} className="merchant-modal__text">
                    {benefit.description}
                  </p>
                )}
                {benefit.address && (
                  <p className="merchant-modal__text">
                    <strong>Direcci&oacute;n:</strong> {benefit.address}
                  </p>
                )}
                {benefit.schedule && (
                  <p className="merchant-modal__text">
                    <strong>Horario:</strong> {benefit.schedule}
                  </p>
                )}
              </section>

              <footer className="merchant-modal__footer">
                <a
                  className="merchant-modal__cta"
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  C&oacute;mo llegar
                </a>
              </footer>
            </motion.div>
          </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default MerchantModal;
