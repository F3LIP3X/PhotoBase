import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiFolderOpenBold,
  PiWarningFill,
  PiArrowCounterClockwiseBold,
  PiLockKeyFill,
  PiLockKeyOpenFill,
} from 'react-icons/pi';
import { useShell } from '../hooks/useShell';
import { formatSize } from '../format';

/* Colour follows the entity, not its size: Vídeos stays slot 3 whether it
   is the biggest bucket or the smallest, so the bar does not repaint
   itself every time the library changes. */
const SERIES = {
  Cámara: 'var(--series-1)',
  Capturas: 'var(--series-2)',
  Vídeos: 'var(--series-3)',
  Otras: 'var(--series-4)',
  Papelera: 'var(--series-other)',
  'Otros archivos': 'var(--series-other-2)',
};

const colorFor = (label) => SERIES[label] ?? 'var(--series-other-2)';

const WIPE_WORD = 'BORRAR';

const Settings = () => {
  const { setSubtitle } = useShell();
  const navigate = useNavigate();
  const [config, setConfig] = useState(null);
  const [storage, setStorage] = useState(null);

  const load = useCallback(async () => {
    const settingsApi = globalThis.api?.settings;
    const libraryApi = globalThis.api?.library;
    if (!settingsApi || !libraryApi) return;

    setConfig(await settingsApi.get());
    setStorage(await libraryApi.breakdown());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSubtitle('Biblioteca, almacenamiento y datos');
  }, [setSubtitle]);

  if (!config) return null;

  return (
    <div className="flex max-w-[720px] flex-col gap-8">
      <StorageSection storage={storage} quotaGB={config.quotaGB} />
      <LibrarySection config={config} onChange={() => navigate('/configurar')} />
      <PasswordSection
        hasPassword={config.hasPassword}
        onChanged={load}
        onLock={() => navigate('/bloqueo', { replace: true })}
      />
      <DangerSection onDone={() => navigate('/', { replace: true })} />
    </div>
  );
};

