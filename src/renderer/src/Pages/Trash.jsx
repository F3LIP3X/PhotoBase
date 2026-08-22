import { useCallback, useEffect, useState } from 'react';
import { PiTrashFill, PiArrowCounterClockwiseBold } from 'react-icons/pi';
import EmptyState from '../Components/EmptyState';
import { useShell } from '../hooks/useShell';

/* Nothing is purged silently: every item shows the days it has left, and
   emptying is the only thing that frees the space — so it is never
   automatic and always asks first. */
const Trash = () => {
  const { setSubtitle } = useShell();
  const [items, setItems] = useState(null);
  const [confirming, setConfirming] = useState(false);

  const reload = useCallback(async () => {
    const api = globalThis.api?.library;
    if (!api) return setItems([]);
    setItems(await api.trash());
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (!items) return;
    setSubtitle(items.length ? `${items.length} elementos · 30 días` : '');
  }, [setSubtitle, items]);

  const restore = async (stored) => {
    await globalThis.api.library.restore(stored);
    setConfirming(false);
    reload();
  };

  const empty = async () => {
    await globalThis.api.library.emptyTrash();
    setConfirming(false);
    reload();
  };

  if (!items) return null;

  if (!items.length) {
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

        {confirming ? (
          <span className="flex shrink-0 items-center gap-2">
            <span className="text-[12px] text-ink-2">¿Borrar {items.length} para siempre?</span>
            <button
              type="button"
              onClick={empty}
              className="rounded-full bg-accent-2 px-4 py-1.5 text-[12px] font-semibold text-white"
            >
              Sí, borrar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="rounded-full border border-[var(--glass-brd)] px-4 py-1.5 text-[12px] text-ink-2"
            >
              Cancelar
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="shrink-0 rounded-full border border-[var(--glass-brd)] px-4 py-1.5 text-[12px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent-2 hover:text-ink"
          >
            Vaciar papelera
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const urgent = item.daysLeft <= 7;
          return (
            <article
              key={item.stored}
              className="glass flex items-center gap-4 rounded-md px-5 py-3.5"
            >
              <span className="h-10 w-10 shrink-0 rounded-sm bg-[var(--frame)]" />

              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[13px] text-ink">{item.name}</p>
                <p className="eyebrow mt-1 truncate text-ink-3">{item.originalPath}</p>
              </div>

              <span className={`eyebrow shrink-0 ${urgent ? 'text-accent-2' : 'text-ink-3'}`}>
                {item.daysLeft} días
              </span>

              <button
                type="button"
                onClick={() => restore(item.stored)}
                aria-label={`Restaurar ${item.name}`}
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
