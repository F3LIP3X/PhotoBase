import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PiXBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiStarFill,
  PiStar,
  PiTrashBold,
  PiInfoBold,
  PiFilmSlateBold,
  PiArrowSquareOutBold,
} from 'react-icons/pi';
import { mediaUrl } from '../hooks/useLibrary';
import { formatDate, formatSize } from '../format';
import MetadataPanel from './MetadataPanel';

/* Photos open here rather than in the Windows viewer: the library is the
   app's, and handing the file to another program loses the favourite and
   delete actions that belong beside it. */
const Lightbox = ({ photos, index, onClose, onMove, favorite, onToggleFavorite, onDelete }) => {
  const photo = photos[index];
  const [info, setInfo] = useState(false);
  const [unplayable, setUnplayable] = useState(false);
  const [playable, setPlayable] = useState(null);

  const step = useCallback(
    (delta) => {
      const next = index + delta;
      if (next >= 0 && next < photos.length) onMove(next);
    },
    [index, photos.length, onMove],
  );

  useEffect(() => {
    setUnplayable(false);
    setPlayable(null);
  }, [photo?.path]);

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
            onClick={() => setInfo((open) => !open)}
            aria-label="Ver metadatos"
            aria-pressed={info}
            className={`control h-9 w-9 ${info ? 'bg-[var(--glass-bg-strong)] text-ink' : ''}`}
          >
            <PiInfoBold />
          </button>

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

      <div
        className={`absolute inset-0 flex items-center justify-center pb-8 pt-28 transition-[padding] duration-500 ease-glass ${
          info ? 'pl-24 pr-[376px]' : 'px-24'
        }`}
      >
        {photo.kind === 'video' ? (
          unplayable && !playable ? (
            <UnplayableVideo photo={photo} onReady={setPlayable} />
          ) : (
            <video
              key={playable ?? photo.path}
              src={playable ?? mediaUrl(photo.path)}
              controls
              autoPlay
              onError={() => setUnplayable(true)}
              className="max-h-full max-w-full rounded-md shadow-lg"
            />
          )
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
        className={info ? 'right-[376px]' : 'right-5'}
      >
        <PiCaretRightBold />
      </StepButton>

      {info && <MetadataPanel photo={photo} onClose={() => setInfo(false)} />}
    </div>,
    document.body,
  );
};

/* A codec Chromium will not decode is not a broken file — phones record
   in HEVC by default and Chromium ships without the licence for it. The
   app carries ffmpeg, so it re-encodes a copy instead of shrugging. */
const UnplayableVideo = ({ photo, onReady }) => {
  const [working, setWorking] = useState(false);
  const [failed, setFailed] = useState(null);

  const convert = async () => {
    const api = globalThis.api?.library;
    if (!api?.playable) return;

    setWorking(true);
    setFailed(null);
    try {
      const name = await api.playable(photo.path);
      if (!name) {
        setFailed('No se pudo convertir este vídeo. Ábrelo con el reproductor del sistema.');
        return;
      }
      onReady(api.playableUrl(name));
    } catch (cause) {
      setFailed(cause?.message ?? 'No se pudo convertir este vídeo.');
    } finally {
      setWorking(false);
    }
  };

  const open = async () => {
    try {
      await globalThis.api?.library?.open(photo.path);
    } catch (cause) {
      setFailed(cause?.message ?? 'No se pudo abrir el archivo.');
    }
  };

  return (
    <div className="glass-media max-w-md rounded-lg px-7 py-7 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--glass-bg-strong)]">
        <PiFilmSlateBold className="text-[20px] text-ink-2" />
      </span>

      <h2 className="mt-4 text-[16px] text-ink">
        {working ? 'Convirtiendo el vídeo…' : 'Este vídeo necesita conversión'}
      </h2>

      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
        {working
          ? 'Se está creando una copia reproducible. Tarda lo que dure el vídeo, más o menos, y solo pasa la primera vez.'
          : 'El archivo está intacto: los móviles graban en HEVC y Chromium no trae ese códec. PhotoBase puede convertirlo.'}
      </p>

      {working ? (
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--glass-brd)]">
          <div className="h-1.5 w-1/3 animate-[sweep_1.6s_ease-in-out_infinite] rounded-full bg-accent" />
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={convert}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-accent-ink transition-opacity duration-200 hover:opacity-90"
          >
            Convertir y reproducir
          </button>
          <button
            type="button"
            onClick={open}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-brd)] px-4 py-2.5 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink"
          >
            Abrir fuera
            <PiArrowSquareOutBold />
          </button>
        </div>
      )}

      {failed && <p className="mt-3 text-[12.5px] text-accent-2">{failed}</p>}
    </div>
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
