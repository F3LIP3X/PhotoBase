import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiLockKeyFill, PiArrowRightBold } from 'react-icons/pi';
import Mark from '../../../components/ui/Mark';
import ThemeToggle from '../../../components/ui/ThemeToggle';
import { useSettings } from '../hooks/useSettings';

/* The lock screen is the whole app until it is passed: main refuses every
   library channel while locked, so there is nothing behind this to reach
   by editing the URL. */
const Lock = () => {
  const navigate = useNavigate();
  const { settings, loading } = useSettings();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const field = useRef(null);

  useEffect(() => {
    field.current?.focus();
  }, []);

  /* Nothing to unlock: either there is no password, or this session has
     already been through here. */
  useEffect(() => {
    if (loading || !settings) return;
    if (!settings.hasPassword || settings.unlocked) {
      navigate(settings.configured ? '/fotos' : '/configurar', { replace: true });
    }
  }, [loading, settings, navigate]);

  const submit = async (event) => {
    event.preventDefault();

    const api = globalThis.api?.auth;
    if (!api) return;

    setBusy(true);
    setError(null);
    try {
      const ok = await api.unlock(password);
      if (!ok) {
        setError('Contraseña incorrecta.');
        setPassword('');
        field.current?.focus();
        return;
      }
      navigate(settings?.configured ? '/fotos' : '/configurar', { replace: true });
    } catch (cause) {
      setError(cause?.message ?? 'No se pudo desbloquear.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden">
      <div className="ambient">
        <span className="orb orb-1" />
        <span className="orb orb-2" />
        <span className="orb orb-3" />
      </div>

      <div className="absolute right-5 top-5 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute left-6 top-6 z-20 flex items-center gap-2.5">
        <Mark size={26} />
        <span className="text-[15px] font-semibold tracking-tight text-ink">PhotoBase</span>
      </div>

      <main className="relative z-10 flex w-full max-w-sm flex-col items-center px-8 text-center">
        <span className="glass flex h-14 w-14 items-center justify-center rounded-full">
          <PiLockKeyFill className="text-[22px] text-accent" />
        </span>

        <h1 className="mt-6 text-[clamp(1.75rem,4vw,2.25rem)] text-ink">Biblioteca bloqueada</h1>

        <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
          Introduce tu contraseña para abrir PhotoBase.
        </p>

        <form onSubmit={submit} className="mt-7 flex w-full flex-col gap-3">
          <input
            ref={field}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-label="Contraseña"
            aria-invalid={Boolean(error)}
            placeholder="Contraseña"
            className="glass h-12 w-full rounded-full px-5 text-center text-[14px] text-ink outline-none placeholder:text-ink-3"
          />

          <button
            type="submit"
            disabled={busy || !password}
            className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-full bg-accent px-7 text-[14px] font-semibold text-accent-ink shadow-md transition-transform duration-300 ease-glass hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40"
          >
            {busy ? 'Comprobando…' : 'Desbloquear'}
            <PiArrowRightBold className="transition-transform duration-300 ease-glass group-hover:translate-x-1" />
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-accent-2">
            {error}
          </p>
        )}
      </main>
    </div>
  );
};

export default Lock;