const StorageSection = ({ storage, quotaGB }) => {
  if (!storage) return null;

  const quotaBytes = (quotaGB ?? 0) * 1024 ** 3;
  const used = storage.usedBytes;
  const entries = storage.entries.filter((entry) => entry.bytes > 0);

  /* Segments are drawn against the cap, not against the total, so the
     empty tail is the headroom left — which is the number the quota is
     actually about. */
  const scale = quotaBytes > 0 ? quotaBytes : used || 1;
  const free = Math.max(0, scale - used);

  return (
    <section>
      <h2 className="eyebrow mb-3 text-ink-3">Almacenamiento</h2>

      <div className="glass rounded-md px-5 py-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[22px] font-display text-ink">{formatSize(used)}</p>
          {quotaGB > 0 && (
            <p className="eyebrow text-ink-3">de {quotaGB} GB · {formatSize(free)} libres</p>
          )}
        </div>

        <div className="mt-4 flex h-3 w-full gap-[2px]">
          {entries.map((entry) => (
            <span
              key={entry.label}
              title={`${entry.label} · ${formatSize(entry.bytes)}`}
              style={{
                flexBasis: `${(entry.bytes / scale) * 100}%`,
                background: colorFor(entry.label),
              }}
              className="min-w-[3px] rounded-[2px] first:rounded-l-full"
            />
          ))}
          <span className="flex-1 rounded-[2px] rounded-r-full bg-[var(--frame)]" />
        </div>

        {/* Every series is labelled with its own figure: identity is never
            carried by colour alone, and two of these hues sit below the
            contrast floor on the light surface. */}
        <ul className="mt-5 flex flex-col gap-2.5">
          {entries.map((entry) => (
            <li key={entry.label} className="flex items-center gap-3 text-[13px]">
              <span
                aria-hidden="true"
                style={{ background: colorFor(entry.label) }}
                className="h-2.5 w-2.5 shrink-0 rounded-full"
              />
              <span className="min-w-0 flex-1 truncate text-ink-2">{entry.label}</span>
              {entry.count > 0 && (
                <span className="eyebrow shrink-0 text-ink-3">
                  {entry.count.toLocaleString('es-ES')}
                </span>
              )}
              <span className="w-[76px] shrink-0 text-right font-mono text-[12px] text-ink">
                {formatSize(entry.bytes)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

const LibrarySection = ({ config, onChange }) => (
  <section>
    <h2 className="eyebrow mb-3 text-ink-3">Biblioteca</h2>

    <div className="glass flex items-center gap-4 rounded-md px-5 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-bg-strong)]">
        <PiFolderOpenBold className="text-[18px] text-accent" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[12.5px] text-ink">
          {config.libraryPath ?? 'Sin carpeta configurada'}
        </p>
        <p className="eyebrow mt-1 text-ink-3">Límite de {config.quotaGB ?? '—'} GB</p>
      </div>

      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-full border border-[var(--glass-brd)] px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink"
      >
        Cambiar
      </button>
    </div>
  </section>
);

/* The lock is a lock on the app, not on the files: that is said here in
   as many words, because a password field implies more protection than
   this one gives. */
const PasswordSection = ({ hasPassword, onChanged, onLock }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null);

  const reset = () => {
    setCurrent('');
    setNext('');
    setRepeat('');
  };

  const run = async (task, message) => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await task();
      reset();
      setDone(message);
      await onChanged();
    } catch (cause) {
      setError(cause?.message ?? 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  };

  const save = (event) => {
    event.preventDefault();
    if (next !== repeat) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }
    run(
      () => globalThis.api.auth.set(next, current),
      hasPassword ? 'Contraseña actualizada.' : 'Contraseña establecida.',
    );
  };

  return (
    <section>
      <h2 className="eyebrow mb-3 text-ink-3">Contraseña</h2>

      <div className="glass rounded-md px-5 py-5">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-bg-strong)]">
            {hasPassword ? (
              <PiLockKeyFill className="text-[18px] text-accent" />
            ) : (
              <PiLockKeyOpenFill className="text-[18px] text-ink-3" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-ink">
              {hasPassword ? 'PhotoBase pide contraseña al abrirse' : 'Sin contraseña'}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
              Impide que alguien abra PhotoBase en este equipo. No cifra los archivos: tu
              biblioteca sigue siendo una carpeta normal y quien llegue a ella desde el
              explorador puede ver las fotos igual.
            </p>
          </div>
        </div>

        <form onSubmit={save} className="mt-4 flex flex-col gap-2">
          {hasPassword && (
            <Field
              value={current}
              onChange={setCurrent}
              placeholder="Contraseña actual"
            />
          )}
          <Field
            value={next}
            onChange={setNext}
            placeholder={hasPassword ? 'Nueva contraseña' : 'Contraseña'}
          />
          <Field value={repeat} onChange={setRepeat} placeholder="Repite la contraseña" />

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={busy || !next || !repeat || (hasPassword && !current)}
              className="rounded-full bg-accent px-5 py-2 text-[13px] font-semibold text-accent-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-30"
            >
              {hasPassword ? 'Cambiar' : 'Establecer'}
            </button>

            {hasPassword && (
              <>
                <button
                  type="button"
                  disabled={busy || !current}
                  onClick={() =>
                    run(() => globalThis.api.auth.clear(current), 'Contraseña eliminada.')
                  }
                  className="rounded-full border border-[var(--glass-brd)] px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink disabled:opacity-40"
                >
                  Quitar contraseña
                </button>

                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await globalThis.api.auth.lock();
                    onLock();
                  }}
                  className="ml-auto rounded-full border border-[var(--glass-brd)] px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink disabled:opacity-40"
                >
                  Bloquear ahora
                </button>
              </>
            )}
          </div>
        </form>

        {error && <p className="mt-3 text-[13px] text-accent-2">{error}</p>}
        {done && <p className="mt-3 text-[13px] text-ink-2">{done}</p>}
      </div>
    </section>
  );
};

const Field = ({ value, onChange, placeholder }) => (
  <input
    type="password"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    aria-label={placeholder}
    className="h-10 w-full rounded-full bg-[var(--glass-bg-strong)] px-4 text-[13px] text-ink outline-none placeholder:text-ink-3"
  />
);

/* Two actions that are not variations of each other: one forgets, one
   destroys. They are kept apart on purpose, and only the second asks the
   user to type — a confirmation dialog is too easy to click through when
   the thing on the line is every photo they own. */
const DangerSection = ({ onDone }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [word, setWord] = useState('');

  const run = async (action) => {
    const api = globalThis.api?.settings;
    if (!api) return;

    setBusy(true);
    setError(null);
    try {
      await api[action]();
      onDone();
    } catch (cause) {
      setError(cause?.message ?? 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 className="eyebrow mb-3 text-ink-3">Zona de riesgo</h2>

      <div className="flex flex-col gap-3">
        <div className="glass flex items-center gap-4 rounded-md px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-bg-strong)]">
            <PiArrowCounterClockwiseBold className="text-[18px] text-ink-2" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-ink">Restablecer la configuración</p>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
              Borra los ajustes, el historial de copias y las miniaturas en caché. Tus
              fotos, favoritos y papelera se quedan exactamente como están.
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => run('reset')}
            className="shrink-0 rounded-full border border-[var(--glass-brd)] px-4 py-2 text-[13px] font-medium text-ink-2 transition-colors duration-200 hover:border-accent hover:text-ink disabled:opacity-50"
          >
            Restablecer
          </button>
        </div>

        <div className="rounded-md border border-accent-2 px-5 py-4">
          <div className="flex items-start gap-4">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--glass-bg-strong)]">
              <PiWarningFill className="text-[18px] text-accent-2" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium text-ink">Borrar la biblioteca entera</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
                Elimina del disco todas las fotos y vídeos copiados, la papelera incluida,
                y deja PhotoBase como recién instalado. No hay vuelta atrás: esto no pasa
                por la papelera de Windows.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <input
                  value={word}
                  onChange={(event) => setWord(event.target.value)}
                  placeholder={`Escribe ${WIPE_WORD} para confirmar`}
                  aria-label={`Escribe ${WIPE_WORD} para confirmar`}
                  className="h-9 min-w-0 flex-1 rounded-full bg-[var(--glass-bg-strong)] px-4 font-mono text-[12.5px] text-ink outline-none placeholder:font-sans placeholder:text-ink-3"
                />
                <button
                  type="button"
                  disabled={busy || word !== WIPE_WORD}
                  onClick={() => run('wipe')}
                  className="shrink-0 rounded-full bg-accent-2 px-5 py-2 text-[13px] font-semibold text-accent-ink transition-opacity duration-200 hover:opacity-90 disabled:opacity-30"
                >
                  Borrar todo
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="whitespace-pre-line rounded-md border border-accent-2 px-4 py-3 text-[13px] leading-relaxed text-ink-2">
            {error}
          </p>
        )}
      </div>
    </section>
  );
};

export default Settings;
