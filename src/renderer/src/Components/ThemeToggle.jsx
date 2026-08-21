import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
      className="glass flex h-10 w-10 items-center justify-center rounded-[var(--radius-pill)] text-ink transition-colors hover:bg-[var(--glass-fill-strong)]"
    >
      {isLight ? <FiMoon /> : <FiSun />}
    </button>
  );
};

export default ThemeToggle;
