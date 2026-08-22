import { useEffect, useState } from 'react';
import { PiCompassFill } from 'react-icons/pi';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';

const GB = 1024 ** 3;

/* Explorar reads the library as it is on disk: every figure here is
   derived from the scan, so nothing can drift from reality. */
const Explore = () => {
  const { setSubtitle } = useShell();
  const [data, setData] = useState(null);

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
    setSubtitle(`${data.total} elementos · ${(data.bytes / GB).toFixed(1)} GB`);
  }, [setSubtitle, data]);

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
              {facet.entries.map((entry) => (
                <div
                  key={`${facet.title}-${entry.label}`}
                  className="glass rounded-md px-4 py-3.5"
                >
                  <span className="block truncate text-[14px] font-medium capitalize text-ink">
                    {entry.label}
                  </span>
                  <span className="eyebrow mt-0.5 block text-ink-3">
                    {entry.count.toLocaleString('es-ES')} elementos
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
};

export default Explore;
