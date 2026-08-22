import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiShieldCheckFill, PiArrowRightBold } from 'react-icons/pi';
import Mark from './Components/Mark';
import ThemeToggle from './Components/ThemeToggle';
import { useSettings } from './hooks/useSettings';

function Welcome() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  /* A locked library never shows its front door: the welcome screen hands
     straight over to the lock. */
  useEffect(() => {
    if (settings?.hasPassword && !settings.unlocked) {
      navigate('/bloqueo', { replace: true });
    }
  }, [settings, navigate]);

  /* First run goes through setup; afterwards the button opens the
     library directly. */
  const enter = () => navigate(settings?.configured ? '/fotos' : '/configurar');

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

      <main className="relative z-10 flex max-w-xl flex-col items-center px-8 text-center">
        <span className="glass eyebrow inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-ink-2">
          <PiShieldCheckFill className="text-accent" />
          Sin conexión
        </span>

        <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.25rem)] text-ink">
          Tus fotos viven
          <br />
          en tu disco.
        </h1>

        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-2">
          PhotoBase organiza tu biblioteca leyendo los metadatos de cada archivo.
          Nada se sube, nada se sincroniza, nada sale de este equipo.
        </p>

        <button
          type="button"
          onClick={enter}
          className="group mt-9 inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-[14px] font-semibold text-accent-ink shadow-md transition-transform duration-300 ease-glass hover:-translate-y-0.5"
        >
          Abrir mi biblioteca
          <PiArrowRightBold className="transition-transform duration-300 ease-glass group-hover:translate-x-1" />
        </button>
      </main>
    </div>
  );
}

export default Welcome;
