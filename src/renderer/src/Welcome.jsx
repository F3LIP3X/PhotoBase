import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './assets/Icon.png';
import ThemeToggle from './Components/ThemeToggle';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="ambient-backdrop" />
      <div className="ambient-overlay" />

      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="glass-strong relative flex w-full max-w-md flex-col items-center gap-6 rounded-[var(--radius-lg)] px-10 py-12 text-center">
        <img src={Icon} alt="PhotoBase" className="h-20 w-20 rounded-[var(--radius-md)]" />

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">PhotoBase</h1>
          <p className="text-sm text-ink-soft">
            Tus fotos y videos, guardados en tu propio equipo. Sin nube, sin cuentas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/gallery')}
          className="glass w-full rounded-[var(--radius-pill)] px-6 py-3 text-sm font-semibold tracking-wide text-ink transition-colors hover:bg-[var(--glass-fill-strong)]"
        >
          Entrar a PhotoBase
        </button>
      </div>
    </div>
  );
}

export default Welcome;
