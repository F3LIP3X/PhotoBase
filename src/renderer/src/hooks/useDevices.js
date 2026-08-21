import { useCallback, useEffect, useRef, useState } from 'react';

/* The renderer may run in a plain browser tab during development, where
   the preload bridge does not exist. Treat that as "no support" rather
   than crashing the page. */
const bridge = () => globalThis.api?.devices ?? null;

export function useDevices() {
  const [devices, setDevices] = useState([]);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const live = useRef(true);

  useEffect(() => {
    live.current = true;
    const devicesApi = bridge();

    if (!devicesApi) {
      setReady(true);
      return undefined;
    }

    devicesApi.list().then((initial) => {
      if (live.current) {
        setDevices(initial);
        setReady(true);
      }
    });

    const unsubscribe = devicesApi.onChanged((next) => {
      if (live.current) setDevices(next);
    });

    return () => {
      live.current = false;
      unsubscribe();
    };
  }, []);

  const refresh = useCallback(async () => {
    const devicesApi = bridge();
    if (!devicesApi) return;

    setRefreshing(true);
    try {
      const next = await devicesApi.refresh();
      if (live.current) setDevices(next);
    } finally {
      if (live.current) setRefreshing(false);
    }
  }, []);

  return { devices, ready, refreshing, refresh, supported: Boolean(bridge()) };
}
