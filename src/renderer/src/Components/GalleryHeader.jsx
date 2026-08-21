import React, { useState } from 'react';
import { AiOutlineSearch } from 'react-icons/ai';
import ImgLogo from '../assets/Icon.png';
import ThemeToggle from './ThemeToggle';

const GalleryHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="glass mx-4 mt-4 flex items-center gap-4 rounded-[var(--radius-lg)] px-6 py-4">
      <h1 className="text-lg font-semibold tracking-tight text-ink">Galería</h1>

      <div className="ml-auto flex items-center gap-2 rounded-[var(--radius-pill)] bg-[var(--glass-fill)] px-4 py-2">
        <AiOutlineSearch className="text-ink-soft" />
        <input
          type="text"
          placeholder="Buscar por fecha, lugar o persona"
          className="w-64 bg-transparent text-sm text-ink placeholder-[var(--color-ink-soft)] outline-none"
        />
      </div>

      <ThemeToggle />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="h-10 w-10 overflow-hidden rounded-[var(--radius-pill)] border border-[var(--glass-border)]"
        >
          <img src={ImgLogo} alt="Perfil" className="h-full w-full object-cover" />
        </button>

        {menuOpen && (
          <ul className="glass-strong absolute right-0 top-12 w-44 rounded-[var(--radius-md)] p-2 text-sm text-ink">
            <li className="cursor-pointer rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--glass-fill-strong)]">
              Perfil
            </li>
            <li className="cursor-pointer rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--glass-fill-strong)]">
              Ajustes
            </li>
            <li className="cursor-pointer rounded-[var(--radius-sm)] px-3 py-2 hover:bg-[var(--glass-fill-strong)]">
              Cerrar sesión
            </li>
          </ul>
        )}
      </div>
    </header>
  );
};

export default GalleryHeader;
