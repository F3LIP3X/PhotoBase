import { useEffect, useState } from 'react';

/* The renderer may run in a plain browser tab during development, where
   the preload bridge does not exist. Treat that as "no support" rather
   than crashing the page. */
const bridge = () => globalThis.api?.devices ?? null;

export function useDevices() {
  const [devices, setDevices] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const devicesApi = bridge();
    if (!devicesApi) {
      setReady(true);
      return undefined;
    }

    let live = true;

    devicesApi.list().then((initial) => {
      if (live) {
        setDevices(initial);
        setReady(true);
      }
    });

    const unsubscribe = devicesApi.onChanged((next) => {
      if (live) setDevices(next);
    });

    return () => {
      live = false;
      unsubscribe();
    };
  }, []);

  return { devices, ready, supported: Boolean(bridge()) };
}
