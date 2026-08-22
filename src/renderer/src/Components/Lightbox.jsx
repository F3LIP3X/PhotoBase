import { useCallback, useEffect } from 'react';
import {
  PiXBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiStarFill,
  PiStar,
  PiTrashBold,
} from 'react-icons/pi';
import { mediaUrl } from '../hooks/useLibrary';

const isVideo = (name) => /\.(mp4|mov|m4v|3gp)$/i.test(name);

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
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, step]);

  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
    >
      <header className="glass flex items-center gap-3 px-5 py-3">
        <p className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-2">{photo.name}</p>
        <span className="eyebrow text-ink-3">
          {index + 1} / {photos.length}
        </span>

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
      </header>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={index === 0}
          aria-label="Anterior"
          className="control absolute left-5 h-11 w-11 bg-[var(--glass-bg)] disabled:opacity-20"
        >
          <PiCaretLeftBold />
        </button>

        {isVideo(photo.name) ? (
          <video
            key={photo.path}
            src={mediaUrl(photo.path)}
            controls
            className="max-h-full max-w-full rounded-md"
          />
        ) : (
          <img
            key={photo.path}
            src={mediaUrl(photo.path)}
            alt={photo.name}
            className="max-h-full max-w-full rounded-md object-contain"
          />
        )}

        <button
          type="button"
          onClick={() => step(1)}
          disabled={index === photos.length - 1}
          aria-label="Siguiente"
          className="control absolute right-5 h-11 w-11 bg-[var(--glass-bg)] disabled:opacity-20"
        >
          <PiCaretRightBold />
        </button>
      </div>
    </div>
  );
};

export default Lightbox;
