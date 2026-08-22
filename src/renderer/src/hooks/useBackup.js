import { useCallback, useEffect, useRef, useState } from 'react';

const bridge = () => globalThis.api?.backup ?? null;

export function useBackup() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    const api = bridge();
    if (!api) return undefined;

    const unsubscribe = api.onProgress((update) => {
      if (live.current) setProgress(update);
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

  return { start, running, progress, result, error };
}
