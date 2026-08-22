import { useEffect, useMemo, useState } from 'react';
import { PiStarFill, PiPlayFill, PiCheckBold, PiTrashBold } from 'react-icons/pi';
import Lightbox from './Lightbox';
import { thumbUrl } from '../hooks/useLibrary';

/* The kind travels with the photo from the library scan, so the grid
   never has to read a filename to know what it is holding. */
const extensionOf = (name) => name.slice(name.lastIndexOf('.') + 1).toUpperCase();

/* A video's still is pulled out of the file itself. When that fails —
   no ffmpeg, or a file nothing can open — the tile falls back to saying
   what it is rather than pointing an <img> at an .mp4. */
const Tile = ({ photo }) => {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <span className="flex h-full w-full items-center justify-center bg-[var(--frame)]">
        <PiPlayFill className="text-[20px] text-ink-3 transition-colors duration-300 ease-glass group-hover:text-accent" />
      </span>
    );
  }

  return (
    <img
      src={thumbUrl(photo.path)}
      alt={photo.name}
      loading="lazy"
      onError={() => setBroken(true)}
      className="h-full w-full object-cover"
    />
  );
};

const ContactSheet = ({ groups, library }) => {
  const [open, setOpen] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  /* Where the last plain click landed, so shift-click has something to
     reach back to. */
  const [anchor, setAnchor] = useState(null);
  const [working, setWorking] = useState(false);

  /* The viewer steps through every photo on screen, not just the month
     it was opened from. */
  const flat = groups.flatMap((group) => group.photos);
  const positions = useMemo(
    () => new Map(flat.map((photo, at) => [photo.path, at])),
    [flat],
  );

  const openAt = (photo) => setOpen(flat.findIndex((item) => item.path === photo.path));

  const leaveSelection = () => {
    setSelecting(false);
    setSelected(new Set());
    setAnchor(null);
  };

  useEffect(() => {
    if (!selecting) return undefined;
    const onKey = (event) => event.key === 'Escape' && leaveSelection();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selecting]);

  const pick = (photo, event) => {
    if (!selecting) {
      openAt(photo);
      return;
    }

    const at = positions.get(photo.path);

    setSelected((current) => {
      const next = new Set(current);

      /* Shift takes everything between the last click and this one,
         which is what "in a row" means for a wall of thumbnails. */
      if (event.shiftKey && anchor !== null) {
        const [from, to] = anchor < at ? [anchor, at] : [at, anchor];
        for (let i = from; i <= to; i += 1) next.add(flat[i].path);
        return next;
      }

      if (next.has(photo.path)) next.delete(photo.path);
      else next.add(photo.path);
      return next;
    });

    if (!event.shiftKey) setAnchor(at);
  };

  const removeSelected = async () => {
    if (!selected.size) return;
    setWorking(true);
    try {
      await library.removeMany([...selected]);
      leaveSelection();
    } finally {
      setWorking(false);
    }
  };

  /* Deleting keeps the viewer open and lands on the next photo, so a run
     of bad shots can be cleared without reopening each time. Removing an
     item shifts the list up, so the same index already points at the next
     one; only the last photo has to step back. */
  const deleteAndAdvance = async (path) => {
    const wasOnly = flat.length === 1;
    const wasLast = open === flat.length - 1;

    await library.remove(path);

    if (wasOnly) setOpen(null);
    else if (wasLast) setOpen(open - 1);
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--glass-brd)]" />
        {selecting ? (
          <button
            type="button"
            onClick={leaveSelection}
            className="eyebrow shrink-0 rounded-full border border-[var(--glass-brd)] px-4 py-1.5 text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink"
          >
            Cancelar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSelecting(true)}
            className="eyebrow shrink-0 rounded-full border border-[var(--glass-brd)] px-4 py-1.5 text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink"
          >
            Seleccionar
          </button>
        )}
      </div>

      {groups.map((group) => (
        <section key={group.id} className="mb-10 last:mb-0">
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="text-[15px] capitalize text-ink">{group.label}</h2>
            <span className="h-px flex-1 bg-[var(--glass-brd)]" />
            <span className="eyebrow text-ink-3">{group.count}</span>
          </div>

          <div className="grid auto-rows-[112px] grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2">
            {group.photos.map((photo) => (
              <button
                key={photo.path}
                type="button"
                onClick={(event) => pick(photo, event)}
                aria-pressed={selecting ? selected.has(photo.path) : undefined}
                className={`group relative overflow-hidden rounded-sm bg-[var(--frame)] shadow-sm transition-[transform,box-shadow] duration-300 ease-glass hover:z-10 hover:scale-[1.04] ${
                  selecting && selected.has(photo.path)
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg)]'
                    : ''
                }`}
              >
                <Tile photo={photo} />

                {photo.kind === 'video' && (
                  <>
                    <span className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/55 to-transparent" />
                    <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 text-white drop-shadow">
                      <PiPlayFill className="text-[11px]" />
                      <span className="eyebrow text-[9px]">{extensionOf(photo.name)}</span>
                    </span>
                  </>
                )}

                {selecting && (
                  <span
                    className={`absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-200 ${
                      selected.has(photo.path)
                        ? 'border-accent bg-accent text-accent-ink'
                        : 'border-white/70 bg-black/30 text-transparent'
                    }`}
                  >
                    <PiCheckBold className="text-[11px]" />
                  </span>
                )}

                {library.isFavorite(photo.path) && (
                  <span className="absolute right-1.5 top-1.5 text-accent drop-shadow">
                    <PiStarFill />
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      ))}

      {selecting && selected.size > 0 && (
        <div className="glass fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full py-2.5 pl-6 pr-2.5 shadow-lg">
          <span className="text-[13px] text-ink">
            {selected.size === 1 ? '1 seleccionada' : `${selected.size} seleccionadas`}
          </span>
          <button
            type="button"
            onClick={() => setSelected(new Set(flat.map((photo) => photo.path)))}
            className="eyebrow text-ink-3 transition-colors duration-200 hover:text-ink"
          >
            Todas
          </button>
          <button
            type="button"
            disabled={working}
            onClick={removeSelected}
            className="flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-accent-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
          >
            <PiTrashBold />
            {working ? 'Moviendo…' : 'A la papelera'}
          </button>
        </div>
      )}

      {open !== null && flat[open] && (
        <Lightbox
          photos={flat}
          index={open}
          favorite={library.isFavorite(flat[open]?.path)}
          onMove={setOpen}
          onClose={() => setOpen(null)}
          onToggleFavorite={library.toggleFavorite}
          onDelete={deleteAndAdvance}
        />
      )}
    </>
  );
};

export default ContactSheet;
