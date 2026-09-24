import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import gsap, { DURATION, EASE, prefersReducedMotion } from '../../animations/motion.js';

const Modal = ({ open, onClose, title, description, children, footer, size = 'md' }) => {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useGSAP(
    () => {
      if (!open || prefersReducedMotion()) return;
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: DURATION.fast });
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 24, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: DURATION.base, ease: EASE.out, clearProps: 'transform' }
      );
    },
    { dependencies: [open] }
  );

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <button type="button" aria-label="Close dialog" className="absolute inset-0" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={clsx(
          'relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-panel p-5 shadow-card sm:rounded-3xl sm:p-6',
          size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press rounded-xl p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
