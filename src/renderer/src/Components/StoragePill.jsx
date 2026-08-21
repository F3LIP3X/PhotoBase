import { PiHardDrivesFill } from 'react-icons/pi';

const USED_GB = 67;
const QUOTA_GB = 100;
const WARN_AT = 0.9;

const StoragePill = () => {
  const ratio = USED_GB / QUOTA_GB;
  const nearLimit = ratio >= WARN_AT;

  return (
    <div className="glass absolute bottom-4 right-4 z-20 flex items-center gap-3 rounded-full py-2.5 pl-4 pr-5">
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
        {USED_GB} / {QUOTA_GB} GB
      </span>
    </div>
  );
};

export default StoragePill;
