import { useEffect } from 'react';
import { PiTrashFill, PiArrowCounterClockwiseBold } from 'react-icons/pi';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';
import { TRASH } from '../data/library';

/* Nothing is purged silently: every item shows how long it has left,
   and emptying the trash is the only thing that frees the space. */
const Trash = () => {
  const { setSubtitle } = useShell();

  useEffect(() => {
    setSubtitle(TRASH.length ? `${TRASH.length} elementos · se borran a los 30 días` : '');
  }, [setSubtitle]);

  if (!TRASH.length) {
    return (
      <EmptyState
        icon={PiTrashFill}
        title="La papelera está vacía"
        hint="Lo que elimines se guarda aquí 30 días antes de desaparecer, por si cambias de idea."
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="eyebrow text-ink-3">Pendientes de borrado</h2>
        <span className="h-px flex-1 bg-[var(--glass-brd)]" />
        <button
          type="button"
          className="rounded-full border border-[var(--glass-brd)] px-4 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink"
        >
          Vaciar papelera
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {TRASH.map(({ name, size, daysLeft }) => {
          const urgent = daysLeft <= 7;
          return (
            <article key={name} className="glass flex items-center gap-4 rounded-md px-5 py-3.5">
              <span className="h-10 w-10 shrink-0 rounded-sm bg-[var(--frame)]" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[13px] text-ink">{name}</p>
                <p className="eyebrow mt-1 text-ink-3">{size}</p>
              </div>

              <span
                className={`eyebrow shrink-0 ${urgent ? 'text-accent-2' : 'text-ink-3'}`}
              >
                {daysLeft} días
              </span>

              <button
                type="button"
                aria-label={`Restaurar ${name}`}
                className="control h-9 w-9 shrink-0"
              >
                <PiArrowCounterClockwiseBold />
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default Trash;
