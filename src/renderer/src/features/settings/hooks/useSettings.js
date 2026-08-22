import { useCallback, useEffect, useState } from 'react';

const bridge = () => globalThis.api?.settings ?? null;

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const api = bridge();
    if (!api) {
      setLoading(false);
      return;
    }

    let live = true;
    api.get().then((value) => {
      if (live) {
        setSettings(value);
        setLoading(false);
      }
    });

    return () => {
      live = false;
    };
  }, []);

  const save = useCallback(async (patch) => {
    const api = bridge();
    if (!api) return null;
    const next = await api.save(patch);
    setSettings(next);
    return next;
  }, []);

  const pickFolder = useCallback(async () => {
    const api = bridge();
    if (!api) return null;
    return api.pickFolder();
  }, []);

  return { settings, loading, save, pickFolder, supported: Boolean(bridge()) };
}
