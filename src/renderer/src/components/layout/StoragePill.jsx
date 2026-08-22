import { useEffect, useState } from 'react';
import { PiHardDrivesFill } from 'react-icons/pi';

const WARN_AT = 0.9;

const StoragePill = () => {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    const api = globalThis.api?.library;
    if (!api) return;

    let live = true;
    api.usage().then((value) => {
      if (live) setUsage(value);
    });

    return () => {
      live = false;
    };
  }, []);

  /* Nothing to promise until the library has been configured. */
  if (!usage?.quotaGB) return null;

  const { usedGB, quotaGB } = usage;
  const ratio = Math.min(usedGB / quotaGB, 1);
  const nearLimit = ratio >= WARN_AT;

  return (
    <div
      className="glass absolute bottom-4 right-4 z-20 flex items-center gap-3 rounded-full py-2.5 pl-4 pr-5"
      title={
        nearLimit
          ? 'Cerca del límite: las copias nuevas se detendrán al llegar'
          : undefined
      }
    >
      <PiHardDrivesFill className={nearLimit ? 'text-accent-2' : 'text-ink-3'} />

      <div className="h-1 w-24 overflow-hidden rounded-full bg-[var(--glass-brd)]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-glass"
          style={{
            width: `${ratio * 100}%`,
            background: nearLimit ? 'var(--accent-2)' : 'var(--accent)',
          }}
        />
      </div>

      <span className="eyebrow text-ink-2">
        {usedGB < 0.1 ? '0' : usedGB.toFixed(1)} / {quotaGB} GB
      </span>
    </div>
  );
};

export default StoragePill;
