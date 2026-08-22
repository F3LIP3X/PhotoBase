import { useState } from 'react';
import { PiStarFill, PiPlayFill } from 'react-icons/pi';
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

  /* The viewer steps through every photo on screen, not just the month
     it was opened from. */
  const flat = groups.flatMap((group) => group.photos);

  const openAt = (photo) => setOpen(flat.findIndex((item) => item.path === photo.path));

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
                onClick={() => openAt(photo)}
                className="group relative overflow-hidden rounded-sm bg-[var(--frame)] shadow-sm transition-transform duration-300 ease-glass hover:z-10 hover:scale-[1.04]"
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
