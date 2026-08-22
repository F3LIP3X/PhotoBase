import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  PiXBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiStarFill,
  PiStar,
  PiTrashBold,
} from 'react-icons/pi';
import { mediaUrl } from '../hooks/useLibrary';
import { formatDate, formatSize } from '../format';

/* Photos open here rather than in the Windows viewer: the library is the
   app's, and handing the file to another program loses the favourite and
   delete actions that belong beside it. */
const Lightbox = ({ photos, index, onClose, onMove, favorite, onToggleFavorite, onDelete }) => {
  const photo = photos[index];

  const step = useCallback(
    (delta) => {
      const next = index + delta;
      if (next >= 0 && next < photos.length) onMove(next);
    },
    [index, photos.length, onMove],
  );

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;

      /* Without this the library keeps scrolling behind the overlay, so
         closing the photo lands somewhere other than where it opened. */
      event.preventDefault();
      step(event.key === 'ArrowRight' ? 1 : -1);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  if (!photo) return null;

  /* Rendered into body on purpose: the scroller it would otherwise live
     in is a positioned, z-indexed element, and that stacking context
     traps the overlay underneath the rail and toolbar — which hid these
     controls, including the only way to close the photo. */
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
    >
      {/* The chrome floats over the photo rather than sitting in a bar
          above it: an edge-to-edge strip reads as a title bar, and the
          glass only says glass once there is an image behind it. */}
      <header className="glass-media absolute inset-x-4 top-4 z-10 flex items-center gap-3 rounded-lg py-2.5 pl-5 pr-2.5">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[12.5px] leading-tight text-ink">{photo.name}</p>
          <p className="eyebrow mt-1 truncate text-ink-3">
            {formatDate(photo.takenAt)} · {formatSize(photo.size)}
          </p>
        </div>

        <span className="eyebrow shrink-0 rounded-full bg-[var(--glass-bg-strong)] px-3 py-1.5 text-ink-2">
          {index + 1} / {photos.length}
        </span>

        {/* Grouped the way macOS groups window actions: one recessed
            track, so the buttons read as one control and not as three
            loose icons drifting in the bar. */}
        <div className="flex shrink-0 items-center gap-0.5 rounded-full bg-[rgba(0,0,0,0.22)] p-1">
          <button
            type="button"
            onClick={() => onToggleFavorite(photo.path)}
            aria-label={favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            className="control h-9 w-9"
          >
            {favorite ? <PiStarFill className="text-accent" /> : <PiStar />}
          </button>

          <button
            type="button"
            onClick={() => onDelete(photo.path)}
            aria-label="Mover a la papelera"
            className="control h-9 w-9"
          >
            <PiTrashBold />
          </button>

          <button type="button" onClick={onClose} aria-label="Cerrar" className="control h-9 w-9">
            <PiXBold />
          </button>
        </div>
      </header>

      <div className="absolute inset-0 flex items-center justify-center px-24 pb-8 pt-28">
        {photo.kind === 'video' ? (
          <video
            key={photo.path}
            src={mediaUrl(photo.path)}
            controls
            className="max-h-full max-w-full rounded-md shadow-lg"
          />
        ) : (
          <img
            key={photo.path}
            src={mediaUrl(photo.path)}
            alt={photo.name}
            className="max-h-full max-w-full rounded-md object-contain shadow-lg"
          />
        )}
      </div>

      <StepButton
        onClick={() => step(-1)}
        disabled={index === 0}
        label="Anterior"
        className="left-5"
      >
        <PiCaretLeftBold />
      </StepButton>

      <StepButton
        onClick={() => step(1)}
        disabled={index === photos.length - 1}
        label="Siguiente"
        className="right-5"
      >
        <PiCaretRightBold />
      </StepButton>
    </div>,
    document.body,
  );
};

const StepButton = ({ onClick, disabled, label, className, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`glass-media control absolute top-1/2 z-10 h-12 w-12 -translate-y-1/2 rounded-full text-[15px] transition-opacity duration-300 ease-glass disabled:pointer-events-none disabled:opacity-0 ${className}`}
  >
    {children}
  </button>
);

export default Lightbox;
