import { useState } from 'react';
import { PiStarFill, PiPlayFill } from 'react-icons/pi';
import Lightbox from './Lightbox';
import { mediaUrl } from '../hooks/useLibrary';

const isVideo = (name) => /\.(mp4|mov|m4v|3gp)$/i.test(name);

const ContactSheet = ({ groups, library }) => {
  const [open, setOpen] = useState(null);

  /* The viewer steps through every photo on screen, not just the month
     it was opened from. */
  const flat = groups.flatMap((group) => group.photos);

  const openAt = (photo) => setOpen(flat.findIndex((item) => item.path === photo.path));

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
                <img
                  src={mediaUrl(photo.path)}
                  alt={photo.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />

                {isVideo(photo.name) && (
                  <span className="absolute bottom-1.5 left-1.5 text-white drop-shadow">
                    <PiPlayFill />
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

      {open !== null && (
        <Lightbox
          photos={flat}
          index={open}
          favorite={library.isFavorite(flat[open]?.path)}
          onMove={setOpen}
          onClose={() => setOpen(null)}
          onToggleFavorite={library.toggleFavorite}
          onDelete={async (path) => {
            setOpen(null);
            await library.remove(path);
          }}
        />
      )}
    </>
  );
};

export default ContactSheet;
