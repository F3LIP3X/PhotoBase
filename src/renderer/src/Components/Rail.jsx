import { Link, useLocation } from 'react-router-dom';
import { SECTIONS } from '../navigation';

const Rail = () => {
  const { pathname } = useLocation();

  return (
    /* No brand mark here: it read as a duplicate of the Fotos icon, and
       the toolbar already names the section. */
    <nav className="glass absolute bottom-4 left-4 top-4 z-20 flex w-[76px] flex-col items-center justify-center gap-1 rounded-lg py-4">
      {SECTIONS.map(({ path, label, icon: Icon }) => {
        const active = pathname === path;
        return (
          <Link
            key={path}
            to={path}
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
