import { useEffect } from 'react';
import { PiCaretRightBold } from 'react-icons/pi';
import { useShell } from '../hooks/useShell';
import { FACETS } from '../data/library';

/* Explorar is the metadata view: everything here is read off the files
   themselves, so the library organises itself without manual albums. */
const Explore = () => {
  const { setSubtitle } = useShell();

  useEffect(() => {
    setSubtitle('Agrupado por metadatos del archivo');
  }, [setSubtitle]);

  return (
    <div className="flex flex-col gap-8">
      {FACETS.map(({ title, entries }) => (
        <section key={title}>
          <h2 className="eyebrow mb-3 text-ink-3">{title}</h2>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
            {entries.map(({ label, count }) => (
              <button
                key={label}
                type="button"
                className="glass group flex items-center gap-3 rounded-md px-4 py-3.5 text-left transition-transform duration-300 ease-glass hover:-translate-y-0.5"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-medium text-ink">
                    {label}
                  </span>
                  <span className="eyebrow mt-0.5 block text-ink-3">
                    {count.toLocaleString('es-ES')} elementos
                  </span>
                </span>
                <PiCaretRightBold className="shrink-0 text-ink-3 transition-transform duration-300 ease-glass group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default Explore;
