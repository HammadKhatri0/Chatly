import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useGSAP } from '@gsap/react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import gsap, { DURATION, EASE, skipMotion } from '../../animations/motion.js';

const Modal = ({ open, onClose, title, description, children, footer, size = 'md' }) => {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);

  /** Plays the exit tween first, then tells the parent to unmount us. */
  const dismiss = useCallback(() => {
    if (skipMotion()) {
      onClose?.();
      return;
    }
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.18 });
    gsap.to(panelRef.current, {
      opacity: 0,
      y: 16,
      scale: 0.98,
      duration: 0.18,
      ease: EASE.inOut,
      onComplete: () => onClose?.(),
    });
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && dismiss();
    document.addEventListener('keydown', onKeyDown);
    // Stop the page behind the dialog from scrolling under the overlay.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [open, dismiss]);

  useGSAP(
    () => {
      if (!open || skipMotion()) return;
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: DURATION.fast });
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 28, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: DURATION.base, ease: EASE.pop, clearProps: 'transform' }
      );
      // Contents arrive a beat after the panel itself.
      const rows = panelRef.current?.querySelectorAll('[data-modal-body] > *');
      if (rows?.length) {
        gsap.fromTo(
          rows,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: DURATION.fast, stagger: 0.05, delay: 0.1, ease: EASE.out }
        );
      }
    },
    { dependencies: [open] }
  );

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-0 backdrop-blur-md sm:items-center sm:p-4"
    >
      <button type="button" aria-label="Close dialog" className="absolute inset-0" onClick={dismiss} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        className={clsx(
          'scroll-slim relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-panel p-5',
          'shadow-float shadow-bevel sm:rounded-3xl sm:p-6',
          size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        )}
      >
        {/* Grab handle: on phones the dialog rises from the bottom like a sheet. */}
        <span
          aria-hidden="true"
          className="mx-auto mb-4 block h-1 w-10 rounded-full bg-ink-100 sm:hidden"
        />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-ink-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="press rounded-xl p-1.5 text-ink-400 transition hover:rotate-90 hover:bg-ink-100 hover:text-ink-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div data-modal-body>{children}</div>

        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
