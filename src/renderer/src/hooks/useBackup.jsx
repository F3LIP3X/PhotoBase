import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const bridge = () => globalThis.api?.backup ?? null;
const LOG_LIMIT = 80;

/* One line of "what is happening right now", derived from a progress
   update. A folder that reports itself again with a higher count
   replaces its own line rather than adding a new one — otherwise a big
   folder buries the rest of the log under itself. */
function describe(update) {
  if (update?.phase === 'scan') {
    return {
      key: `scan:${update.path}`,
      at: Date.now(),
      text: update.path,
      meta: `${(update.found ?? 0).toLocaleString('es-ES')} archivos`,
    };
  }

  if (update?.phase === 'planned') {
    return {
      key: 'planned',
      at: Date.now(),
      text: 'Lectura terminada',
      meta: `${update.planned} nuevos · ${update.skipped} ya estaban`,
    };
  }

  if (update?.phase === 'copy' && update.name) {
    return { key: `copy:${update.name}`, at: Date.now(), text: update.name, meta: null };
  }

  return null;
}

/* The copy runs in the main process and outlives any screen, so its
   state has to live above the router. Kept inside a page, it vanished the
   moment the user changed tab — the copy carried on, but the app looked
   like it had forgotten. */
const BackupContext = createContext(null);

export function useBackup() {
  const value = useContext(BackupContext);
  if (!value) throw new Error('useBackup necesita estar dentro de <BackupProvider>');
  return value;
}

export function BackupProvider({ children }) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [events, setEvents] = useState([]);
  const [startedAt, setStartedAt] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [deviceName, setDeviceName] = useState(null);
  const live = useRef(true);

  /* A reload lands here with a copy already in flight, and main is the
     only one that knows. */
  useEffect(() => {
    const api = bridge();
    if (!api?.status) return undefined;

    let alive = true;
    api.status().then((state) => {
      if (!alive || !state?.running) return;
      setRunning(true);
      setDeviceName(state.deviceName);
      setStartedAt((current) => current ?? Date.now());
    });

    const unsubscribe = api.onState((state) => {
      if (!alive) return;
      setRunning(Boolean(state?.running));
      setDeviceName(state?.deviceName ?? null);
      if (state?.running) setStartedAt((current) => current ?? Date.now());
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    live.current = true;
    const api = bridge();
    if (!api) return undefined;

    const unsubscribe = api.onProgress((update) => {
      if (!live.current) return;

      setProgress(update);

      const entry = describe(update);
      if (!entry) return;

      setEvents((current) => {
        const last = current[current.length - 1];
        if (last?.key === entry.key) return [...current.slice(0, -1), entry];
        return [...current, entry].slice(-LOG_LIMIT);
      });
    });

    return () => {
      live.current = false;
      unsubscribe();
    };
  }, []);

  const start = useCallback(async (deviceName) => {
    const api = bridge();
    if (!api) return;

    setRunning(true);
    setError(null);
    setResult(null);
    setProgress(null);
    setEvents([]);
    setStartedAt(Date.now());
    setDeviceName(deviceName);

    try {
      const outcome = await api.start(deviceName);
      if (live.current) setResult(outcome);
    } catch (cause) {
      if (live.current) setError(cause?.message ?? 'La copia no pudo completarse.');
    } finally {
      if (live.current) {
        setRunning(false);
        setProgress(null);
      }
    }
  }, []);

  /* The log outlives the run on purpose: when something goes wrong, the
     last thing it was doing is the first thing worth reading. */
  const value = useMemo(
    () => ({ start, running, deviceName, progress, events, startedAt, result, error }),
    [start, running, deviceName, progress, events, startedAt, result, error],
  );

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>;
}
