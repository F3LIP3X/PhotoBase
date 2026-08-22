import { useEffect, useMemo, useState } from 'react';
import { PiCompassFill, PiCaretDownBold } from 'react-icons/pi';
import ContactSheet from '../components/ContactSheet';
import EmptyState from '../components/EmptyState';
import { useShell } from '../../../app/hooks/useShell';
import { useLibrary } from '../hooks/useLibrary';
import { formatSize } from '../../../shared/format';

/* Explorar reads the library as it is on disk: every figure here is
   derived from the scan, so nothing can drift from reality. */
const Explore = () => {
  const { setSubtitle } = useShell();
  const library = useLibrary();
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  /* Opening a facet mounts a grid of tiles, and mounting every grid up
     front would load the whole library at once. They stay mounted after
     the first open so closing one can animate instead of snapping. */
  const [seen, setSeen] = useState(() => new Set());

  useEffect(() => {
    const api = globalThis.api?.library;
    if (!api) return;

    let live = true;
    api.facets().then((value) => {
      if (live) setData(value);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!data) return;
    setSubtitle(`${data.total} elementos · ${formatSize(data.bytes)}`);
  }, [setSubtitle, data]);

  const toggle = (key) => {
    setSeen((current) => new Set(current).add(key));
    setOpen((current) => (current === key ? null : key));
  };

  if (!data) return null;

  if (!data.total) {
    return (
      <EmptyState
        icon={PiCompassFill}
        title="Nada que explorar todavía"
        hint="Cuando copies fotos del móvil aparecerán aquí agrupadas por año, tipo y mes."
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {data.facets
        .filter((facet) => facet.entries.length)
        .map((facet) => (
          <section key={facet.title}>
            <h2 className="eyebrow mb-3 text-ink-3">{facet.title}</h2>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {facet.entries.map((entry) => {
                const key = `${facet.title}-${entry.value}`;
                return (
                  <FacetCard
                    key={key}
                    entry={entry}
                    open={open === key}
                    onClick={() => toggle(key)}
                  />
                );
              })}
            </div>

            {facet.entries.map((entry) => {
              const key = `${facet.title}-${entry.value}`;
              return (
                <Drawer key={key} open={open === key}>
                  {seen.has(key) && (
                    <FacetPhotos entry={entry} groups={library.groups} library={library} />
                  )}
                </Drawer>
              );
            })}
          </section>
        ))}
    </div>
  );
};

const FacetCard = ({ entry, open, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={open}
    className={`glass group rounded-md px-4 py-3.5 text-left transition-[transform,background-color] duration-300 ease-glass hover:scale-[1.02] ${
      open ? 'glass-strong' : ''
    }`}
  >
    <div className="flex items-center gap-2">
      <span className="block min-w-0 flex-1 truncate text-[14px] font-medium capitalize text-ink">
        {entry.label}
      </span>
      <PiCaretDownBold
        className={`shrink-0 text-[12px] transition-[transform,color] duration-300 ease-glass ${
          open ? 'rotate-180 text-accent' : 'text-ink-3'
        }`}
      />
    </div>
    <span className="eyebrow mt-0.5 block text-ink-3">
      {entry.count.toLocaleString('es-ES')} {entry.count === 1 ? 'elemento' : 'elementos'}
    </span>
  </button>
);

/* Height cannot be transitioned to `auto`, but a grid row can go from
   0fr to 1fr — which is the same motion without hard-coding how tall the
   contents happen to be. */
const Drawer = ({ open, children }) => (
  <div
    className={`grid transition-[grid-template-rows,opacity,margin] duration-500 ease-glass ${
      open ? 'mt-4 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    }`}
  >
    <div className="overflow-hidden">{children}</div>
  </div>
);

/* The entry says what it selects, so filtering here never has to know
   how the facet was grouped in the first place. */
const FacetPhotos = ({ entry, groups, library }) => {
  const selected = useMemo(() => {
    if (entry.field === 'year') return groups.filter((group) => group.year === entry.value);
    if (entry.field === 'group') return groups.filter((group) => group.id === entry.value);

    return groups
      .map((group) => ({
        ...group,
        photos: group.photos.filter((photo) => photo.category === entry.value),
      }))
      .filter((group) => group.photos.length)
      .map((group) => ({ ...group, count: group.photos.length }));
  }, [entry, groups]);

  if (!selected.length) return null;

  return (
    <div className="glass rounded-md p-4">
      <ContactSheet groups={selected} library={library} />
    </div>
  );
};

export default Explore;
