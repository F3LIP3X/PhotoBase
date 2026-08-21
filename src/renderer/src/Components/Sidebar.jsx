import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AiFillHome, AiFillFolder, AiFillStar, AiFillDelete, AiFillCloud } from 'react-icons/ai';
import ImgLogo from '../assets/Icon.png';

const NAV_ITEMS = [
  { to: '/fotos', icon: AiFillHome, label: 'Fotos' },
  { to: '/explorar', icon: AiFillFolder, label: 'Explorar' },
  { to: '/compartido', icon: AiFillFolder, label: 'Compartido' },
  { to: '/favoritos', icon: AiFillStar, label: 'Favoritos' },
  { to: '/papelera', icon: AiFillDelete, label: 'Papelera' },
];

const Sidebar = () => {
  const { pathname } = useLocation();

  return (
    <aside className="glass flex w-64 flex-col rounded-[var(--radius-lg)] p-4">
      <Link to="/" className="flex items-center gap-3 pb-4">
        <img src={ImgLogo} alt="PhotoBase" className="h-9 w-9 rounded-[var(--radius-sm)]" />
        <span className="font-semibold tracking-tight text-ink">PhotoBase</span>
      </Link>

      <nav className="flex-1 border-t border-[var(--glass-border)] pt-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent-soft text-ink'
                      : 'text-ink-soft hover:bg-[var(--glass-fill-strong)] hover:text-ink'
                  }`}
                >
                  <Icon className="text-lg text-accent" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <StorageInfo />
    </aside>
  );
};

const StorageInfo = () => (
  <div className="border-t border-[var(--glass-border)] pt-4">
    <p className="flex items-center gap-2 text-sm text-ink-soft">
      <AiFillCloud className="text-accent" size={18} />
      67 GB de 100 GB usados
    </p>
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--glass-fill-strong)]">
      <div className="h-full rounded-[var(--radius-pill)] bg-accent" style={{ width: '67%' }} />
    </div>
    <button className="mt-4 w-full rounded-[var(--radius-pill)] bg-accent py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90">
      Aumentar espacio
    </button>
  </div>
);

export default Sidebar;
