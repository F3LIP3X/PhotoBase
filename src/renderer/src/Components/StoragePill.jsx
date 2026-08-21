import { PiHardDrivesFill } from 'react-icons/pi';
import { STORAGE } from '../data/library';

const StoragePill = () => {
  const { usedGB, quotaGB, warnAt } = STORAGE;
  const ratio = usedGB / quotaGB;
  const nearLimit = ratio >= warnAt;

  return (
    <div
      className="glass absolute bottom-4 right-4 z-20 flex items-center gap-3 rounded-full py-2.5 pl-4 pr-5"
      title={nearLimit ? 'Cerca del límite: las importaciones se bloquearán al llegar' : undefined}
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
        {usedGB} / {quotaGB} GB
      </span>
    </div>
  );
};

export default StoragePill;
