import { useEffect, useState } from 'react';
import { PiCaretDownBold, PiListMagnifyingGlassBold } from 'react-icons/pi';
import { formatSize } from '../format';

/* The progress panel, shared between the Devices page and the overlay
   that covers the app while a copy runs. One copy of this, so the two
   never disagree about what is happening. */

/* Minutes and seconds, because the number that answers "is it stuck?" is
   how long it has been going, not what time it started. */
const elapsedOf = (from, now) => {
  const seconds = Math.max(0, Math.floor((now - from) / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

const PHASE_LABEL = {
  scan: 'Explorando el teléfono',
  planned: 'Preparando la copia',
};

export const BackupProgress = ({ backup, onSurface }) => {
  const { running, progress, events, startedAt } = backup;
  const [showLog, setShowLog] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  /* A clock that visibly moves is the cheapest proof that the app has not
     hung, and it costs one timer that only runs while a backup does. */
  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  const phase = progress?.phase;
  const copying = phase === 'copy';

  const done = progress?.copied ?? 0;
  const planned = progress?.planned ?? 0;
  const bytes = progress?.bytes ?? 0;
  const totalBytes = progress?.totalBytes ?? 0;

  /* Only the copy knows how much is left. The scan has no total to
     measure against, so its bar keeps moving rather than lying about a
     percentage. */
  const ratio = copying && totalBytes ? Math.min(1, bytes / totalBytes) : 0;
  const measured = copying && (totalBytes > 0 || planned > 0);

  const heading = copying
    ? `Copiando ${done} de ${planned}`
    : (PHASE_LABEL[phase] ?? 'Preparando…');

  const detail = copying
    ? progress?.name
    : phase === 'scan'
      ? `${progress.path} · ${(progress.found ?? 0).toLocaleString('es-ES')} archivos en ${(progress.folders ?? 0).toLocaleString('es-ES')} carpetas`
      : null;

  const seconds = startedAt ? (now - startedAt) / 1000 : 0;

  return (
    <div className={onSurface ? '' : 'glass mt-4 rounded-md px-5 py-4'}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[13px] text-ink">{heading}</p>
        <span className="eyebrow shrink-0 text-ink-3">
          {measured && totalBytes > 0 && `${formatSize(bytes)} / ${formatSize(totalBytes)} · `}
          {measured && `${Math.round(ratio * 100)} % · `}
          {startedAt && elapsedOf(startedAt, now)}
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--glass-brd)]">
        <div
          className={
            measured
              ? 'h-full rounded-full bg-accent transition-[width] duration-300 ease-glass'
              : 'h-1.5 w-1/3 animate-[sweep_1.6s_ease-in-out_infinite] rounded-full bg-accent'
          }
          style={measured ? { width: `${ratio * 100}%` } : undefined}
        />
      </div>

      {detail && <p className="eyebrow mt-2 truncate text-ink-3">{detail}</p>}

      {/* A full phone takes minutes to read, and a minute of silence is
          when people start wondering whether to pull the cable. */}
      {!copying && seconds > 45 && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-3">
          Leer un móvil lleno por USB tarda varios minutos. Mientras la lista de abajo
          siga moviéndose, está trabajando.
        </p>
      )}

      <ActivityLog events={events} open={showLog} onToggle={() => setShowLog((v) => !v)} />
    </div>
  );
};

/* The answer to "is it doing something or did it hang". Newest last, so
   the line that stopped moving is the one at the bottom. */
export const ActivityLog = ({ events, open, onToggle }) => (
  <div className="mt-3">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center gap-2 py-1 text-left transition-colors duration-200 hover:text-ink"
    >
      <PiListMagnifyingGlassBold className="shrink-0 text-ink-3" />
      <span className="eyebrow text-ink-3">{open ? 'Ocultar detalles' : 'Ver detalles'}</span>
      <span className="h-px flex-1 bg-[var(--glass-brd)]" />
      <PiCaretDownBold
        className={`shrink-0 text-ink-3 transition-transform duration-200 ease-glass ${
          open ? 'rotate-180' : ''
        }`}
      />
    </button>

    {open && (
      <ul className="scroll-thin mt-2 flex max-h-[220px] flex-col gap-1 overflow-y-auto rounded-sm bg-[rgba(0,0,0,0.16)] p-3">
        {events.map((entry) => (
          <li key={`${entry.key}-${entry.at}`} className="flex items-baseline gap-3 text-[12px]">
            <span className="eyebrow shrink-0 text-[10px] text-ink-3">
              {new Date(entry.at).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className="min-w-0 flex-1 truncate font-mono text-ink-2">{entry.text}</span>
            {entry.meta && <span className="shrink-0 text-ink-3">{entry.meta}</span>}
          </li>
        ))}
      </ul>
    )}
  </div>
);
