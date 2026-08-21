import { Link, useLocation } from 'react-router-dom';
import {
  PiImagesSquareFill,
  PiCompassFill,
  PiStarFill,
  PiTrashFill,
  PiUsbFill,
} from 'react-icons/pi';
import Mark from './Mark';

const NAV_ITEMS = [
  { to: '/fotos', icon: PiImagesSquareFill, label: 'Fotos' },
  { to: '/explorar', icon: PiCompassFill, label: 'Explorar' },
  { to: '/favoritos', icon: PiStarFill, label: 'Favoritos' },
  { to: '/dispositivos', icon: PiUsbFill, label: 'Dispositivos' },
  { to: '/papelera', icon: PiTrashFill, label: 'Papelera' },
];

const Rail = () => {
  const { pathname } = useLocation();

  return (
    <nav className="glass absolute bottom-4 left-4 top-4 z-20 flex w-[76px] flex-col items-center gap-1 rounded-lg py-4">
      <Link to="/" className="mb-3 shrink-0" aria-label="Inicio">
        <Mark size={28} />
      </Link>

      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const active = pathname === to;
        return (
          <Link
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`group relative flex h-[52px] w-[52px] flex-col items-center justify-center gap-1 rounded-sm transition-colors duration-200 ease-glass ${
              active ? 'bg-[var(--glass-bg-strong)]' : 'hover:bg-[var(--glass-bg-strong)]'
            }`}
          >
            {active && (
              <span className="absolute -left-[10px] top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-accent" />
            )}
            <Icon
              className={`text-[19px] transition-colors duration-200 ${
                active ? 'text-accent' : 'text-ink-3 group-hover:text-ink'
              }`}
            />
            <span
              className={`text-[9px] font-medium leading-none tracking-tight transition-colors duration-200 ${
                active ? 'text-ink' : 'text-ink-3'
              }`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Rail;
